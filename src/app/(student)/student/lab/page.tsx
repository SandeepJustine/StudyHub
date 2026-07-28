import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FlaskConical, Atom, Microscope, Calculator, Globe, Cpu, Lock, Play,
  Star, Beaker, Thermometer, Zap, Clock, ArrowRight, Filter,
} from 'lucide-react';
import Link from 'next/link';

const VIRTUAL_LABS = [
  { id: 'physics-pendulum', title: 'Simple Pendulum', subject: 'Physics', description: 'Investigate the relationship between pendulum length and period of oscillation.', icon: <Zap size={28} />, color: 'text-yellow-600', bgColor: 'bg-yellow-50', duration: '30 min', difficulty: 'Intermediate', premium: false },
  { id: 'physics-ohms-law', title: "Ohm's Law Experiment", subject: 'Physics', description: 'Explore voltage, current, and resistance in electrical circuits.', icon: <Cpu size={28} />, color: 'text-blue-600', bgColor: 'bg-blue-50', duration: '45 min', difficulty: 'Beginner', premium: false },
  { id: 'physics-projectile', title: 'Projectile Motion', subject: 'Physics', description: 'Study the trajectory of projectiles under different launch angles.', icon: <Atom size={28} />, color: 'text-indigo-600', bgColor: 'bg-indigo-50', duration: '40 min', difficulty: 'Intermediate', premium: true },
  { id: 'physics-circuits', title: 'Electric Circuits Lab', subject: 'Physics', description: 'Build and analyze series and parallel circuits.', icon: <Zap size={28} />, color: 'text-orange-600', bgColor: 'bg-orange-50', duration: '50 min', difficulty: 'Advanced', premium: true },
  { id: 'chemistry-titration', title: 'Acid-Base Titration', subject: 'Chemistry', description: 'Learn titration techniques for unknown concentrations.', icon: <FlaskConical size={28} />, color: 'text-green', bgColor: 'bg-green-50', duration: '60 min', difficulty: 'Advanced', premium: true },
  { id: 'chemistry-reactions', title: 'Chemical Reactions', subject: 'Chemistry', description: 'Observe different types of chemical reactions safely.', icon: <Beaker size={28} />, color: 'text-purple-600', bgColor: 'bg-purple-50', duration: '40 min', difficulty: 'Intermediate', premium: true },
  { id: 'chemistry-ph', title: 'pH Scale Investigation', subject: 'Chemistry', description: 'Test the pH of common household substances.', icon: <Thermometer size={28} />, color: 'text-pink-600', bgColor: 'bg-pink-50', duration: '35 min', difficulty: 'Beginner', premium: false },
  { id: 'biology-microscope', title: 'Virtual Microscope', subject: 'Biology', description: 'Examine plant and animal cells under a microscope.', icon: <Microscope size={28} />, color: 'text-red', bgColor: 'bg-red-50', duration: '35 min', difficulty: 'Beginner', premium: true },
  { id: 'biology-ecosystem', title: 'Ecosystem Simulation', subject: 'Biology', description: 'Explore population dynamics in a simulated ecosystem.', icon: <Globe size={28} />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', duration: '50 min', difficulty: 'Advanced', premium: true },
  { id: 'biology-osmosis', title: 'Osmosis Experiment', subject: 'Biology', description: 'Study water movement across cell membranes.', icon: <Beaker size={28} />, color: 'text-cyan-600', bgColor: 'bg-cyan-50', duration: '40 min', difficulty: 'Intermediate', premium: true },
  { id: 'math-geometry', title: 'Interactive Geometry', subject: 'Mathematics', description: 'Visualize geometric shapes and transformations.', icon: <Calculator size={28} />, color: 'text-orange-600', bgColor: 'bg-orange-50', duration: '30 min', difficulty: 'Intermediate', premium: false },
  { id: 'math-statistics', title: 'Data Analysis Lab', subject: 'Mathematics', description: 'Analyze datasets and calculate statistical measures.', icon: <Calculator size={28} />, color: 'text-blue-600', bgColor: 'bg-blue-50', duration: '45 min', difficulty: 'Advanced', premium: true },
];

const SUBJECTS = [
  { name: 'All', icon: <FlaskConical size={18} />, count: VIRTUAL_LABS.length },
  { name: 'Physics', icon: <Zap size={18} />, count: VIRTUAL_LABS.filter(l => l.subject === 'Physics').length },
  { name: 'Chemistry', icon: <FlaskConical size={18} />, count: VIRTUAL_LABS.filter(l => l.subject === 'Chemistry').length },
  { name: 'Biology', icon: <Microscope size={18} />, count: VIRTUAL_LABS.filter(l => l.subject === 'Biology').length },
  { name: 'Mathematics', icon: <Calculator size={18} />, count: VIRTUAL_LABS.filter(l => l.subject === 'Mathematics').length },
];

export default async function VirtualLabPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  let isPremium = false;
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'active', tier: { in: ['STUDENT_PREMIUM', 'STUDENT_ANNUAL'] } },
    });
    isPremium = !!subscription;
  } catch {}

  const premiumLabs = VIRTUAL_LABS.filter(lab => lab.premium);
  const freeLabs = VIRTUAL_LABS.filter(lab => !lab.premium);

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-100 rounded-xl">
            <FlaskConical size={22} className="text-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Virtual Laboratory</h1>
            <p className="text-sm text-grey-medium">Interactive science experiments</p>
          </div>
        </div>
        <Badge variant={isPremium ? 'success' : 'neutral'} size="md">
          {isPremium ? 'Premium Access' : 'Free Access'}
        </Badge>
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-white to-purple-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Star size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Unlock {premiumLabs.length} Premium Labs</h3>
                <p className="text-sm text-grey-dark">Get access to Chemistry, Biology & advanced Physics experiments</p>
              </div>
            </div>
            <Link href="/pricing" className="flex-shrink-0">
              <Button variant="primary" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-navy font-semibold">
                Upgrade <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: VIRTUAL_LABS.length, icon: <FlaskConical size={16} />, color: 'text-green', bg: 'bg-green-50' },
          { label: 'Free', value: freeLabs.length, icon: <Play size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Premium', value: premiumLabs.length, icon: <Star size={16} />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Subjects', value: SUBJECTS.length - 1, icon: <Microscope size={16} />, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className={`p-1.5 rounded-lg ${stat.bg} inline-block mb-1`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-xl font-bold text-navy">{stat.value}</p>
              <p className="text-xs text-grey-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Filter */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((subject) => (
          <Link
            key={subject.name}
            href={subject.name === 'All' ? '/student/lab' : `/student/lab/${subject.name.toLowerCase()}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-grey-light hover:border-navy hover:shadow-sm transition-all text-sm"
          >
            <span className="text-navy">{subject.icon}</span>
            <span className="font-medium text-navy text-sm">{subject.name}</span>
            <Badge variant="neutral" size="sm">{subject.count}</Badge>
          </Link>
        ))}
      </div>

      {/* Free Labs */}
      <div>
        <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green" />
          Free Experiments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freeLabs.map((lab) => (
            <Link key={lab.id} href={`/student/lab/${lab.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${lab.bgColor} group-hover:scale-110 transition-transform`}>
                      <span className={lab.color}>{lab.icon}</span>
                    </div>
                    <Badge variant="success" size="sm">Free</Badge>
                  </div>
                  <Badge variant="info" size="sm" className="mb-2">{lab.subject}</Badge>
                  <h3 className="font-semibold text-navy mb-1 group-hover:text-red transition-colors">{lab.title}</h3>
                  <p className="text-xs text-grey-dark mb-3 line-clamp-2">{lab.description}</p>
                  <div className="flex items-center gap-2 text-xs text-grey-medium mb-3">
                    <span className="flex items-center gap-1"><Clock size={12} />{lab.duration}</span>
                    <span>•</span>
                    <span>{lab.difficulty}</span>
                  </div>
                  <Button variant="primary" size="sm" fullWidth rightIcon={<Play size={14} />}>
                    Start Experiment
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Premium Labs */}
      <div>
        <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Premium Experiments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {premiumLabs.map((lab) => (
            <Card key={lab.id} className={`border-0 shadow-sm hover:shadow-md transition-all group h-full ${!isPremium ? 'opacity-85' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${lab.bgColor} group-hover:scale-110 transition-transform`}>
                    <span className={lab.color}>{lab.icon}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" size="sm">Premium</Badge>
                    {!isPremium && (
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <Lock size={12} className="text-purple-600" />
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="info" size="sm" className="mb-2">{lab.subject}</Badge>
                <h3 className="font-semibold text-navy mb-1 group-hover:text-red transition-colors">{lab.title}</h3>
                <p className="text-xs text-grey-dark mb-3 line-clamp-2">{lab.description}</p>
                <div className="flex items-center gap-2 text-xs text-grey-medium mb-3">
                  <span className="flex items-center gap-1"><Clock size={12} />{lab.duration}</span>
                  <span>•</span>
                  <span>{lab.difficulty}</span>
                </div>
                {isPremium ? (
                  <Link href={`/student/lab/${lab.id}`}>
                    <Button variant="primary" size="sm" fullWidth rightIcon={<Play size={14} />}>
                      Start Experiment
                    </Button>
                  </Link>
                ) : (
                  <Link href="/pricing">
                    <Button variant="outline" size="sm" fullWidth rightIcon={<Lock size={14} />}>
                      Upgrade to Access
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}