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
import { GenericLab } from '@/components/lab/GenericLab';

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
  'biology-ecosystem': {
    id: 'biology-ecosystem', title: 'Ecosystem Simulation', subject: 'Biology', duration: '50 min', difficulty: 'Advanced',
    description: 'Explore population dynamics in a simulated ecosystem.',
    objectives: ['Model predator-prey relationships', 'Observe carrying capacity', 'Interpret population curves'],
    materials: ['Simulation environment', 'Population data sheets', 'Graph paper'],
    procedure: ['Set initial populations', 'Run several generations', 'Record each cycle', 'Graph populations', 'Interpret results'],
    safetyNotes: ['Record accurately', 'Reset before each run', 'Save data before closing'],
    steps: [{ id: 'step1', instruction: 'Seed the simulation with the initial predator and prey populations, then run one full generation cycle.', equipmentNeeded: ['simulation'] }],
  },
  'biology-osmosis': {
    id: 'biology-osmosis', title: 'Osmosis Experiment', subject: 'Biology', duration: '40 min', difficulty: 'Intermediate',
    description: 'Study water movement across selectively permeable membranes.',
    objectives: ['Demonstrate osmosis', 'Compare solutions of varying concentration', 'Explain cell turgidity'],
    materials: ['Virtual beakers', 'Dialysis tubing', 'Sucrose solutions', 'Indicator'],
    procedure: ['Prepare solutions', 'Fill tubing', 'Submerge in solution', 'Observe level change', 'Record and compare'],
    safetyNotes: ['Label every solution', 'Handle tubing carefully', 'Record accurately'],
    steps: [{ id: 'step1', instruction: 'Fill the dialysis tubing with the sucrose solution and record its starting level.', equipmentNeeded: ['beaker', 'tubing'] }],
  },
  'chemistry-reactions': {
    id: 'chemistry-reactions', title: 'Chemical Reactions', subject: 'Chemistry', duration: '40 min', difficulty: 'Intermediate',
    description: 'Observe different types of chemical reactions safely.',
    objectives: ['Identify reaction types', 'Observe evidence of reaction', 'Balance simple equations'],
    materials: ['Virtual workbench', 'Reagent set', 'Test tubes'],
    procedure: ['Select reagents', 'Combine on workbench', 'Observe changes', 'Record observations', 'Identify reaction type'],
    safetyNotes: ['Wear virtual goggles', 'Never mix unknown reagents', 'Dispose safely'],
    steps: [{ id: 'step1', instruction: 'Place the selected reagents on the workbench and combine them to observe the reaction.', equipmentNeeded: ['test tube', 'reagents'] }],
  },
  'chemistry-ph': {
    id: 'chemistry-ph', title: 'pH Scale Investigation', subject: 'Chemistry', duration: '35 min', difficulty: 'Beginner',
    description: 'Test the pH of common household substances.',
    objectives: ['Use pH indicators', 'Classify substances as acid or base', 'Interpret the pH scale'],
    materials: ['pH indicator', 'Test tubes', 'Substance samples', 'pH chart'],
    procedure: ['Collect samples', 'Add indicator', 'Compare colour', 'Read pH value', 'Record results'],
    safetyNotes: ['Do not taste samples', 'Wash hands after', 'Label each sample'],
    steps: [{ id: 'step1', instruction: 'Add pH indicator to the first sample and compare its colour against the pH chart.', equipmentNeeded: ['test tube', 'indicator'] }],
  },
  'physics-projectile': {
    id: 'physics-projectile', title: 'Projectile Motion', subject: 'Physics', duration: '40 min', difficulty: 'Intermediate',
    description: 'Study the trajectory of projectiles under different launch angles.',
    objectives: ['Predict range from angle', 'Measure actual range', 'Explore gravity effects'],
    materials: ['Launch simulator', 'Measuring tape', 'Angle control', 'Target board'],
    procedure: ['Set launch angle', 'Set initial speed', 'Launch projectile', 'Measure range', 'Repeat and compare'],
    safetyNotes: ['Clear launch area', 'Record accurately', 'Save data before closing'],
    steps: [{ id: 'step1', instruction: 'Set the launch angle to 45 degrees with a fixed initial speed, then launch and measure the range.', equipmentNeeded: ['launcher'] }],
  },
  'physics-circuits': {
    id: 'physics-circuits', title: 'Electric Circuits Lab', subject: 'Physics', duration: '50 min', difficulty: 'Advanced',
    description: 'Build and analyze series and parallel circuits.',
    objectives: ['Construct series circuits', 'Construct parallel circuits', 'Compare current and resistance'],
    materials: ['Circuit components', 'Battery pack', 'Wires', 'Voltmeter', 'Ammeter'],
    procedure: ['Lay out components', 'Build series circuit', 'Measure V and I', 'Rebuild in parallel', 'Compare results'],
    safetyNotes: ['Do not exceed 12V', 'Disconnect before rewiring', 'Check connections'],
    steps: [{ id: 'step1', instruction: 'Build a simple series circuit with a battery and resistor, then measure the voltage across the resistor.', equipmentNeeded: ['battery', 'resistor', 'wire'] }],
  },
  'math-geometry': {
    id: 'math-geometry', title: 'Interactive Geometry', subject: 'Mathematics', duration: '30 min', difficulty: 'Intermediate',
    description: 'Visualize geometric shapes and transformations.',
    objectives: ['Measure angles and sides', 'Apply transformation rules', 'Identify congruence'],
    materials: ['Geometry canvas', 'Protractor', 'Ruler', 'Shape library'],
    procedure: ['Select a shape', 'Measure its properties', 'Apply a transformation', 'Observe the result', 'Record findings'],
    safetyNotes: ['Record measurements accurately', 'Reset the canvas between shapes'],
    steps: [{ id: 'step1', instruction: 'Select a shape from the library and measure all of its angles and side lengths.', equipmentNeeded: ['canvas', 'protractor'] }],
  },
  'math-statistics': {
    id: 'math-statistics', title: 'Data Analysis Lab', subject: 'Mathematics', duration: '45 min', difficulty: 'Advanced',
    description: 'Analyze datasets and calculate statistical measures.',
    objectives: ['Calculate mean and median', 'Interpret standard deviation', 'Construct histograms'],
    materials: ['Dataset', 'Spreadsheet', 'Graphing tool'],
    procedure: ['Load dataset', 'Calculate central tendency', 'Measure spread', 'Plot distribution', 'Interpret results'],
    safetyNotes: ['Check calculations', 'Label axes with units'],
    steps: [{ id: 'step1', instruction: 'Load the dataset and calculate the mean, median and standard deviation of the value column.', equipmentNeeded: ['dataset'] }],
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
        {experiment.subject !== 'Chemistry' && experiment.subject !== 'Physics' && experiment.subject !== 'Biology' && (
          <GenericLab experiment={experiment} />
        )}
      </div>
    </div>
  );
}