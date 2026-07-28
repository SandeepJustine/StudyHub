import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Clock, DollarSign, Building2, ArrowRight, Search, Eye, Send } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

export default async function StudentJobsPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  // Fetch job postings from database
  let jobs: any[] = [];
  try {
    jobs = await prisma.recruitmentPosting.findMany({
      where: { status: 'active' },
      include: {
        client: { select: { companyName: true, industry: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    // Mock data
    jobs = [
      { id: '1', title: 'Graduate Trainee - Finance', description: 'Join our finance team as a graduate trainee. Learn financial analysis, reporting, and accounting.', type: 'Full-time', location: 'Lilongwe', salary: 'MWK 500,000 - 800,000', deadline: new Date(Date.now() + 30*86400000), client: { companyName: 'National Bank', industry: 'Banking' }, _count: { applications: 12 }, createdAt: new Date(Date.now() - 172800000) },
      { id: '2', title: 'IT Intern', description: 'Gain hands-on experience in IT support, networking, and software development.', type: 'Internship', location: 'Blantyre', salary: 'MWK 200,000 - 300,000', deadline: new Date(Date.now() + 45*86400000), client: { companyName: 'Airtel Malawi', industry: 'Telecommunications' }, _count: { applications: 8 }, createdAt: new Date(Date.now() - 259200000) },
      { id: '3', title: 'Marketing Assistant', description: 'Support the marketing team with campaigns, social media, and market research.', type: 'Full-time', location: 'Mzuzu', salary: 'MWK 400,000 - 600,000', deadline: new Date(Date.now() + 20*86400000), client: { companyName: 'Illovo Sugar', industry: 'Manufacturing' }, _count: { applications: 5 }, createdAt: new Date(Date.now() - 345600000) },
      { id: '4', title: 'Data Analyst', description: 'Analyze business data to provide insights and recommendations for decision making.', type: 'Contract', location: 'Lilongwe', salary: 'MWK 600,000 - 900,000', deadline: new Date(Date.now() + 60*86400000), client: { companyName: 'UNICEF Malawi', industry: 'NGO' }, _count: { applications: 15 }, createdAt: new Date(Date.now() - 432000000) },
      { id: '5', title: 'Teaching Assistant', description: 'Assist teachers in classroom activities and student support at a private school.', type: 'Part-time', location: 'Blantyre', salary: 'MWK 250,000 - 350,000', deadline: new Date(Date.now() + 15*86400000), client: { companyName: 'St. Andrews School', industry: 'Education' }, _count: { applications: 3 }, createdAt: new Date(Date.now() - 518400000) },
    ];
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl"><Briefcase size={22} className="text-purple-600" /></div>
          <div><h1 className="text-2xl font-bold text-navy">Job Board</h1><p className="text-sm text-grey-medium">Find your next opportunity</p></div>
        </div>
        <Badge variant="info">{jobs.length} active jobs</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{ l:'Active Jobs', v:jobs.length, i:<Briefcase size={16} className="text-purple-600" />, b:'bg-purple-50' },{ l:'Companies', v:new Set(jobs.map(j=>j.client?.companyName)).size, i:<Building2 size={16} className="text-blue-600" />, b:'bg-blue-50' },{ l:'Applied', v:0, i:<Send size={16} className="text-green" />, b:'bg-green-50' }].map((s,i)=>(
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-3 text-center"><div className={`p-1.5 rounded-lg ${s.b} inline-block mb-1`}>{s.i}</div><p className="text-xl font-bold text-navy">{s.v}</p><p className="text-xs text-grey-medium">{s.l}</p></CardContent></Card>
        ))}
      </div>

      {/* Jobs List */}
      <div>
        <h2 className="text-base font-bold text-navy mb-3">Latest Opportunities</h2>
        <div className="space-y-3">
          {jobs.length > 0 ? jobs.map((job) => (
            <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info" size="sm">{job.type}</Badge>
                      {job.client?.industry && <Badge variant="neutral" size="sm">{job.client.industry}</Badge>}
                    </div>
                    <h3 className="font-semibold text-navy mb-1">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-grey-medium mb-1">
                      <Building2 size={14} />{job.client?.companyName}
                    </div>
                    <p className="text-xs text-grey-dark mb-3 line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-grey-medium">
                      <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign size={12} />{job.salary}</span>
                      {job.deadline && (
                        <span className="flex items-center gap-1 text-red"><Clock size={12} />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      )}
                      <span className="flex items-center gap-1"><Send size={12} />{job._count?.applications || 0} applicants</span>
                      <span className="flex items-center gap-1 text-grey-medium">{formatRelativeTime(job.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/student/jobs/${job.id}`}>
                      <Button variant="primary" size="sm"><Eye size={14} className="mr-1" />View</Button>
                    </Link>
                    <Button variant="outline" size="sm"><Send size={14} className="mr-1" />Apply</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center"><Briefcase size={40} className="mx-auto text-grey-medium mb-3" /><h3 className="font-semibold text-navy">No Jobs Available</h3><p className="text-sm text-grey-dark">Check back later for new opportunities.</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}