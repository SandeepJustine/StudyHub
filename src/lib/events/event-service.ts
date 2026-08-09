import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { paymentService } from '@/lib/payments/payment-service';
import { notificationService } from '@/lib/notifications/notification-service';
import { generateId } from '@/utils/helpers';

export class EventService {
  /**
   * Create event (bootcamp/live session)
   */
  async createEvent(data: {
    title: string;
    description?: string;
    type: 'BOOTCAMP' | 'WORKSHOP' | 'SEMINAR';
    subject?: string;
    date: Date;
    endDate?: Date;
    venue?: string;
    virtualLink?: string;
    capacity: number;
    price: number;
    materials?: any;
  }) {
    const event = await prisma.event.create({
      data: {
        ...data,
        status: 'upcoming',
      },
    });

    return event;
  }

  /**
   * Register for event
   */
  async registerForEvent(userId: string, eventId: string, paymentMethod?: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundError('Event');
    
    // Check capacity
    if (event.registered >= event.capacity) {
      throw new AppError('Event is full', 'EVENT_FULL', 400);
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (existing) {
      throw new AppError('Already registered', 'ALREADY_REGISTERED', 409);
    }

    // Process payment if required
    let transaction = null;
    if (event.price > 0 && paymentMethod) {
      const payment = await paymentService.processPayment({
        userId,
        amount: event.price,
        method: paymentMethod as any,
        metadata: {
          type: 'event',
          eventId,
          description: `Registration: ${event.title}`,
        },
      });

      transaction = await prisma.transaction.findUnique({
        where: { reference: payment.reference! },
      });
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        transactionId: transaction?.id,
      },
    });

    // Update event count
    await prisma.event.update({
      where: { id: eventId },
      data: { registered: { increment: 1 } },
    });

    // Generate QR code for check-in
    const qrData = this.generateCheckInQR(registration.id);

    // Send confirmation
    await notificationService.send({
      userId,
      type: 'EVENT_REGISTRATION',
      title: 'Event Registration Confirmed',
      message: `You're registered for ${event.title} on ${event.date.toLocaleDateString()}.`,
      priority: 'high',
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        venue: event.venue,
        qrCode: qrData,
      },
    });

    return {
      registration,
      qrCode: qrData,
    };
  }

  /**
   * Check-in for event (QR code or manual)
   */
  async checkIn(registrationId: string) {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) throw new NotFoundError('Registration');
    if (registration.attended) {
      throw new AppError('Already checked in', 'ALREADY_CHECKED_IN', 400);
    }

    return prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        attended: true,
        status: 'attended',
      },
    });
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(params?: {
    type?: string;
    subject?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, subject, page = 1, limit = 12 } = params || {};

    const where: any = {
      status: 'upcoming',
      date: { gte: new Date() },
    };
    if (type) where.type = type;
    if (subject) where.subject = subject;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Send event reminders
   */
  async sendEventReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await prisma.event.findMany({
      where: {
        status: 'upcoming',
        date: {
          gte: new Date(),
          lte: tomorrow,
        },
      },
      include: {
        registrations: {
          include: { user: true },
        },
      },
    });

    for (const event of events) {
      for (const registration of event.registrations) {
        await notificationService.send({
          userId: registration.userId,
          type: 'EVENT_REMINDER',
          title: `Reminder: ${event.title} Tomorrow`,
          message: `Your event "${event.title}" is tomorrow at ${event.date.toLocaleTimeString()}. Venue: ${event.venue || 'Online'}`,
          priority: 'high',
          channel: ['EMAIL', 'SMS'],
        });
      }
    }

    return { eventsReminded: events.length };
  }

  private generateCheckInQR(registrationId: string): string {
    // In production, generate actual QR code
    return `SH-CHECKIN-${registrationId}-${Date.now()}`;
  }
}