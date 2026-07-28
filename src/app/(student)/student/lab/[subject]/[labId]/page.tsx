import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, CheckCircle, AlertTriangle, FlaskConical, Clock, Star, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { VirtualLab } from '@/components/lab/VirtualLab';
import { PhysicsLab } from '@/components/lab/PhysicsLab';
import { BiologyLab } from '@/components/lab/BiologyLab';

const LAB_EXPERIMENTS: Record<string, any> = {
  'physics-pendulum': {
    id: 'physics-pendulum', title: 'Simple Pendulum Experiment', subject: 'Physics', duration: '30 min', difficulty: 'Intermediate',
    description: 'Investigate the factors affecting the period of a simple pendulum.',
    objectives: ['Measure period for different lengths', 'Determine length-period relationship', 'Calculate gravity'],
    materials: ['Virtual pendulum', 'Stopwatch', 'Ruler', 'Protractor'],
    procedure: ['Set length to 50cm', 'Displace by 10°', 'Release and time 10 oscillations', 'Repeat for different lengths', 'Plot T² vs L graph'],
    safetyNotes: ['Ensure stable environment', 'Record accurately', 'Save data before closing'],
    steps: [{ id: 'step1', instruction: 'Set up the pendulum with a length of 50cm and measure the period.', equipmentNeeded: ['pendulum', 'stopwatch'] }],
  },
  'physics-ohms-law': {
    id: 'physics-ohms-law', title: "Ohm's Law Experiment", subject: 'Physics', duration: '45 min', difficulty: 'Beginner',
    description: 'Explore the relationship between voltage, current, and resistance.',
    objectives: ['Measure V and I', "Verify Ohm's Law", 'Calculate resistance'],
    materials: ['Virtual circuit board', 'Resistors', 'Voltmeter', 'Ammeter', 'Power supply'],
    procedure: ['Connect circuit', 'Vary voltage', 'Record readings', 'Plot V-I graph'],
    safetyNotes: ['Check connections', 'Do not exceed 12V', 'Record carefully'],
    steps: [{ id: 'step1', instruction: 'Build a simple circuit with a resistor and measure voltage and current.', equipmentNeeded: ['battery', 'resistor', 'wire'] }],
  },
  'chemistry-titration': {
    id: 'chemistry-titration', title: 'Acid-Base Titration', subject: 'Chemistry', duration: '60 min', difficulty: 'Advanced',
    description: 'Learn titration techniques to determine unknown concentrations.',
    objectives: ['Master titration', 'Determine concentration', 'Understand endpoint'],
    materials: ['Virtual burette', '0.1M NaOH', 'Unknown HCl', 'Phenolphthalein', 'Conical flask'],
    procedure: ['Fill burette', 'Add indicator', 'Titrate dropwise', 'Record endpoint', 'Calculate concentration'],
    safetyNotes: ['Wear goggles', 'Handle acids carefully', 'Dispose properly'],
    steps: [{ id: 'step1', instruction: 'Fill the burette with 0.1M NaOH and add indicator to the acid.', equipmentNeeded: ['burette', 'flask', 'beaker'] }],
  },
  'biology-microscope': {
    id: 'biology-microscope', title: 'Virtual Microscope', subject: 'Biology', duration: '35 min', difficulty: 'Beginner',
    description: 'Examine plant and animal cells under a virtual microscope.',
    objectives: ['Identify microscope parts', 'Prepare slides', 'Distinguish cell types', 'Identify organelles'],
    materials: ['Virtual microscope', 'Plant slides', 'Animal slides'],
    procedure: ['Place slide', 'Start at 4x', 'Focus', 'Increase magnification', 'Draw and label'],
    safetyNotes: ['Handle slides carefully', 'Start with low power', 'Never use coarse on high power'],
    steps: [{ id: 'step1', instruction: 'Place the onion epidermis slide on the stage and observe at 40x magnification.', equipmentNeeded: ['microscope'] }],
  },
};

export default async function LabExperimentPage({ params }: { params: Promise<{ subject: string; labId: string }> }) {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const { subject, labId } = await params;
  const experiment = LAB_EXPERIMENTS[labId];

  if (!experiment) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Experiment Not Found</h2>
          <p className="text-grey-dark mb-4">The experiment "{labId}" could not be found.</p>
          <Link href={`/student/lab/${subject}`}>
            <Button variant="primary">Back to {subject} Labs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/student/lab/${subject}`} className="text-grey-medium hover:text-navy">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-navy">{experiment.title}</h1>
              <Badge variant="info" size="sm">{experiment.subject}</Badge>
              <Badge variant="neutral" size="sm">{experiment.duration}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm"><Download size={14} className="mr-1" /> Save</Button>
          <Button variant="ghost" size="sm"><Share2 size={14} className="mr-1" /> Share</Button>
        </div>
      </div>

      {/* Lab Component */}
      <div className="flex-1 overflow-hidden">
        {experiment.subject === 'Chemistry' && <VirtualLab experiment={experiment} />}
        {experiment.subject === 'Physics' && <PhysicsLab experiment={experiment} />}
        {experiment.subject === 'Biology' && <BiologyLab experiment={experiment} />}
      </div>
    </div>
  );
}