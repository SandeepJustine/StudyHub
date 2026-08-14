import { Metadata } from 'next';
import { Calendar, MapPin, Users, Clock, BookOpen, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { PublicSponsorships } from '@/components/features/sponsorship/public-sponsorships';
import prisma from '@/lib/utils/prisma';

export const metadata: Metadata = {
  title: 'Events & Bootcamps | StudyHub',
  description: 'Join live revision bootcamps and events across Malawi',
};

async function getPublicEvents() {
  const events = await prisma.event.findMany({
    where: {
      status: 'upcoming',
      date: { gte: new Date() },
    },
    orderBy: { date: 'asc' },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    date: event.date,
    venue: event.venue,
    capacity: event.capacity,
    registered: event.registered,
    price: event.price,
    status: event.status,
  }));
}

export default async function EventsPage() {
  const events = await getPublicEvents();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'BOOTCAMP':
        return '🏕️';
      case 'WORKSHOP':
        return '🔧';
      case 'SEMINAR':
        return '🎤';
      default:
        return '📅';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'BOOTCAMP':
        return 'bg-red-100 text-red-800';
      case 'WORKSHOP':
        return 'bg-blue-100 text-blue-800';
      case 'SEMINAR':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-grey-light text-grey-dark';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Calendar size={24} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy">Events & Bootcamps</h1>
            <p className="text-grey-dark mt-1">
              Join live revision sessions and boost your exam preparation
            </p>
          </div>
        </div>

        <PublicSponsorships placements={['BETWEEN_SECTIONS']} />

        {events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={64} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-xl font-semibold text-navy mb-2">No Upcoming Events</h3>
            <p className="text-grey-dark">
              Check back soon for new bootcamps and events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} padding="lg" className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getEventIcon(event.type)}</span>
                    <Badge variant="neutral" size="sm" className={getEventColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  {event.price > 0 && (
                    <Badge variant="success" size="sm">
                      {formatCurrency(event.price)}
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-navy mb-2 line-clamp-2">
                  {event.title}
                </h3>

                {event.description && (
                  <p className="text-sm text-grey-dark mb-4 line-clamp-3">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-grey-dark">
                    <Clock size={14} className="text-navy" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <MapPin size={14} className="text-navy" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-grey-dark">
                    <Users size={14} className="text-navy" />
                    <span>
                      {event.registered} / {event.capacity} registered
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-grey-light">
                  <div className="flex items-center gap-1">
                    {event.registered >= event.capacity ? (
                      <Badge variant="warning" size="sm">Full</Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        {event.capacity - event.registered} spots left
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={event.registered >= event.capacity}
                  >
                    {event.registered >= event.capacity ? 'Join Waitlist' : 'Register'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
