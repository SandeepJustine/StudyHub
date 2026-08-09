import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// This is a placeholder. In a real app, you would fetch this data from an API.
const users = [
  { id: '1', name: 'John Student', email: 'student@studyhub.mw', role: 'STUDENT', status: 'Active' },
  { id: '2', name: 'Jane Instructor', email: 'instructor@studyhub.mw', role: 'INSTRUCTOR', status: 'Active' },
  { id: '3', name: 'Admin User', email: 'admin@studyhub.mw', role: 'PLATFORM_ADMIN', status: 'Active' },
];

export default function AdminUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table data={users} columns={[
          { key: 'name', header: 'Name', accessor: (u) => u.name },
          { key: 'email', header: 'Email', accessor: (u) => u.email },
          { key: 'role', header: 'Role', accessor: (u) => <Badge variant="neutral">{u.role}</Badge> },
        ]} />
      </CardContent>
    </Card>
  );
}