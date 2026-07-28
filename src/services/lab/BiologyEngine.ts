// services/lab/BiologyEngine.ts - Fixed with explicit public methods
// Biology simulation engine

import { 
  BiologyExperiment, Specimen, CellOrganelle, 
  MicroscopeView, BiologyEquipment 
} from '../../types/lab';

interface CellStructure {
  name: string;
  organelles: {
    organelle: CellOrganelle;
    visible: boolean;
    description: string;
    function: string;
  }[];
  stainingRequired: boolean;
  magnification: number;
}

interface DissectionStep {
  organ: string;
  location: string;
  appearance: string;
  function: string;
  systems: string[];
}

export class BiologyEngine {
  private cellStructures: Map<Specimen, CellStructure> = new Map();
  private dissectionGuides: Map<Specimen, DissectionStep[]> = new Map();
  private currentMicroscope: MicroscopeView = {
    magnification: 40,
    focus: 50,
    lightIntensity: 70,
    stage: { x: 0, y: 0 },
    visibleOrganelles: []
  };

  constructor() {
    this.initializeSpecimens();
  }

  private initializeSpecimens() {
    // Onion Epidermis Cells
    this.cellStructures.set('onion_epidermis', {
      name: 'Onion Epidermis Cells',
      organelles: [
        { 
          organelle: 'cell_wall', 
          visible: true, 
          description: 'Rigid outer layer, rectangular shape',
          function: 'Provides structure and protection'
        },
        { 
          organelle: 'nucleus', 
          visible: true, 
          description: 'Dark, round structure inside cell',
          function: 'Contains genetic material (DNA)'
        },
        { 
          organelle: 'cytoplasm', 
          visible: true, 
          description: 'Clear, jelly-like substance',
          function: 'Site of metabolic reactions'
        },
        { 
          organelle: 'vacuole', 
          visible: true, 
          description: 'Large, clear space in center',
          function: 'Stores water and nutrients'
        }
      ],
      stainingRequired: true,
      magnification: 100
    });

    // Cheek Cells (Human)
    this.cellStructures.set('cheek_cells', {
      name: 'Human Cheek Cells',
      organelles: [
        { 
          organelle: 'cell_membrane', 
          visible: true, 
          description: 'Thin outer boundary, irregular shape',
          function: 'Controls what enters and leaves the cell'
        },
        { 
          organelle: 'nucleus', 
          visible: true, 
          description: 'Dark blue structure (with methylene blue stain)',
          function: 'Contains genetic material'
        },
        { 
          organelle: 'cytoplasm', 
          visible: true, 
          description: 'Granular material surrounding nucleus',
          function: 'Site of cellular activities'
        }
      ],
      stainingRequired: true,
      magnification: 400
    });

    // Leaf Epidermis (Stomata)
    this.cellStructures.set('leaf_epidermis', {
      name: 'Leaf Epidermis with Stomata',
      organelles: [
        { 
          organelle: 'cell_wall', 
          visible: true, 
          description: 'Irregular jigsaw-puzzle shape',
          function: 'Protection and structure'
        },
        { 
          organelle: 'chloroplast', 
          visible: true, 
          description: 'Green, oval structures (in guard cells)',
          function: 'Photosynthesis'
        },
        { 
          organelle: 'nucleus', 
          visible: false, 
          description: 'Small, transparent',
          function: 'Genetic control'
        }
      ],
      stainingRequired: false,
      magnification: 100
    });

    // Pond Water (Protists)
    this.cellStructures.set('pond_water', {
      name: 'Pond Water Microorganisms',
      organelles: [
        { 
          organelle: 'cell_membrane', 
          visible: true, 
          description: 'Flexible outer covering',
          function: 'Movement and feeding'
        },
        { 
          organelle: 'vacuole', 
          visible: true, 
          description: 'Contractile vacuoles visible',
          function: 'Osmoregulation'
        },
        { 
          organelle: 'nucleus', 
          visible: true, 
          description: 'Visible in larger organisms',
          function: 'Cell control center'
        }
      ],
      stainingRequired: false,
      magnification: 100
    });

    // Flower Dissection
    this.dissectionGuides.set('flower_dissection', [
      {
        organ: 'Sepals',
        location: 'Outermost whorl, green leaf-like structures',
        appearance: 'Green, protective layer at flower base',
        function: 'Protects developing flower bud',
        systems: ['Reproductive']
      },
      {
        organ: 'Petals',
        location: 'Inside sepals, brightly colored',
        appearance: 'Colored, often fragrant structures',
        function: 'Attract pollinators',
        systems: ['Reproductive']
      },
      {
        organ: 'Stamens (Male)',
        location: 'Inside petals, filament with anther',
        appearance: 'Thin stalk (filament) with yellow tip (anther)',
        function: 'Produces pollen grains (male gametes)',
        systems: ['Reproductive']
      },
      {
        organ: 'Carpel/Pistil (Female)',
        location: 'Center of flower',
        appearance: 'Stigma (sticky top), style (tube), ovary (swollen base)',
        function: 'Receives pollen, contains ovules',
        systems: ['Reproductive']
      },
      {
        organ: 'Ovary',
        location: 'Base of carpel',
        appearance: 'Swollen structure, contains ovules when cut',
        function: 'Develops into fruit after fertilization',
        systems: ['Reproductive']
      }
    ]);

    // Earthworm Dissection
    this.dissectionGuides.set('earthworm', [
      {
        organ: 'Pharynx',
        location: 'Segments 4-5',
        appearance: 'Muscular, thick-walled tube',
        function: 'Sucks in soil and organic matter',
        systems: ['Digestive']
      },
      {
        organ: 'Esophagus',
        location: 'Segments 6-14',
        appearance: 'Narrow tube',
        function: 'Transports food to crop',
        systems: ['Digestive']
      },
      {
        organ: 'Crop',
        location: 'Segments 15-16',
        appearance: 'Thin-walled, enlarged chamber',
        function: 'Temporary food storage',
        systems: ['Digestive']
      },
      {
        organ: 'Gizzard',
        location: 'Segments 17-19',
        appearance: 'Thick, muscular, hard',
        function: 'Grinds food with soil particles',
        systems: ['Digestive']
      },
      {
        organ: 'Intestine',
        location: 'Segments 20 to anus',
        appearance: 'Long, straight tube',
        function: 'Digestion and absorption',
        systems: ['Digestive']
      },
      {
        organ: 'Aortic Arches (Hearts)',
        location: 'Segments 7-11',
        appearance: '5 pairs of dark, curved tubes',
        function: 'Pump blood throughout body',
        systems: ['Circulatory']
      },
      {
        organ: 'Dorsal Blood Vessel',
        location: 'Along the back (dorsal side)',
        appearance: 'Dark red/brown line',
        function: 'Main blood vessel',
        systems: ['Circulatory']
      },
      {
        organ: 'Nerve Cord',
        location: 'Ventral (belly) side, white thread',
        appearance: 'Thin, white thread-like structure',
        function: 'Coordinates movement and responses',
        systems: ['Nervous']
      },
      {
        organ: 'Clitellum',
        location: 'Segments 32-37',
        appearance: 'Thickened, saddle-like band',
        function: 'Secretes cocoon for eggs (reproduction)',
        systems: ['Reproductive']
      }
    ]);
  }

