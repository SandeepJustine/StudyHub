import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, GraduationCap, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

interface InstitutionStatsProps {
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalTeachers: number;
    coursesAssigned: number;
    averageProgress: number;
    studentsAtRisk: number;
    capacityUsed: number;
    maxCapacity: number;
    subscriptionTier: string;
    renewalDate: Date;
  };
}

export function InstitutionStats({ stats }: InstitutionStatsProps) {
  const capacityPercentage = (stats.capacityUsed / stats.maxCapacity) * 100;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">Students</p>
              <p className="text-xl font-bold text-navy">{stats.totalStudents}</p>
              <p className="text-xs text-green">{stats.activeStudents} active</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap size={20} className="text-green" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">Teachers</p>
              <p className="text-xl font-bold text-navy">{stats.totalTeachers}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">Courses</p>
              <p className="text-xl font-bold text-navy">{stats.coursesAssigned}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">Avg Progress</p>
              <p className="text-xl font-bold text-navy">{stats.averageProgress}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Capacity & Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="font-semibold text-navy mb-4">Student Capacity</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-grey-medium">{stats.capacityUsed} / {stats.maxCapacity} students</span>
            <span className={`font-medium ${capacityPercentage > 90 ? 'text-red' : 'text-navy'}`}>
              {capacityPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={capacityPercentage} variant={capacityPercentage > 90 ? 'error' : 'success'} />
          {capacityPercentage > 90 && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red">
              <AlertTriangle size={14} />
              <span>Near capacity limit. Consider upgrading your tier.</span>
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h3 className="font-semibold text-navy mb-4">Students at Risk</h3>
          {stats.studentsAtRisk > 0 ? (
            <div>
              <p className="text-3xl font-bold text-red mb-2">{stats.studentsAtRisk}</p>
              <p className="text-sm text-grey-dark">students need attention</p>
            </div>
          ) : (
            <div>
              <p className="text-3xl font-bold text-green mb-2">0</p>
              <p className="text-sm text-grey-dark">All students are on track</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}