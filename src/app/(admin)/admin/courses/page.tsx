'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Check, 
  X, 
  Plus, 
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

export default function AdminCoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="neutral">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Define columns for the Table component
  const columns = [
    {
      key: 'title',
      header: 'Title',
      accessor: (course: any) => <span className="font-medium text-navy">{course.title}</span>,
    },
    {
      key: 'instructor',
      header: 'Instructor',
      accessor: (course: any) => course.instructor, // Assuming instructor is a string or object with a name
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (course: any) => course.category, // Assuming category is a string
    },
    {
      key: 'price',
      header: 'Price (MWK)',
      accessor: (course: any) => course.price.toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (course: any) => getStatusBadge(course.status),
    },
    {
      key: 'enrollments',
      header: 'Enrollments',
      accessor: (course: any) => course.enrollments,
    },
    {
      key: 'revenueShare',
      header: 'Revenue Share',
      accessor: (course: any) => `${course.revenueShare}%`,
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (course: any) => course.createdAt, // Assuming it's already formatted or can be formatted here
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (course: any) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log('View course', course.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Edit course', course.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {course.status === 'PENDING' && (
                <>
                  <DropdownMenuItem className="text-green" onClick={() => console.log('Approve course', course.id)}>
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red" onClick={() => console.log('Reject course', course.id)}>
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      const response = await fetch(`/api/admin/courses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      // Assuming the API returns { courses: [...] } based on the placeholder code
      setCourses(data.courses || []); // Assuming data.courses is the array of courses
      setPagination(data.pagination || { page: 1, limit: 10, total: data.courses.length, totalPages: Math.ceil(data.courses.length / 10) });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Placeholder for actual API call
    const mockCourses = [
      { id: '1', title: 'MSCE Mathematics', instructor: 'Mr. John Doe', category: 'Mathematics', price: 15000, status: 'APPROVED', enrollments: 120, revenueShare: 70, createdAt: '2023-01-15' },
      { id: '2', title: 'JCE English Literature', instructor: 'Ms. Jane Smith', category: 'English', price: 12000, status: 'PENDING', enrollments: 50, revenueShare: 70, createdAt: '2023-02-20' },
      { id: '3', title: 'ICAM Financial Accounting', instructor: 'Dr. Alex Banda', category: 'Accounting', price: 30000, status: 'APPROVED', enrollments: 80, revenueShare: 80, createdAt: '2023-03-10' },
      { id: '4', title: 'TEVETA Electrical Installation', instructor: 'Eng. Mary Phiri', category: 'Technical', price: 25000, status: 'REJECTED', enrollments: 30, revenueShare: 70, createdAt: '2023-04-01' },
      { id: '5', title: 'MSCE Physical Science', instructor: 'Mr. John Doe', category: 'Science', price: 18000, status: 'APPROVED', enrollments: 95, revenueShare: 70, createdAt: '2023-05-05' },
    ];
    setCourses(mockCourses);
    setLoading(false);
  }, [searchQuery, statusFilter, pagination.page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>All Courses</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-grey-dark/50" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  className="w-[250px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={fetchCourses}><RefreshCw size={16} /></Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('APPROVED')}>
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('PENDING')}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('REJECTED')}>
                    Rejected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div> 
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
              <p>Error: {error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchCourses}
              >
                Retry
              </Button>
            </div>
          ) : (
            <Table
              data={courses}
              columns={columns}
              isLoading={loading}
              emptyMessage="No courses found."
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-grey-medium">
          Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} courses
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
