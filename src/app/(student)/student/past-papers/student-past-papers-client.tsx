'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Search, Calendar, Lock } from 'lucide-react';
import { DocumentViewer } from '@/components/features/past-papers/document-viewer';

const EXAM_BOARDS = ['MSCE', 'JCE', 'ICAM', 'TEVETA'];
const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Biology', 'Chemistry', 'Geography', 'History', 'Agriculture'];

interface StudentPastPapersClientProps {
  pastPapers: any[];
  canDownload: boolean;
}

export function StudentPastPapersClient({ pastPapers, canDownload }: StudentPastPapersClientProps) {
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[{ l:'Total Papers', v:pastPapers.length, i:<FileText size={16} className="text-orange-600" />, b:'bg-orange-50' },{ l:'Exam Boards', v:EXAM_BOARDS.length, i:<Search size={16} className="text-blue-600" />, b:'bg-blue-50' },{ l:'Subjects', v:SUBJECTS.length, i:<FileText size={16} className="text-green-600" />, b:'bg-green-50' },{ l:'Latest Year', v:2024, i:<Calendar size={16} className="text-purple-600" />, b:'bg-purple-50' }].map((s,i)=>(
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
                    {paper.course && (
                      <p className="text-xs text-grey-medium mt-1">Course: {paper.course.title}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedPaper(paper)}>
                    <Eye size={14} className="mr-1" />View
                  </Button>
                  {!canDownload ? (
                    <Button variant="primary" size="sm" className="flex-1" disabled>
                      <Lock size={14} className="mr-1" />Premium
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => setSelectedPaper(paper)}>
                      <Download size={14} className="mr-1" />Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-0 shadow-sm col-span-full">
              <CardContent className="p-8 text-center">
                <FileText size={40} className="mx-auto text-grey-medium mb-3" />
                <h3 className="font-semibold text-navy">No Past Papers Available</h3>
                <p className="text-sm text-grey-dark">Check back later for new uploads.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedPaper && (
        <DocumentViewer
          url={selectedPaper.fileUrl}
          title={selectedPaper.title}
          contentType={selectedPaper.contentType}
          canDownload={canDownload}
          paperId={selectedPaper.id}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </>
  );
}
