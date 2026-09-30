/**
 * Canonical catalogue of the virtual lab experiments that already ship with the
 * app. These are the labs the student lab pages hardcode; promoting them here
 * lets them live in the database so instructors can assign them to subjects
 * without anyone having to author new experiments.
 *
 * `id` matches the `labId` segment used by /student/lab/[subject]/[labId], so a
 * seeded row lines up with the existing student routes.
 *
 * `subject` on the Prisma model is the *lab simulator type* and stays lowercase
 * (chemistry | physics | biology); `labSubject` is the teaching subject.
 */

export interface CatalogStep {
  instruction: string;
  expectedAction?: string;
  equipmentNeeded: string[];
  observationFields: string[];
}

export interface CatalogExperiment {
  id: string;
  title: string;
  labSubject: string;
  labType: 'chemistry' | 'physics' | 'biology';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  xpReward: number;
  objectives: string[];
  equipmentNeeded: string[];
  steps: CatalogStep[];
  premium: boolean;
}

export const EXPERIMENT_CATALOG: CatalogExperiment[] = [
  {
    id: 'physics-pendulum',
    title: 'Simple Pendulum',
    labSubject: 'Physics',
    labType: 'physics',
    description: 'Investigate the relationship between pendulum length and period of oscillation.',
    difficulty: 'beginner',
    duration: 30,
    xpReward: 100,
    objectives: [
      'Measure the period for different pendulum lengths',
      'Determine the length-period relationship',
      'Calculate acceleration due to gravity',
    ],
    equipmentNeeded: ['Virtual pendulum', 'Stopwatch', 'Ruler', 'Protractor'],
    steps: [
      {
        instruction: 'Set up the pendulum with a length of 50cm and measure the period.',
        expectedAction: 'Release the pendulum and time 10 oscillations',
        equipmentNeeded: ['pendulum', 'stopwatch'],
        observationFields: ['length_cm', 'time_10_oscillations_s'],
      },
      {
        instruction: 'Repeat for four more lengths and record the period each time.',
        equipmentNeeded: ['pendulum', 'stopwatch', 'ruler'],
        observationFields: ['length_cm', 'time_10_oscillations_s'],
      },
      {
        instruction: 'Plot T² against L and use the gradient to calculate gravity.',
        equipmentNeeded: ['graph paper'],
        observationFields: ['gradient_t2_over_l'],
      },
    ],
    premium: false,
  },
  {
    id: 'physics-ohms-law',
    title: "Ohm's Law",
    labSubject: 'Physics',
    labType: 'physics',
    description: 'Explore voltage, current, and resistance in electrical circuits.',
    difficulty: 'beginner',
    duration: 45,
    xpReward: 120,
    objectives: ['Measure voltage and current', "Verify Ohm's Law", 'Calculate resistance'],
    equipmentNeeded: ['Virtual circuit board', 'Resistors', 'Voltmeter', 'Ammeter', 'Power supply'],
    steps: [
      {
        instruction: 'Build a simple circuit with a resistor and measure voltage and current.',
        expectedAction: 'Record the voltmeter and ammeter readings',
        equipmentNeeded: ['battery', 'resistor', 'wire'],
        observationFields: ['voltage_v', 'current_a'],
      },
      {
        instruction: 'Vary the supply voltage and record V and I for each setting.',
        equipmentNeeded: ['battery', 'resistor', 'voltmeter', 'ammeter'],
        observationFields: ['voltage_v', 'current_a'],
      },
      {
        instruction: 'Plot a V-I graph and confirm the line passes through the origin.',
        equipmentNeeded: ['graph paper'],
        observationFields: ['resistance_ohm'],
      },
    ],
    premium: false,
  },
  {
    id: 'physics-projectile',
    title: 'Projectile Motion',
    labSubject: 'Physics',
    labType: 'physics',
    description: 'Study the trajectory of projectiles under different launch angles.',
    difficulty: 'intermediate',
    duration: 40,
    xpReward: 150,
    objectives: [
      'Predict the range for a given launch speed and angle',
      'Measure the actual range',
      'Compare horizontal and vertical motion',
    ],
    equipmentNeeded: ['Launcher', 'Target board', 'Measuring tape'],
    steps: [
      {
        instruction: 'Launch the projectile at 30 degrees and mark where it lands.',
        equipmentNeeded: ['launcher', 'measuring tape'],
        observationFields: ['launch_angle_deg', 'range_m'],
      },
      {
        instruction: 'Repeat at 45 and 60 degrees and record the ranges.',
        equipmentNeeded: ['launcher', 'measuring tape'],
        observationFields: ['launch_angle_deg', 'range_m'],
      },
      {
        instruction: 'Compare measured ranges with the theoretical maximum at 45 degrees.',
        equipmentNeeded: ['graph paper'],
        observationFields: ['range_m'],
      },
    ],
    premium: true,
  },
  {
    id: 'physics-circuits',
    title: 'Electric Circuits Lab',
    labSubject: 'Physics',
    labType: 'physics',
    description: 'Build and analyse series and parallel circuits.',
    difficulty: 'advanced',
    duration: 50,
    xpReward: 200,
    objectives: [
      'Build series and parallel circuits',
      'Compare total resistance',
      'Apply Kirchhoff rules',
    ],
    equipmentNeeded: ['Resistors', 'Battery pack', 'Ammeter', 'Voltmeter', 'Connecting wire'],
    steps: [
      {
        instruction: 'Connect two resistors in series and measure the total current.',
        equipmentNeeded: ['resistor', 'battery', 'ammeter'],
        observationFields: ['total_current_a'],
      },
      {
        instruction: 'Reconfigure the same resistors in parallel and measure again.',
        equipmentNeeded: ['resistor', 'battery', 'ammeter'],
        observationFields: ['total_current_a'],
      },
      {
        instruction: 'Compare both results with the expected equivalent resistance.',
        equipmentNeeded: ['graph paper'],
        observationFields: ['equivalent_resistance_ohm'],
      },
    ],
    premium: true,
  },
  {
    id: 'chemistry-titration',
    title: 'Acid-Base Titration',
    labSubject: 'Chemistry',
    labType: 'chemistry',
    description: 'Learn titration techniques for unknown concentrations.',
    difficulty: 'advanced',
    duration: 60,
    xpReward: 200,
    objectives: ['Master titration technique', 'Determine an unknown concentration', 'Identify the endpoint'],
    equipmentNeeded: ['Virtual burette', '0.1M NaOH', 'Unknown HCl', 'Phenolphthalein', 'Conical flask'],
    steps: [
      {
        instruction: 'Fill the burette with 0.1M NaOH and add indicator to the acid.',
        expectedAction: 'Titrate dropwise until the endpoint colour change',
        equipmentNeeded: ['burette', 'flask', 'beaker'],
        observationFields: ['initial_burette_ml', 'final_burette_ml'],
      },
      {
        instruction: 'Record the volume of NaOH used at the endpoint.',
        equipmentNeeded: ['burette'],
        observationFields: ['naoh_volume_ml'],
      },
      {
        instruction: 'Calculate the concentration of the unknown acid.',
        equipmentNeeded: ['calculator'],
        observationFields: ['unknown_concentration_molar'],
      },
    ],
    premium: true,
  },
  {
    id: 'chemistry-reactions',
    title: 'Chemical Reactions',
    labSubject: 'Chemistry',
    labType: 'chemistry',
    description: 'Observe different types of chemical reactions safely.',
    difficulty: 'intermediate',
    duration: 40,
    xpReward: 150,
    objectives: ['Identify reaction types', 'Record evidence of each reaction', 'Apply the law of conservation of mass'],
    equipmentNeeded: ['Test tubes', 'Virtual reagents', 'Balance'],
    steps: [
      {
        instruction: 'Combine two reagents in a test tube and classify the reaction.',
        equipmentNeeded: ['test tube'],
        observationFields: ['reaction_type'],
      },
      {
        instruction: 'Record the mass before and after the reaction.',
        equipmentNeeded: ['balance'],
        observationFields: ['mass_before_g', 'mass_after_g'],
      },
    ],
    premium: true,
  },
  {
    id: 'chemistry-ph',
    title: 'pH Scale Investigation',
    labSubject: 'Chemistry',
    labType: 'chemistry',
    description: 'Test the pH of common household substances.',
    difficulty: 'beginner',
    duration: 35,
    xpReward: 100,
    objectives: ['Use indicators correctly', 'Measure the pH of common substances', 'Classify substances as acid, base or neutral'],
    equipmentNeeded: ['pH paper', 'Universal indicator', 'Test tubes'],
    steps: [
      {
        instruction: 'Test each household substance with universal indicator and record the colour.',
        equipmentNeeded: ['universal indicator'],
        observationFields: ['ph_value'],
      },
      {
        instruction: 'Classify each substance as acidic, neutral or alkaline.',
        equipmentNeeded: ['ph paper'],
        observationFields: ['classification'],
      },
    ],
    premium: false,
  },
  {
    id: 'biology-microscope',
    title: 'Virtual Microscope',
    labSubject: 'Biology',
    labType: 'biology',
    description: 'Examine plant and animal cells under a microscope.',
    difficulty: 'beginner',
    duration: 35,
    xpReward: 100,
    objectives: ['Identify microscope parts', 'Prepare slides', 'Distinguish cell types', 'Identify organelles'],
    equipmentNeeded: ['Virtual microscope', 'Plant slides', 'Animal slides'],
    steps: [
      {
        instruction: 'Place the onion epidermis slide on the stage and observe at 40x magnification.',
        equipmentNeeded: ['microscope'],
        observationFields: ['magnification', 'cell_shape'],
      },
      {
        instruction: 'Increase to 400x and identify the visible organelles.',
        equipmentNeeded: ['microscope'],
        observationFields: ['organelles_observed'],
      },
      {
        instruction: 'Draw and label the cell you observed.',
        equipmentNeeded: ['drawing sheet'],
        observationFields: ['structures_labelled'],
      },
    ],
    premium: true,
  },
  {
    id: 'biology-ecosystem',
    title: 'Ecosystem Simulation',
    labSubject: 'Biology',
    labType: 'biology',
    description: 'Explore population dynamics in a simulated ecosystem.',
    difficulty: 'advanced',
    duration: 50,
    xpReward: 200,
    objectives: ['Model predator-prey relationships', 'Interpret population curves', 'Assess the effect of resource limits'],
    equipmentNeeded: ['Simulation console', 'Population graph'],
    steps: [
      {
        instruction: 'Run the simulation for one generation and record both populations.',
        equipmentNeeded: ['simulation console'],
        observationFields: ['prey_population', 'predator_population'],
      },
      {
        instruction: 'Change the resource level and observe the new equilibrium.',
        equipmentNeeded: ['simulation console'],
        observationFields: ['prey_population', 'predator_population'],
      },
    ],
    premium: true,
  },
  {
    id: 'biology-osmosis',
    title: 'Osmosis Experiment',
    labSubject: 'Biology',
    labType: 'biology',
    description: 'Study water movement across cell membranes.',
    difficulty: 'intermediate',
    duration: 40,
    xpReward: 150,
    objectives: ['Distinguish osmosis from diffusion', 'Measure change in cell mass', 'Predict the direction of water movement'],
    equipmentNeeded: ['Visking tubing', 'Sucrose solutions', 'Balance'],
    steps: [
      {
        instruction: 'Place the tubing in the sucrose solution and record its initial mass.',
        equipmentNeeded: ['visking tubing', 'balance'],
        observationFields: ['initial_mass_g'],
      },
      {
        instruction: 'Leave for 30 minutes then reweigh the tubing.',
        equipmentNeeded: ['visking tubing', 'balance'],
        observationFields: ['final_mass_g'],
      },
      {
        instruction: 'Explain the direction of water movement using the results.',
        equipmentNeeded: ['calculator'],
        observationFields: ['change_in_mass_g'],
      },
    ],
    premium: true,
  },
  {
    id: 'math-geometry',
    title: 'Interactive Geometry',
    labSubject: 'Mathematics',
    labType: 'physics',
    description: 'Visualise geometric shapes and transformations.',
    difficulty: 'intermediate',
    duration: 30,
    xpReward: 120,
    objectives: ['Identify properties of 2D shapes', 'Apply rotation, reflection and translation', 'Calculate interior angles'],
    equipmentNeeded: ['Shape canvas', 'Protractor'],
    steps: [
      {
        instruction: 'Draw a regular polygon and measure each interior angle.',
        equipmentNeeded: ['shape canvas', 'protractor'],
        observationFields: ['interior_angle_deg'],
      },
      {
        instruction: 'Apply a reflection and describe how side lengths are preserved.',
        equipmentNeeded: ['shape canvas'],
        observationFields: ['side_length_cm'],
      },
    ],
    premium: false,
  },
  {
    id: 'math-statistics',
    title: 'Data Analysis Lab',
    labSubject: 'Mathematics',
    labType: 'physics',
    description: 'Analyse datasets and calculate statistical measures.',
    difficulty: 'advanced',
    duration: 45,
    xpReward: 150,
    objectives: ['Calculate the mean and median', 'Interpret a frequency table', 'Draw and read a histogram'],
    equipmentNeeded: ['Dataset', 'Graph canvas'],
    steps: [
      {
        instruction: 'Calculate the mean and median of the dataset.',
        equipmentNeeded: ['dataset'],
        observationFields: ['mean', 'median'],
      },
      {
        instruction: 'Plot a histogram and use it to identify the modal class.',
        equipmentNeeded: ['graph canvas'],
        observationFields: ['modal_class'],
      },
    ],
    premium: true,
  },
];