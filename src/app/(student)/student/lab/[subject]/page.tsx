import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Star, Play, FlaskConical, Zap, Microscope, Calculator } from 'lucide-react';
import Link from 'next/link';

const SUBJECT_LABS: Record<string, any[]> = {
  physics: [
    { id: 'physics-pendulum', title: 'Simple Pendulum', description: 'Investigate pendulum motion and calculate gravity', duration: 30, difficulty: 'beginner', xpReward: 100 },
    { id: 'physics-ohms-law', title: "Ohm's Law", description: 'Explore voltage, current, and resistance', duration: 45, difficulty: 'beginner', xpReward: 120 },
    { id: 'physics-projectile', title: 'Projectile Motion', description: 'Study trajectory of launched objects', duration: 40, difficulty: 'intermediate', xpReward: 150 },
    { id: 'physics-circuits', title: 'Electric Circuits Lab', description: 'Build series and parallel circuits', duration: 50, difficulty: 'advanced', xpReward: 200 },
  ],
  chemistry: [
    { id: 'chemistry-titration', title: 'Acid-Base Titration', description: 'Determine unknown concentrations', duration: 60, difficulty: 'advanced', xpReward: 200 },
    { id: 'chemistry-reactions', title: 'Chemical Reactions', description: 'Observe different reaction types safely', duration: 40, difficulty: 'intermediate', xpReward: 150 },
    { id: 'chemistry-ph', title: 'pH Scale Investigation', description: 'Test pH of common substances', duration: 35, difficulty: 'beginner', xpReward: 100 },
  ],
  biology: [
    { id: 'biology-microscope', title: 'Virtual Microscope', description: 'Examine plant and animal cells', duration: 35, difficulty: 'beginner', xpReward: 100 },
    { id: 'biology-ecosystem', title: 'Ecosystem Simulation', description: 'Explore population dynamics', duration: 50, difficulty: 'advanced', xpReward: 200 },
    { id: 'biology-osmosis', title: 'Osmosis Experiment', description: 'Study water movement across membranes', duration: 40, difficulty: 'intermediate', xpReward: 150 },
  ],
  mathematics: [
    { id: 'math-geometry', title: 'Interactive Geometry', description: 'Visualize shapes and transformations', duration: 30, difficulty: 'intermediate', xpReward: 120 },
    { id: 'math-statistics', title: 'Data Analysis Lab', description: 'Analyze datasets and create graphs', duration: 45, difficulty: 'advanced', xpReward: 150 },
  ],
};

const SUBJECT_ICONS: Record<string, any> = {
  physics: <Zap size={18} className="text-yellow-600" />,
  chemistry: <FlaskConical size={18} className="text-green" />,
  biology: <Microscope size={18} className="text-red" />,
  mathematics: <Calculator size={18} className="text-blue-600" />,
};

export default async function SubjectLabPage({ params }: { params: Promise<{ subject: string }> }) {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const { subject } = await params;
  const experiments = SUBJECT_LABS[subject] || [];
  const icon = SUBJECT_ICONS[subject] || <FlaskConical size={18} className="text-green" />;

  const getBadge = (d: string) => {
    switch (d) {
      case 'beginner': return <Badge variant="success" size="sm">Beginner</Badge>;
      case 'intermediate': return <Badge variant="warning" size="sm">Intermediate</Badge>;
      case 'advanced': return <Badge variant="error" size="sm">Advanced</Badge>;
      default: return <Badge size="sm">{d}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/student/lab" className="text-grey-medium hover:text-navy">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
          <div>
            <h1 className="text-xl font-bold text-navy capitalize">{subject} Virtual Lab</h1>
            <p className="text-sm text-grey-medium">{experiments.length} experiments available</p>
          </div>
        </div>
      </div>

      {/* Experiments Grid */}
      {experiments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((exp) => (
            <Link key={exp.id} href={`/student/lab/${subject}/${exp.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-navy group-hover:text-red transition-colors">{exp.title}</h3>
                    {getBadge(exp.difficulty)}
                  </div>
                  <p className="text-xs text-grey-dark mb-4 line-clamp-2">{exp.description}</p>
                  <div className="flex items-center gap-3 text-xs text-grey-medium mb-4">
                    <span className="flex items-center gap-1"><Clock size={12} />{exp.duration} min</span>
                    <span className="flex items-center gap-1"><Star size={12} />{exp.xpReward} XP</span>
                  </div>
                  <Button variant="primary" size="sm" fullWidth rightIcon={<Play size={14} />}>
                    Start Experiment
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <FlaskConical size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-1">No Experiments Available</h3>
            <p className="text-sm text-grey-dark">No experiments available for {subject} yet. Check back later!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}