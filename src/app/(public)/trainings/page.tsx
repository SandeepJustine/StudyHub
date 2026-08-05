import { BookOpen, Users, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import prisma from '@/lib/utils/prisma';

export const metadata = {
  title: 'Corporate Trainings | StudyHub',
  description: 'Explore corporate training packages from companies across Malawi',
};

async function getPublicTrainings() {
  return prisma.corporateContract.findMany({
    where: { status: 'active' },
    include: {
      client: {
        include: {
          user: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

interface TrainingContract {
  id: string;
  title: string;
  description?: string | null;
  employees: number;
  courses: any;
  totalAmount: number;
  status: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  client?: {
    id: string;
    companyName: string;
    logo?: string | null;
    user: {
      fullName: string;
      avatar?: string | null;
    };
  } | null;
}

export default async function PublicTrainingsPage() {
  const trainings = await getPublicTrainings() as TrainingContract[];

  const parsedTrainings = trainings.map((training) => {
    let parsedCourses: any[] = [];
    try {
      parsedCourses = JSON.parse(training.courses as string);
    } catch {
      parsedCourses = [];
    }
    return { ...training, courses: parsedCourses };
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-navy">Corporate Training Packages</h1>
            <p className="text-grey-dark mt-1">
              Browse training contracts from companies across Malawi
            </p>
          </div>
        </div>

        {parsedTrainings.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={64} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-xl font-semibold text-navy mb-2">No Training Packages Available</h3>
            <p className="text-grey-dark">
              Corporate training packages will appear here when they are published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {parsedTrainings.map((training) => (
              <Card key={training.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {training.client?.logo ? (
                        <img
                          src={training.client.logo}
                          alt={training.client.companyName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : training.client?.user.avatar ? (
                        <img
                          src={training.client.user.avatar}
                          alt={training.client.user.fullName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
                          <Building2 size={20} className="text-navy" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-navy text-lg">{training.title}</h3>
                        {training.client?.companyName && (
                          <p className="text-sm text-grey-dark">{training.client.companyName}</p>
                        )}
                        <p className="text-xs text-grey-medium mt-1">
                          by {training.client?.user.fullName || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">
                      {training.status}
                    </Badge>
                  </div>

                  {training.description && (
                    <p className="text-sm text-grey-dark mb-4 line-clamp-2">
                      {training.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <Users size={14} />
                      <span>{training.employees} employees enrolled</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <Calendar size={14} />
                      <span>
                        {new Date(training.startDate).toLocaleDateString()} -{' '}
                        {new Date(training.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-grey-dark">
                      <BookOpen size={14} />
                      <span>{training.courses?.length || 0} courses included</span>
                    </div>
                  </div>

                  {training.courses && training.courses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {training.courses.slice(0, 3).map((course: any) => (
                        <div
                          key={course.courseId}
                          className="flex items-center justify-between p-2 bg-grey-light/30 rounded-lg"
                        >
                          <span className="text-sm text-navy">{course.title}</span>
                          <div className="text-right">
                            <span className="text-xs text-grey-medium">
                              {course.quantity}x @ {formatCurrency(course.price)}
                            </span>
                            <p className="text-sm font-medium text-green">
                              {formatCurrency(course.total)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {training.courses.length > 3 && (
                        <p className="text-xs text-grey-medium text-center">
                          +{training.courses.length - 3} more courses
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-grey-light">
                    <p className="text-xl font-bold text-navy">
                      Total: {formatCurrency(training.totalAmount)}
                    </p>
                    <Button variant="outline" size="sm">
                      Contact Sales
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
