// types/lab.ts - Virtual Lab Types

export type LabEquipment = 
  | 'beaker' | 'test_tube' | 'flask' | 'burette' 
  | 'pipette' | 'measuring_cylinder' | 'bunsen_burner'
  | 'tripod_stand' | 'wire_gauze' | 'funnel'
  | 'filter_paper' | 'evaporating_dish' | 'thermometer';

export type ChemicalState = 'solid' | 'liquid' | 'gas' | 'aqueous';

export type ObservationType = 
  | 'color_change' | 'temperature_change' | 'gas_produced' 
  | 'precipitate_formed' | 'ph_change' | 'no_change';

export interface Chemical {
  id: string;
  name: string;
  formula: string;
  state: ChemicalState;
  concentration?: number; // mol/dm³
  color: string;
  hazardSymbols?: string[];
  safetyNotes?: string;
}

export interface LabEquipmentItem {
  id: string;
  type: LabEquipment;
  position: { x: number; y: number };
  contents?: {
    chemicalId: string;
    volume: number; // in mL
  }[];
  isHeating: boolean;
}

export interface ReactionRule {
  id: string;
  name: string;
  reactants: {
    chemicalId: string;
    state: ChemicalState;
    concentration?: number;
  }[];
  products: {
    chemicalId: string;
    state: ChemicalState;
    formula: string;
  }[];
  conditions: {
    heating: boolean;
    catalyst?: string;
    temperature?: number;
  };
  observations: {
    type: ObservationType;
    description: string;
    expectedValue: string;
  }[];
  safetyNotes: string;
  xpReward: number;
}

export interface Experiment {
  id: string;
  title: string;
  subject: 'chemistry' | 'physics' | 'biology';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  objectives: string[];
  duration: number; // minutes
  steps: ExperimentStep[];
  requiredEquipment: LabEquipment[];
  requiredChemicals: string[]; // chemical IDs
  xpReward: number;
  badgeId?: string;
}

export interface ExperimentStep {
  id: string;
  order: number;
  instruction: string;
  expectedAction: string;
  equipmentNeeded: LabEquipment[];
  chemicalNeeded?: string;
  volume?: number;
  observationFields: ObservationType[];
  hint?: string;
  initialState?: {
    equipment: {
      [key: string]: {
        contents?: {
          chemicalId: string;
          volume: number;
        };
        isHeating: boolean;
      };
    };
    chemicals: {
      [key: string]: {
        concentration?: number;
        state: ChemicalState;
      };
    };
   components: {
      [key: string]: PhysicsComponent;
      
   }
  }
}

export interface StudentExperiment {
  id: string;
  experimentId: string;
  studentId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  score: number;
  xpEarned: number;
  observations: StudentObservation[];
  currentStep: number;
  attempts: number;
}

export interface StudentObservation {
  id: string;
  stepId: string;
  type: ObservationType;
  studentValue: string;
  expectedValue: string;
  isCorrect: boolean;
  points: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'experiment_count' | 'score_threshold' | 'specific_experiment';
    value: number | string;
  };
}

// Physics-specific types
export type PhysicsEquipment = 
  | 'battery' | 'wire' | 'resistor' | 'bulb' | 'switch'
  | 'ammeter' | 'voltmeter' | 'rheostat' | 'magnet'
  | 'compass' | 'iron_filings' | 'solenoid' | 'galvanometer'
  | 'lens_convex' | 'lens_concave' | 'mirror_concave' 
  | 'mirror_convex' | 'prism' | 'screen' | 'optical_bench'
  | 'spring' | 'weight' | 'pulley' | 'inclined_plane'
  | 'stopwatch' | 'meter_rule' | 'protractor';

export type PhysicsComponent = {
  id: string;
  type: PhysicsEquipment;
  position: { x: number; y: number };
  rotation?: number;
  properties: {
    resistance?: number; // ohms
    voltage?: number; // volts
    current?: number; // amps
    focalLength?: number; // cm
    mass?: number; // grams
    springConstant?: number; // N/m
    angle?: number; // degrees
  };
  connections?: string[]; // IDs of connected components
  isActive: boolean;
};

export type CircuitNode = {
  id: string;
  components: string[];
  voltage: number;
};

export interface PhysicsExperiment extends Experiment {
  subject: 'physics';
  topic: 'electricity' | 'magnetism' | 'optics' | 'mechanics';
  circuitDiagram?: string;
  requiredMeasurements: {
    type: 'voltage' | 'current' | 'resistance' | 'focal_length' | 'angle' | 'time' | 'distance';
    unit: string;
    expectedRange: { min: number; max: number };
  }[];
}

// Biology-specific types
export type BiologyEquipment =
  | 'microscope' | 'slides' | 'cover_slips' | 'petri_dish'
  | 'test_tube' | 'beaker' | 'scalpel' | 'forceps'
  | 'dropper' | 'iodine_solution' | 'methylene_blue'
  | 'water_bath' | 'thermometer' | 'hand_lens'
  | 'dissecting_pan' | 'pins' | 'probe' | 'scissors';

export type Specimen = 
  | 'onion_epidermis' | 'cheek_cells' | 'leaf_epidermis'
  | 'pond_water' | 'yeast_culture' | 'bacteria_culture'
  | 'blood_smear' | 'muscle_tissue' | 'root_tip'
  | 'flower_dissection' | 'frog_dissection' | 'earthworm';

export type CellOrganelle = 
  | 'nucleus' | 'cytoplasm' | 'cell_wall' | 'cell_membrane'
  | 'chloroplast' | 'mitochondria' | 'vacuole' | 'ribosome'
  | 'endoplasmic_reticulum' | 'golgi_body';

export interface MicroscopeView {
  magnification: 40 | 100 | 400 | 1000;
  focus: number;
  lightIntensity: number;
  stage: { x: number; y: number };
  visibleOrganelles: CellOrganelle[];
}

export interface BiologyExperiment extends Experiment {
  subject: 'biology';
  topic: 'cell_biology' | 'microbiology' | 'anatomy' | 'botany' | 'zoology';
  specimen?: Specimen;
  microscopeSettings?: MicroscopeView;
  stainingRequired: boolean;
  dissectionSteps?: {
    organ: string;
    instruction: string;
    expectedObservations: string[];
  }[];
}