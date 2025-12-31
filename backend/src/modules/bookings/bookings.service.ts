import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { BookingEntity } from '../../database/entities/booking.entity';
import { BookingLocationEntity } from '../../database/entities/booking-location.entity';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { Role } from '../../shared/enums/roles.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateBookingDto } from './dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity) private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(BookingLocationEntity) private readonly locations: Repository<BookingLocationEntity>,
    private readonly realtime: RealtimeGateway,
  ) {}

  /**
   * Generate a unique booking number in format B203, B204, etc.
   * Only called when payment is confirmed.
   */
  private async generateBookingNumber(): Promise<string> {
    // Find the last booking number that starts with 'B'
    // Only count bookings that have been paid (status >= Confirmed)
    const lastBooking = await this.bookings
      .createQueryBuilder('booking')
      .where("booking.booking_number LIKE 'B%'")
      .andWhere("booking.booking_number IS NOT NULL")
      .orderBy('booking.booking_number', 'DESC')
      .getOne();

    let nextNumber = 203; // Start from B203 as requested
    if (lastBooking?.bookingNumber) {
      // Extract number from B203 -> 203
      const currentNumber = parseInt(lastBooking.bookingNumber.substring(1), 10);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    return `B${nextNumber}`;
  }

  async createBooking(customerId: string, dto: CreateBookingDto) {
    // Don't generate booking number yet - wait for payment confirmation
    const booking = this.bookings.create({
      customerId,
      bookingNumber: null, // Will be assigned after payment
      status: BookingStatus.Created,
      scheduledPickupAt: dto.scheduledPickupAt ? new Date(dto.scheduledPickupAt) : null,
      notes: dto.notes ?? null,
      currency: 'GBP',
    });

    const created = await this.bookings.save(booking);

    const location = this.locations.create({
      bookingId: created.id,
      pickupAddress: dto.pickupAddress,
      dropoffAddress: dto.dropoffAddress,
      pickupPoint: { type: 'Point', coordinates: [dto.pickupLon, dto.pickupLat] },
      dropoffPoint: { type: 'Point', coordinates: [dto.dropoffLon, dto.dropoffLat] },
      pickupNotes: dto.pickupNotes ?? null,
      dropoffNotes: dto.dropoffNotes ?? null,
    });

    await this.locations.save(location);

    this.realtime.server?.to('admins').emit('new.booking.alert', {
      bookingId: created.id,
      customerId,
      pickupAddress: dto.pickupAddress,
      dropoffAddress: dto.dropoffAddress,
      createdAt: created.createdAt,
    });

    return {
      ...created,
      location,
    };
  }

  async getBooking(id: string) {
    const booking = await this.bookings.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    const location = await this.locations.findOne({ where: { bookingId: id } });

    return {
      ...booking,
      location,
    };
  }

  async getBookingForUser(userId: string, role: Role | undefined, bookingId: string) {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const isAdmin = role === Role.Admin || role === Role.SuperAdmin;
    const isOwnerCustomer = role === Role.Customer && booking.customerId === userId;
    const isAssignedDriver = role === Role.Driver && booking.assignedDriverId === userId;

    if (!isAdmin && !isOwnerCustomer && !isAssignedDriver) {
      throw new ForbiddenException();
    }

    const location = await this.locations.findOne({ where: { bookingId } });
    return {
      ...booking,
      location,
    };
  }

  async listBookingsForCustomer(customerId: string, limit = 50, offset = 0) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safeOffset = Math.max(offset, 0);

    const bookings = await this.bookings.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: safeOffset,
    });

    const ids = bookings.map((b) => b.id);
    const locations = ids.length
      ? await this.locations.find({ where: { bookingId: In(ids) } })
      : [];
    const byBookingId = new Map(locations.map((l) => [l.bookingId, l] as const));

    return bookings.map((b) => ({ ...b, location: byBookingId.get(b.id) ?? null }));
  }

  async listBookingsForAdmin(limit = 50, offset = 0) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safeOffset = Math.max(offset, 0);

    const bookings = await this.bookings.find({
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: safeOffset,
    });

    const ids = bookings.map((b) => b.id);
    const locations = ids.length
      ? await this.locations.find({ where: { bookingId: In(ids) } })
      : [];
    const byBookingId = new Map(locations.map((l) => [l.bookingId, l] as const));

    return bookings.map((b) => ({ ...b, location: byBookingId.get(b.id) ?? null }));
  }

  /**
   * Assign a booking number when payment is confirmed.
   * This ensures sequential numbering without gaps from unpaid bookings.
   */
  async assignBookingNumberOnPayment(bookingId: string): Promise<BookingEntity> {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Only assign if booking doesn't have a number yet
    if (!booking.bookingNumber) {
      booking.bookingNumber = await this.generateBookingNumber();
      await this.bookings.save(booking);
    }

    return booking;
  }

  /**
   * Update booking status and assign booking number if confirming payment.
   */
  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<BookingEntity> {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = status;

    // Assign booking number when payment is confirmed
    if (status === BookingStatus.Confirmed && !booking.bookingNumber) {
      booking.bookingNumber = await this.generateBookingNumber();
    }

    return this.bookings.save(booking);
  }
}
