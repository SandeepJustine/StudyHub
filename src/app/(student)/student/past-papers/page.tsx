import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Search, Calendar, Clock, Eye, Filter } from 'lucide-react';
import Link from 'next/link';

const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];
const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography', 'History', 'Agriculture'];

export default async function StudentPastPapersPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  // Fetch past papers from database
  let pastPapers: any[] = [];
  try {
    pastPapers = await prisma.contentItem.findMany({
      where: { type: 'PAST_PAPER', status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (error) {
    console.error('Failed to fetch past papers:', error);
    // Mock data
    pastPapers = [
      { id: '1', title: 'MSCE Mathematics 2024 Paper 1', subject: 'Mathematics', examBoard: 'MSCE', year: 2024, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2024-06-15') },
      { id: '2', title: 'MSCE Mathematics 2024 Paper 2', subject: 'Mathematics', examBoard: 'MSCE', year: 2024, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2024-06-15') },
      { id: '3', title: 'MSCE English 2023 Paper 1', subject: 'English', examBoard: 'MSCE', year: 2023, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2023-06-10') },
      { id: '4', title: 'MSCE Physics 2024 Paper 1', subject: 'Physics', examBoard: 'MSCE', year: 2024, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2024-06-12') },
      { id: '5', title: 'MSCE Biology 2023 Paper 2', subject: 'Biology', examBoard: 'MSCE', year: 2023, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2023-06-08') },
      { id: '6', title: 'JCE Mathematics 2024', subject: 'Mathematics', examBoard: 'JCE', year: 2024, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2024-05-20') },
      { id: '7', title: 'ICAM Accounting 2024', subject: 'Accounting', examBoard: 'ICAM', year: 2024, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2024-04-15') },
      { id: '8', title: 'MSCE Chemistry 2023 Paper 1', subject: 'Chemistry', examBoard: 'MSCE', year: 2023, type: 'PAST_PAPER', fileUrl: '#', createdAt: new Date('2023-06-10') },
    ];
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100 rounded-xl"><FileText size={22} className="text-orange-600" /></div>
        <div><h1 className="text-2xl font-bold text-navy">Past Papers</h1><p className="text-sm text-grey-medium">Practice with real exam papers</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[{ l:'Total Papers', v:pastPapers.length, i:<FileText size={16} className="text-orange-600" />, b:'bg-orange-50' },{ l:'Exam Boards', v:EXAM_BOARDS.length, i:<Filter size={16} className="text-blue-600" />, b:'bg-blue-50' },{ l:'Subjects', v:SUBJECTS.length, i:<FileText size={16} className="text-green" />, b:'bg-green-50' },{ l:'Latest Year', v:2024, i:<Calendar size={16} className="text-purple-600" />, b:'bg-purple-50' }].map((s,i)=>(
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-3 text-center"><div className={`p-1.5 rounded-lg ${s.b} inline-block mb-1`}>{s.i}</div><p className="text-xl font-bold text-navy">{s.v}</p><p className="text-xs text-grey-medium">{s.l}</p></CardContent></Card>
        ))}
      </div>

      {/* Filter Chips */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-grey-medium mb-2">Exam Board</p>
          <div className="flex flex-wrap gap-2">
            {EXAM_BOARDS.map((board) => (
              <Badge key={board} variant="neutral" className="cursor-pointer hover:bg-navy/10">{board}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-grey-medium mb-2">Subject</p>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((subj) => (
              <Badge key={subj} variant="neutral" className="cursor-pointer hover:bg-navy/10">{subj}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Papers Grid */}
      <div>
        <h2 className="text-base font-bold text-navy mb-3">Available Papers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastPapers.length > 0 ? pastPapers.map((paper) => (
            <Card key={paper.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info" size="sm">{paper.examBoard}</Badge>
                      <Badge variant="neutral" size="sm">{paper.year}</Badge>
                    </div>
                    <h3 className="font-semibold text-navy text-sm group-hover:text-red transition-colors">{paper.title}</h3>
                    <p className="text-xs text-grey-medium mt-1">{paper.subject}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" fullWidth><Eye size={14} className="mr-1" />View</Button>
                  <Button variant="primary" size="sm" fullWidth><Download size={14} className="mr-1" />Download</Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-0 shadow-sm col-span-full"><CardContent className="p-8 text-center"><FileText size={40} className="mx-auto text-grey-medium mb-3" /><h3 className="font-semibold text-navy">No Past Papers Available</h3><p className="text-sm text-grey-dark">Check back later for new uploads.</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}