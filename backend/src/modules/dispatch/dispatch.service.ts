import { ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';

import { BookingEntity } from '../../database/entities/booking.entity';
import { BookingLocationEntity } from '../../database/entities/booking-location.entity';
import { TripEntity } from '../../database/entities/trip.entity';
import { DriverLocationEntity } from '../../database/entities/driver-location.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { REDIS_CLIENT, type RedisLike } from '../../shared/redis/redis.constants';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { parseExpiresInToSeconds } from '../../utils/duration';
import { EmailService } from '../../utils/email.service';

type DispatchTokenKind = 'customer' | 'driver';

type DispatchTokenSession = {
  bookingId: string;
  kind: DispatchTokenKind;
  createdAt: string;
};

type JourneyStatus = {
  status: string;
  updatedAt: string;
};

type LiveLocation = {
  lat: number;
  lon: number;
  heading?: number | null;
  speedMps?: number | null;
  accuracyM?: number | null;
  recordedAt: string;
};

function toFixedOrNull(n: number | null | undefined, digits = 1) {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  return Number(n.toFixed(digits));
}

@Injectable()
export class DispatchService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisLike,
    @InjectRepository(BookingEntity) private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(BookingLocationEntity) private readonly bookingLocations: Repository<BookingLocationEntity>,
    @InjectRepository(TripEntity) private readonly trips: Repository<TripEntity>,
    @InjectRepository(DriverLocationEntity) private readonly driverLocations: Repository<DriverLocationEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly email: EmailService,
  ) {}

  private tokenKey(token: string) {
    return `dispatch:token:${token}`;
  }

  private journeyStatusKey(bookingId: string) {
    return `dispatch:journeyStatus:${bookingId}`;
  }

  private customerLastSeenKey(bookingId: string) {
    return `dispatch:customer:lastSeen:${bookingId}`;
  }

  private customerLocationKey(bookingId: string) {
    return `dispatch:customer:location:${bookingId}`;
  }

  private driverLocationFallbackKey(bookingId: string) {
    return `dispatch:driver:location:${bookingId}`;
  }

  private dispatchTtlSeconds() {
    // Spec requires 10-day magic links. Allow override via env.
    return parseExpiresInToSeconds(process.env.DISPATCH_LINK_TTL ?? '10d', 10 * 24 * 60 * 60);
  }

  private async readTokenSession(token: string): Promise<{ session: DispatchTokenSession; rawValue: string }> {
    const raw = await this.redis.get(this.tokenKey(token));
    if (!raw) throw new UnauthorizedException('Invalid or expired dispatch link');

    // Backwards compatibility: older tokens stored plain bookingId.
    try {
      const parsed = JSON.parse(raw) as Partial<DispatchTokenSession>;
      if (parsed && typeof parsed === 'object' && typeof parsed.bookingId === 'string' && parsed.bookingId) {
        return {
          session: {
            bookingId: parsed.bookingId,
            kind: parsed.kind === 'driver' ? 'driver' : 'customer',
            createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
          },
          rawValue: raw,
        };
      }
    } catch {
      // ignore
    }

    return {
      session: { bookingId: raw, kind: 'customer', createdAt: new Date().toISOString() },
      rawValue: raw,
    };
  }

  private async renewToken(token: string, rawValue: string) {
    const ttlSeconds = this.dispatchTtlSeconds();
    await this.redis.set(this.tokenKey(token), rawValue, 'EX', ttlSeconds);
  }

  async resolveSession(token: string) {
    const { session, rawValue } = await this.readTokenSession(token);
    await this.renewToken(token, rawValue);
    return session;
  }

  private async bookingIdFromToken(token: string) {
    const session = await this.resolveSession(token);
    return session.bookingId;
  }

  private buildDispatchLink(token: string) {
    const domainRoot = (process.env.DOMAIN_ROOT ?? process.env.DOMAIN ?? 'yourdomain.com').trim();
    return `https://${domainRoot}/dispatch/${encodeURIComponent(token)}`;
  }

  private buildDriverLink(token: string) {
    const domainRoot = (process.env.DOMAIN_ROOT ?? process.env.DOMAIN ?? 'yourdomain.com').trim();
    return `https://${domainRoot}/driver/${encodeURIComponent(token)}`;
  }

  private async issueToken(bookingId: string, kind: DispatchTokenKind) {
    const token = randomBytes(32).toString('hex');
    const ttlSeconds = this.dispatchTtlSeconds();
    const session: DispatchTokenSession = { bookingId, kind, createdAt: new Date().toISOString() };
    const raw = JSON.stringify(session);
    await this.redis.set(this.tokenKey(token), raw, 'EX', ttlSeconds);
    return token;
  }

  private async setJourneyStatus(bookingId: string, status: string) {
    const ttlSeconds = this.dispatchTtlSeconds();
    const payload: JourneyStatus = { status, updatedAt: new Date().toISOString() };
    await this.redis.set(this.journeyStatusKey(bookingId), JSON.stringify(payload), 'EX', ttlSeconds);
    return payload;
  }

  async setJourneyStatusForBooking(bookingId: string, status: string) {
    return this.setJourneyStatus(bookingId, status);
  }

  private async getJourneyStatus(bookingId: string): Promise<JourneyStatus | null> {
    const raw = await this.redis.get(this.journeyStatusKey(bookingId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<JourneyStatus>;
      if (typeof parsed.status === 'string' && typeof parsed.updatedAt === 'string') {
        return { status: parsed.status, updatedAt: parsed.updatedAt };
      }
    } catch {
      // ignore
    }
    return null;
  }

  async touchCustomerLastSeen(bookingId: string) {
    const ttlSeconds = this.dispatchTtlSeconds();
    await this.redis.set(this.customerLastSeenKey(bookingId), new Date().toISOString(), 'EX', ttlSeconds);
  }

  async setCustomerLocation(bookingId: string, loc: Omit<LiveLocation, 'recordedAt'> & { recordedAt?: string }) {
    const payload: LiveLocation = {
      lat: loc.lat,
      lon: loc.lon,
      heading: loc.heading ?? null,
      speedMps: loc.speedMps ?? null,
      accuracyM: loc.accuracyM ?? null,
      recordedAt: loc.recordedAt ?? new Date().toISOString(),
    };
    // Customer location is ephemeral; keep shorter TTL.
    await this.redis.set(this.customerLocationKey(bookingId), JSON.stringify(payload), 'EX', 60 * 60);
    await this.touchCustomerLastSeen(bookingId);
    return payload;
  }

  async getCustomerLocation(bookingId: string): Promise<LiveLocation | null> {
    const raw = await this.redis.get(this.customerLocationKey(bookingId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<LiveLocation>;
      if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number' && typeof parsed.recordedAt === 'string') {
        return {
          lat: parsed.lat,
          lon: parsed.lon,
          heading: typeof parsed.heading === 'number' ? parsed.heading : null,
          speedMps: typeof parsed.speedMps === 'number' ? parsed.speedMps : null,
          accuracyM: typeof parsed.accuracyM === 'number' ? parsed.accuracyM : null,
          recordedAt: parsed.recordedAt,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }

  async setDriverLocationFallback(bookingId: string, loc: Omit<LiveLocation, 'recordedAt'> & { recordedAt?: string }) {
    const payload: LiveLocation = {
      lat: loc.lat,
      lon: loc.lon,
      heading: loc.heading ?? null,
      speedMps: loc.speedMps ?? null,
      accuracyM: loc.accuracyM ?? null,
      recordedAt: loc.recordedAt ?? new Date().toISOString(),
    };
    await this.redis.set(this.driverLocationFallbackKey(bookingId), JSON.stringify(payload), 'EX', 60 * 60);
    return payload;
  }

  private async getDriverLocationFallback(bookingId: string): Promise<LiveLocation | null> {
    const raw = await this.redis.get(this.driverLocationFallbackKey(bookingId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<LiveLocation>;
      if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number' && typeof parsed.recordedAt === 'string') {
        return {
          lat: parsed.lat,
          lon: parsed.lon,
          heading: typeof parsed.heading === 'number' ? parsed.heading : null,
          speedMps: typeof parsed.speedMps === 'number' ? parsed.speedMps : null,
          accuracyM: typeof parsed.accuracyM === 'number' ? parsed.accuracyM : null,
          recordedAt: parsed.recordedAt,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }

  async issueAndSendLink(bookingId: string, emailOverride?: string) {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const location = await this.bookingLocations.findOne({ where: { bookingId } });
    if (!location) throw new NotFoundException('Booking location not found');

    const customer = await this.users.findOne({ where: { id: booking.customerId } });
    const toEmail = (emailOverride ?? customer?.email ?? '').trim();
    if (!toEmail) {
      // Don’t fail hard: allow API call to return a link even if email is missing.
      // This keeps admin/testing flows usable.
    }

    const token = await this.issueToken(bookingId, 'customer');

    const link = this.buildDispatchLink(token);

    if (toEmail) {
      const subject = `Your TransferLane live journey link${booking.bookingNumber ? ` (${booking.bookingNumber})` : ''}`;
      const pickup = location.pickupAddress;
      const dropoff = location.dropoffAddress;
      const when = booking.scheduledPickupAt ? new Date(booking.scheduledPickupAt).toLocaleString() : 'Scheduled';

      await this.email.sendEmail({
        to: toEmail,
        subject,
        text: `Your live journey link: ${link}\n\nPickup: ${pickup}\nDrop-off: ${dropoff}\nPickup time: ${when}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2 style="margin:0 0 12px">Live journey tracking</h2>
            <p style="margin:0 0 12px">Use this secure link to view your trip status, ETA, and live location updates:</p>
            <p style="margin:0 0 18px"><a href="${link}" style="display:inline-block;padding:12px 16px;background:#C89D2B;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Open live journey</a></p>
            <div style="margin:0 0 10px;color:#444"><strong>Pickup:</strong> ${pickup}</div>
            <div style="margin:0 0 10px;color:#444"><strong>Drop-off:</strong> ${dropoff}</div>
            <div style="margin:0 0 10px;color:#444"><strong>Pickup time:</strong> ${when}</div>
            <p style="margin:18px 0 0;color:#666;font-size:12px">If you didn’t request this, you can ignore this email.</p>
          </div>
        `.trim(),
      });
    }

    const res: { ok: true; message: string; link?: string } = {
      ok: true,
      message: 'If the booking exists, a dispatch link will be sent.',
    };

    if (process.env.DISPATCH_LINK_RETURN_URL === 'true' || process.env.NODE_ENV !== 'production') {
      res.link = link;
    }

    return res;
  }

  async issueAndSendDriverLink(bookingId: string, emailOverride?: string) {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const location = await this.bookingLocations.findOne({ where: { bookingId } });
    if (!location) throw new NotFoundException('Booking location not found');

    const trip = await this.trips.findOne({ where: { bookingId } });
    const driverId = trip?.driverId ?? booking.assignedDriverId ?? null;
    const driver = driverId ? await this.users.findOne({ where: { id: driverId } }) : null;

    const toEmail = (emailOverride ?? driver?.email ?? '').trim();
    const token = await this.issueToken(bookingId, 'driver');
    const link = this.buildDriverLink(token);

    if (toEmail) {
      const subject = `Driver panel link${booking.bookingNumber ? ` (${booking.bookingNumber})` : ''}`;
      const pickup = location.pickupAddress;
      const dropoff = location.dropoffAddress;
      const when = booking.scheduledPickupAt ? new Date(booking.scheduledPickupAt).toLocaleString() : 'Scheduled';

      await this.email.sendEmail({
        to: toEmail,
        subject,
        text: `Open driver panel: ${link}\n\nPickup: ${pickup}\nDrop-off: ${dropoff}\nPickup time: ${when}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2 style="margin:0 0 12px">Driver panel</h2>
            <p style="margin:0 0 12px">Use this secure link to update live status and location for the journey:</p>
            <p style="margin:0 0 18px"><a href="${link}" style="display:inline-block;padding:12px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Open driver panel</a></p>
            <div style="margin:0 0 10px;color:#444"><strong>Pickup:</strong> ${pickup}</div>
            <div style="margin:0 0 10px;color:#444"><strong>Drop-off:</strong> ${dropoff}</div>
            <div style="margin:0 0 10px;color:#444"><strong>Pickup time:</strong> ${when}</div>
            <p style="margin:18px 0 0;color:#666;font-size:12px">If you didn’t request this, you can ignore this email.</p>
          </div>
        `.trim(),
      });
    }

    const res: { ok: true; message: string; link?: string } = {
      ok: true,
      message: 'If the booking exists, a driver panel link will be sent.',
    };

    if (process.env.DISPATCH_LINK_RETURN_URL === 'true' || process.env.NODE_ENV !== 'production') {
      res.link = link;
    }

    return res;
  }

  async requestMagicLinkByEmail(emailRaw: string, bookingNumberRaw?: string) {
    const email = emailRaw.trim().toLowerCase();
    const bookingNumber = bookingNumberRaw?.trim() || undefined;

    // Do not leak whether the user exists.
    const genericResponse: { ok: true; message: string; link?: string } = {
      ok: true,
      message: 'If a matching journey exists, a tracking link will be sent.',
    };

    const user = await this.users.findOne({ where: { email } });
    if (!user) return genericResponse;

    const qb = this.bookings
      .createQueryBuilder('b')
      .where('b.customer_id = :customerId', { customerId: user.id })
      .andWhere('b.status != :completed', { completed: BookingStatus.Completed })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.Cancelled });

    if (bookingNumber) {
      qb.andWhere('b.booking_number = :bookingNumber', { bookingNumber });
    }

    const booking = await qb.orderBy('b.updated_at', 'DESC').getOne();
    if (!booking) return genericResponse;

    const location = await this.bookingLocations.findOne({ where: { bookingId: booking.id } });
    if (!location) return genericResponse;

    const token = await this.issueToken(booking.id, 'customer');

    const link = this.buildDispatchLink(token);

    const subject = `Your TransferLane live journey link${booking.bookingNumber ? ` (${booking.bookingNumber})` : ''}`;
    const pickup = location.pickupAddress;
    const dropoff = location.dropoffAddress;
    const when = booking.scheduledPickupAt ? new Date(booking.scheduledPickupAt).toLocaleString() : 'Scheduled';

    await this.email.sendEmail({
      to: email,
      subject,
      text: `Your live journey link: ${link}\n\nPickup: ${pickup}\nDrop-off: ${dropoff}\nPickup time: ${when}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2 style="margin:0 0 12px">Live journey tracking</h2>
          <p style="margin:0 0 12px">Use this secure link to view your trip status, ETA, and live location updates:</p>
          <p style="margin:0 0 18px"><a href="${link}" style="display:inline-block;padding:12px 16px;background:#C89D2B;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Open live journey</a></p>
          <div style="margin:0 0 10px;color:#444"><strong>Pickup:</strong> ${pickup}</div>
          <div style="margin:0 0 10px;color:#444"><strong>Drop-off:</strong> ${dropoff}</div>
          <div style="margin:0 0 10px;color:#444"><strong>Pickup time:</strong> ${when}</div>
          <p style="margin:18px 0 0;color:#666;font-size:12px">If you didn’t request this, you can ignore this email.</p>
        </div>
      `.trim(),
    });

    if (process.env.DISPATCH_LINK_RETURN_URL === 'true' || process.env.NODE_ENV !== 'production') {
      genericResponse.link = link;
    }

    return genericResponse;
  }

  async getPublicSummary(token: string) {
    const session = await this.resolveSession(token);
    const bookingId = session.bookingId;

    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new UnauthorizedException('Invalid or expired dispatch link');

    const location = await this.bookingLocations.findOne({ where: { bookingId } });
    if (!location) throw new UnauthorizedException('Invalid or expired dispatch link');

    const trip = await this.trips.findOne({ where: { bookingId } });

    const driverId = trip?.driverId ?? booking.assignedDriverId ?? null;
    const latestDriverLocation = driverId
      ? await this.driverLocations.findOne({ where: { driverId }, order: { recordedAt: 'DESC' } })
      : null;

    const driverLocationFallback = !latestDriverLocation ? await this.getDriverLocationFallback(bookingId) : null;
    const journeyStatus = await this.getJourneyStatus(bookingId);

    if (session.kind === 'customer') {
      await this.touchCustomerLastSeen(bookingId);
    }

    const pickupLonLat = location.pickupPoint?.coordinates;
    const dropoffLonLat = location.dropoffPoint?.coordinates;

    const routeLonLat: [number, number][] | null = trip?.routeLine?.coordinates ?? null;
    const fallbackRoute = pickupLonLat && dropoffLonLat ? [pickupLonLat, dropoffLonLat] : null;

    return {
      ok: true as const,
      updatedAt: new Date().toISOString(),
      link: {
        kind: session.kind,
        createdAt: session.createdAt,
      },
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        scheduledPickupAt: booking.scheduledPickupAt?.toISOString() ?? null,
        estimatedDistanceM: booking.estimatedDistanceM,
        estimatedDurationS: booking.estimatedDurationS,
      },
      locations: {
        pickup: {
          address: location.pickupAddress,
          lat: pickupLonLat ? pickupLonLat[1] : null,
          lon: pickupLonLat ? pickupLonLat[0] : null,
        },
        dropoff: {
          address: location.dropoffAddress,
          lat: dropoffLonLat ? dropoffLonLat[1] : null,
          lon: dropoffLonLat ? dropoffLonLat[0] : null,
        },
      },
      trip: trip
        ? {
            id: trip.id,
            status: trip.status,
            startedAt: trip.startedAt?.toISOString() ?? null,
            completedAt: trip.completedAt?.toISOString() ?? null,
          }
        : null,
      journeyStatus,
      route: (routeLonLat ?? fallbackRoute)?.map(([lon, lat]) => ({ lat, lon })) ?? null,
      driver: driverId
        ? {
            id: driverId,
            location: latestDriverLocation
              ? {
                  lat: latestDriverLocation.location.coordinates[1],
                  lon: latestDriverLocation.location.coordinates[0],
                  heading: latestDriverLocation.headingDegrees ? Number(latestDriverLocation.headingDegrees) : null,
                  speedMps: latestDriverLocation.speedMps ? Number(latestDriverLocation.speedMps) : null,
                  accuracyM: latestDriverLocation.accuracyM ? Number(latestDriverLocation.accuracyM) : null,
                  recordedAt: latestDriverLocation.recordedAt.toISOString(),
                }
              : driverLocationFallback,
          }
        : null,
    };
  }

  async getPublicUpdates(token: string) {
    const session = await this.resolveSession(token);
    const bookingId = session.bookingId;

    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new UnauthorizedException('Invalid or expired dispatch link');

    const trip = await this.trips.findOne({ where: { bookingId } });
    const driverId = trip?.driverId ?? booking.assignedDriverId ?? null;

    const latestDriverLocation = driverId
      ? await this.driverLocations.findOne({ where: { driverId }, order: { recordedAt: 'DESC' } })
      : null;

    const driverLocationFallback = !latestDriverLocation ? await this.getDriverLocationFallback(bookingId) : null;
    const journeyStatus = await this.getJourneyStatus(bookingId);
    const customerLocation = await this.getCustomerLocation(bookingId);

    if (session.kind === 'customer') {
      await this.touchCustomerLastSeen(bookingId);
    }

    // Simple ETA logic (best-effort):
    // - If trip started and we have booking.estimatedDurationS: ETA = startedAt + duration
    // - Else if scheduledPickupAt: show that as “ETA to pickup”
    let etaIso: string | null = null;
    if (trip?.startedAt && booking.estimatedDurationS) {
      const eta = new Date(trip.startedAt.getTime() + booking.estimatedDurationS * 1000);
      etaIso = eta.toISOString();
    } else if (booking.scheduledPickupAt) {
      etaIso = booking.scheduledPickupAt.toISOString();
    }

    return {
      ok: true as const,
      updatedAt: new Date().toISOString(),
      link: {
        kind: session.kind,
        createdAt: session.createdAt,
      },
      booking: { id: booking.id, status: booking.status },
      trip: trip
        ? {
            id: trip.id,
            status: trip.status,
            startedAt: trip.startedAt?.toISOString() ?? null,
            completedAt: trip.completedAt?.toISOString() ?? null,
          }
        : null,
      journeyStatus,
      eta: etaIso,
      driver: driverId
        ? {
            id: driverId,
            location: latestDriverLocation
              ? {
                  lat: latestDriverLocation.location.coordinates[1],
                  lon: latestDriverLocation.location.coordinates[0],
                  heading: latestDriverLocation.headingDegrees ? Number(latestDriverLocation.headingDegrees) : null,
                  speedMps: latestDriverLocation.speedMps ? Number(latestDriverLocation.speedMps) : null,
                  accuracyM: latestDriverLocation.accuracyM ? Number(latestDriverLocation.accuracyM) : null,
                  recordedAt: latestDriverLocation.recordedAt.toISOString(),
                }
              : driverLocationFallback,
          }
        : null,
      customer: {
        location: customerLocation,
      },
      telemetry: {
        distanceKm: booking.estimatedDistanceM ? toFixedOrNull(booking.estimatedDistanceM / 1000, 1) : null,
        durationMin: booking.estimatedDurationS ? Math.round(booking.estimatedDurationS / 60) : null,
      },
    };
  }

  async updateStatusFromToken(token: string, status: string) {
    const session = await this.resolveSession(token);
    if (session.kind !== 'driver') throw new ForbiddenException('Driver link required');
    const payload = await this.setJourneyStatus(session.bookingId, status);
    return { ok: true as const, journeyStatus: payload };
  }
}
