'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Upload,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

export default function SchoolAdminStudentsPage() {
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  const students = [
    { id: '1', name: 'John Phiri', email: 'john@example.com', grade: 'Form 4', subjects: ['Math', 'Physics'], avgScore: 72, status: 'active' },
    { id: '2', name: 'Mary Banda', email: 'mary@example.com', grade: 'Form 3', subjects: ['English', 'Biology'], avgScore: 85, status: 'active' },
    { id: '3', name: 'Peter Kamanga', email: 'peter@example.com', grade: 'Form 4', subjects: ['Chemistry', 'Math'], avgScore: 45, status: 'at_risk' },
    { id: '4', name: 'Grace Mwale', email: 'grace@example.com', grade: 'Form 2', subjects: ['Geography', 'History'], avgScore: 90, status: 'active' },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Student Name',
      accessor: (student: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
            <span className="text-sm font-medium text-navy">
              {student.name.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-navy">{student.name}</p>
            <p className="text-xs text-grey-medium">{student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      accessor: (student: any) => (
        <Badge variant="neutral">{student.grade}</Badge>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      accessor: (student: any) => (
        <div className="flex gap-1">
          {student.subjects.map((s: string) => (
            <Badge key={s} size="sm" variant="info">{s}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'avgScore',
      header: 'Avg Score',
      accessor: (student: any) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-grey-light rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                student.avgScore >= 70 ? 'bg-green' : student.avgScore >= 50 ? 'bg-yellow-500' : 'bg-red'
              }`}
              style={{ width: `${student.avgScore}%` }}
            />
          </div>
          <span className="text-sm font-medium">{student.avgScore}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (student: any) => (
        <Badge variant={student.status === 'active' ? 'success' : 'error'}>
          {student.status === 'active' ? 'Active' : 'At Risk'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (student: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><Eye size={14} /></Button>
          <Button variant="ghost" size="sm"><Edit size={14} /></Button>
          <Button variant="ghost" size="sm"><Trash2 size={14} className="text-red" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Students</h1>
          <p className="text-grey-dark mt-1">Manage your institution's students</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Upload size={16} />} onClick={() => setShowBulkImport(true)}>
            Bulk Import
          </Button>
          <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={() => setShowAddStudent(true)}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-grey-medium" />}
            />
          </div>
          <select
            className="px-4 py-2 border-2 border-grey-light rounded-lg text-sm"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="">All Grades</option>
            <option value="Form 1">Form 1</option>
            <option value="Form 2">Form 2</option>
            <option value="Form 3">Form 3</option>
            <option value="Form 4">Form 4</option>
          </select>
          <Button variant="outline" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button variant="outline" leftIcon={<Download size={16} />}>Export</Button>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            data={students}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        title="Add New Student"
        size="md"
      >
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Enter student name" />
          <Input label="Email" type="email" placeholder="student@example.com" />
          <Input label="Phone" placeholder="+265 888 000 000" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Grade</label>
              <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg">
                <option>Select grade</option>
                <option>Form 1</option>
                <option>Form 2</option>
                <option>Form 3</option>
                <option>Form 4</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-grey-dark">Exam Board</label>
              <select className="w-full px-4 py-3 border-2 border-grey-light rounded-lg">
                <option>Select board</option>
                <option>MSCE</option>
                <option>JCE</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-grey-dark">Subjects</label>
            <div className="grid grid-cols-2 gap-2">
              {['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography'].map(s => (
                <label key={s} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-grey-light" />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowAddStudent(false)}>Cancel</Button>
            <Button variant="primary">Add Student</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Bulk Import Students"
        size="md"
      >
        <div className="space-y-6">
          <div className="border-2 border-dashed border-grey-light rounded-xl p-12 text-center">
            <Upload size={48} className="mx-auto text-grey-medium mb-4" />
            <p className="text-grey-dark mb-2">Drag and drop your CSV file here</p>
            <p className="text-sm text-grey-medium mb-4">or</p>
            <Button variant="outline">Browse Files</Button>
          </div>

          <div className="bg-grey-light/50 rounded-lg p-4">
            <h4 className="font-semibold text-navy mb-2">CSV Format Requirements</h4>
            <p className="text-sm text-grey-dark mb-2">Your CSV file should include these columns:</p>
            <code className="text-xs bg-white px-3 py-2 rounded block">
              email, fullName, grade, examBoard, subjects (comma-separated)
            </code>
          </div>

          <div className="flex gap-3 justify-between">
            <Button variant="outline">Download Template</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>Cancel</Button>
              <Button variant="primary">Import Students</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}