  // PUBLIC METHODS - These are the methods available to components

  viewSpecimen(specimen: Specimen, microscopeView: MicroscopeView): {
    visibleOrganelles: CellOrganelle[];
    image: string;
    annotations: { organelle: string; position: {x: number, y: number}; description: string }[];
  } {
    const structure = this.cellStructures.get(specimen);
    
    if (!structure) {
      throw new Error(`Specimen not found: ${specimen}`);
    }

    // Determine which organelles are visible at current magnification
    const visibleOrganelles = structure.organelles
      .filter(org => {
        if (org.organelle === 'mitochondria' || org.organelle === 'ribosome') {
          return microscopeView.magnification >= 1000;
        }
        if (org.organelle === 'chloroplast') {
          return microscopeView.magnification >= 400 && specimen === 'leaf_epidermis';
        }
        return microscopeView.magnification >= structure.magnification * 0.5;
      })
      .map(org => org.organelle);

    // Generate annotations for visible organelles
    const annotations = structure.organelles
      .filter(org => visibleOrganelles.includes(org.organelle))
      .map((org, index) => ({
        organelle: org.organelle,
        position: this.calculateOrganellePosition(org.organelle, index),
        description: org.description
      }));

    return {
      visibleOrganelles,
      image: `/images/specimens/${specimen}_${microscopeView.magnification}x.jpg`,
      annotations
    };
  }

  applyStain(specimen: Specimen, stain: 'iodine' | 'methylene_blue'): {
    success: boolean;
    message: string;
    enhancedOrganelles: CellOrganelle[];
  } {
    const structure = this.cellStructures.get(specimen);
    
    if (!structure) {
      return { success: false, message: 'Specimen not found', enhancedOrganelles: [] };
    }

    if (!structure.stainingRequired) {
      return { 
        success: false, 
        message: 'Staining not required for this specimen', 
        enhancedOrganelles: [] 
      };
    }

    const correctStain = 
      (specimen === 'onion_epidermis' && stain === 'iodine') ||
      (specimen === 'cheek_cells' && stain === 'methylene_blue');

    if (!correctStain) {
      return {
        success: false,
        message: `Wrong stain! Use ${specimen === 'onion_epidermis' ? 'iodine' : 'methylene_blue'} for this specimen.`,
        enhancedOrganelles: []
      };
    }

    const enhancedOrganelles = structure.organelles
      .filter(org => org.visible)
      .map(org => org.organelle);

    return {
      success: true,
      message: `Successfully stained with ${stain}. Cell structures are now visible.`,
      enhancedOrganelles
    };
  }

  startDissection(specimen: Specimen): DissectionStep[] {
    const guide = this.dissectionGuides.get(specimen);
    
    if (!guide) {
      throw new Error(`No dissection guide available for specimen: ${specimen}`);
    }

    return [...guide]; // Return a copy to prevent mutation
  }

