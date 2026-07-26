import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, UserCheck, UserX, TrendingUp, TrendingDown } from 'lucide-react';

interface UserStatsProps {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  churnRate: number;
  usersByRole: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  usersByMonth: Array<{
    month: string;
    newUsers: number;
    activeUsers: number;
  }>;
}

export function UserStats({
  totalUsers,
  activeUsers,
  newUsersThisMonth,
  churnRate,
  usersByRole,
  usersByMonth,
}: UserStatsProps) {
  const roleColors: Record<string, string> = {
    STUDENT: 'bg-blue-600',
    INSTRUCTOR: 'bg-green',
    SCHOOL_ADMIN: 'bg-purple-600',
    CORPORATE_CLIENT: 'bg-orange-600',
    PLATFORM_ADMIN: 'bg-red',
    PARENT: 'bg-yellow-600',
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">Total Users</p>
              <p className="text-xl font-bold text-navy">{totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck size={20} className="text-green" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">Active Users</p>
              <p className="text-xl font-bold text-navy">{activeUsers.toLocaleString()}</p>
              <p className="text-xs text-green">
                <TrendingUp size={10} className="inline" />
                {((activeUsers / totalUsers) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">New This Month</p>
              <p className="text-xl font-bold text-navy">{newUsersThisMonth.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX size={20} className="text-red" />
            </div>
            <div>
              <p className="text-xs text-grey-medium">Churn Rate</p>
              <p className="text-xl font-bold text-navy">{churnRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users by Role */}
      <Card padding="lg">
        <h3 className="font-semibold text-navy mb-4">Users by Role</h3>
        <div className="space-y-4">
          {usersByRole.map((role) => (
            <div key={role.role}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey-dark">{role.role.replace(/_/g, ' ')}</span>
                <span className="font-medium text-navy">
                  {role.count.toLocaleString()} ({role.percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={role.percentage}
                className="h-2"
                variant={role.percentage > 50 ? 'success' : 'default'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Growth */}
      <Card padding="lg">
        <h3 className="font-semibold text-navy mb-4">Monthly User Growth</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-grey-light">
                <th className="text-left py-2 text-grey-medium font-medium">Month</th>
                <th className="text-right py-2 text-grey-medium font-medium">New Users</th>
                <th className="text-right py-2 text-grey-medium font-medium">Active Users</th>
                <th className="text-right py-2 text-grey-medium font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {usersByMonth.map((month, i) => (
                <tr key={i} className="border-b border-grey-light last:border-0">
                  <td className="py-2 text-grey-dark">{month.month}</td>
                  <td className="text-right py-2 text-grey-dark">{month.newUsers}</td>
                  <td className="text-right py-2 text-grey-dark">{month.activeUsers}</td>
                  <td className="text-right py-2">
                    <Badge variant={month.newUsers > (usersByMonth[i - 1]?.newUsers || 0) ? 'success' : 'error'} size="sm">
                      {i > 0
                        ? `${(((month.newUsers - usersByMonth[i - 1].newUsers) / usersByMonth[i - 1].newUsers) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}