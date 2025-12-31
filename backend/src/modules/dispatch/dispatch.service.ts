import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  private async bookingIdFromToken(token: string) {
    const bookingId = await this.redis.get(this.tokenKey(token));
    if (!bookingId) throw new UnauthorizedException('Invalid or expired dispatch link');
    return bookingId;
  }

  private buildDispatchLink(token: string) {
    const domainRoot = (process.env.DOMAIN_ROOT ?? process.env.DOMAIN ?? 'yourdomain.com').trim();
    return `https://${domainRoot}/dispatch/${encodeURIComponent(token)}`;
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

    const token = randomBytes(32).toString('hex');
    const ttlSeconds = parseExpiresInToSeconds(process.env.DISPATCH_LINK_TTL ?? '24h', 24 * 60 * 60);
    await this.redis.set(this.tokenKey(token), bookingId, 'EX', ttlSeconds);

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

    const token = randomBytes(32).toString('hex');
    const ttlSeconds = parseExpiresInToSeconds(process.env.DISPATCH_LINK_TTL ?? '24h', 24 * 60 * 60);
    await this.redis.set(this.tokenKey(token), booking.id, 'EX', ttlSeconds);

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
    const bookingId = await this.bookingIdFromToken(token);

    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new UnauthorizedException('Invalid or expired dispatch link');

    const location = await this.bookingLocations.findOne({ where: { bookingId } });
    if (!location) throw new UnauthorizedException('Invalid or expired dispatch link');

    const trip = await this.trips.findOne({ where: { bookingId } });

    const driverId = trip?.driverId ?? booking.assignedDriverId ?? null;
    const latestDriverLocation = driverId
      ? await this.driverLocations.findOne({ where: { driverId }, order: { recordedAt: 'DESC' } })
      : null;

    const pickupLonLat = location.pickupPoint?.coordinates;
    const dropoffLonLat = location.dropoffPoint?.coordinates;

    const routeLonLat: [number, number][] | null = trip?.routeLine?.coordinates ?? null;
    const fallbackRoute = pickupLonLat && dropoffLonLat ? [pickupLonLat, dropoffLonLat] : null;

    return {
      ok: true as const,
      updatedAt: new Date().toISOString(),
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
              : null,
          }
        : null,
    };
  }

  async getPublicUpdates(token: string) {
    const bookingId = await this.bookingIdFromToken(token);

    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new UnauthorizedException('Invalid or expired dispatch link');

    const trip = await this.trips.findOne({ where: { bookingId } });
    const driverId = trip?.driverId ?? booking.assignedDriverId ?? null;

    const latestDriverLocation = driverId
      ? await this.driverLocations.findOne({ where: { driverId }, order: { recordedAt: 'DESC' } })
      : null;

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
      booking: { id: booking.id, status: booking.status },
      trip: trip
        ? {
            id: trip.id,
            status: trip.status,
            startedAt: trip.startedAt?.toISOString() ?? null,
            completedAt: trip.completedAt?.toISOString() ?? null,
          }
        : null,
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
              : null,
          }
        : null,
      telemetry: {
        distanceKm: booking.estimatedDistanceM ? toFixedOrNull(booking.estimatedDistanceM / 1000, 1) : null,
        durationMin: booking.estimatedDurationS ? Math.round(booking.estimatedDurationS / 60) : null,
      },
    };
  }
}