  identifyOrgan(
    specimen: Specimen,
    studentIdentification: { organ: string; location: string },
    expectedOrgan: DissectionStep
  ): {
    isCorrect: boolean;
    score: number;
    feedback: string;
  } {
    const isCorrect = 
      studentIdentification.organ.toLowerCase().trim() === expectedOrgan.organ.toLowerCase().trim();

    return {
      isCorrect,
      score: isCorrect ? 10 : 0,
      feedback: isCorrect 
        ? `✅ Correct! ${expectedOrgan.organ}: ${expectedOrgan.function}` 
        : `❌ Incorrect. This is the ${expectedOrgan.organ}. ${expectedOrgan.appearance}. Hint: ${expectedOrgan.location}`
    };
  }

  compareCells(specimen1: Specimen, specimen2: Specimen): {
    similarities: string[];
    differences: { feature: string; specimen1: string; specimen2: string }[];
  } {
    const cell1 = this.cellStructures.get(specimen1);
    const cell2 = this.cellStructures.get(specimen2);

    if (!cell1 || !cell2) {
      throw new Error('Specimen not found');
    }

    const org1 = new Set(cell1.organelles.map(o => o.organelle));
    const org2 = new Set(cell2.organelles.map(o => o.organelle));

    // Find similarities (common organelles)
    const similarities = [...org1].filter(o => org2.has(o)).map(o => {
      const organelle1 = cell1.organelles.find(org => org.organelle === o);
      return `${o.replace(/_/g, ' ')}: ${organelle1?.function}`;
    });

    // Find differences
    const differences: { feature: string; specimen1: string; specimen2: string }[] = [];
    
    // Organelles only in specimen1
    [...org1].filter(o => !org2.has(o)).forEach(o => {
      differences.push({
        feature: o.replace(/_/g, ' '),
        specimen1: `Present (${cell1.organelles.find(org => org.organelle === o)?.description})`,
        specimen2: 'Absent'
      });
    });

    // Organelles only in specimen2
    [...org2].filter(o => !org1.has(o)).forEach(o => {
      differences.push({
        feature: o.replace(/_/g, ' '),
        specimen1: 'Absent',
        specimen2: `Present (${cell2.organelles.find(org => org.organelle === o)?.description})`
      });
    });

    // Cell wall comparison
    differences.push({
      feature: 'Cell Wall',
      specimen1: org1.has('cell_wall') ? 'Present (plant cell)' : 'Absent (animal cell)',
      specimen2: org2.has('cell_wall') ? 'Present (plant cell)' : 'Absent (animal cell)'
    });

    return { similarities, differences };
  }

  calculateMitoticIndex(cellsObserved: number, cellsInMitosis: number): {
    mitoticIndex: number;
    interpretation: string;
    isCorrect: boolean;
  } {
    if (cellsObserved === 0) {
      return {
        mitoticIndex: 0,
        interpretation: 'No cells observed',
        isCorrect: false
      };
    }

    const mitoticIndex = (cellsInMitosis / cellsObserved) * 100;
    
    let interpretation = '';
    if (mitoticIndex < 5) {
      interpretation = 'Low mitotic activity - normal tissue';
    } else if (mitoticIndex < 20) {
      interpretation = 'Moderate mitotic activity - growing tissue';
    } else {
      interpretation = 'High mitotic activity - possibly meristematic or cancerous tissue';
    }

    return {
      mitoticIndex: Math.round(mitoticIndex * 100) / 100,
      interpretation,
      isCorrect: cellsObserved > 0 && cellsInMitosis >= 0 && cellsInMitosis <= cellsObserved
    };
  }

  // Getter methods
  getAvailableSpecimens(): Specimen[] {
    return Array.from(this.cellStructures.keys());
  }

  getSpecimenInfo(specimen: Specimen): CellStructure | undefined {
    return this.cellStructures.get(specimen);
  }

  getDissectionSpecimens(): Specimen[] {
    return Array.from(this.dissectionGuides.keys());
  }

  // Private helper methods
  private calculateOrganellePosition(organelle: CellOrganelle, index: number): {x: number, y: number} {
    // Simplified position calculation - would be based on actual cell image coordinates
    const positions: Record<CellOrganelle, {x: number, y: number}> = {
      'nucleus': { x: 50, y: 50 },
      'cytoplasm': { x: 30, y: 60 },
      'cell_wall': { x: 10, y: 10 },
      'cell_membrane': { x: 15, y: 15 },
      'chloroplast': { x: 20, y: 40 },
      'mitochondria': { x: 60, y: 30 },
      'vacuole': { x: 50, y: 70 },
      'ribosome': { x: 40, y: 20 },
      'endoplasmic_reticulum': { x: 45, y: 35 },
      'golgi_body': { x: 55, y: 45 }
    };

    return positions[organelle] || { x: 30 + index * 15, y: 40 + index * 10 };
  }
}

// Export a singleton instance for use across components
export const biologyEngine = new BiologyEngine();