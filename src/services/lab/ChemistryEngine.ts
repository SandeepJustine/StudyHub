// services/lab/ChemistryEngine.ts
// Rule-based chemistry experiment engine

import { Chemical, ReactionRule, ExperimentStep, StudentObservation } from '../../types/lab';

export class ChemistryEngine {
  private reactionRules: ReactionRule[] = [];
  private chemicalCatalog: Map<string, Chemical> = new Map();

  constructor() {
    this.initializeChemicals();
    this.initializeReactions();
  }

  private initializeChemicals() {
    const chemicals: Chemical[] = [
      { id: 'water', name: 'Water', formula: 'H₂O', state: 'liquid', color: 'colorless' },
      { id: 'hcl', name: 'Hydrochloric Acid', formula: 'HCl', state: 'aqueous', concentration: 2, color: 'colorless', hazardSymbols: ['corrosive'] },
      { id: 'h2so4', name: 'Sulfuric Acid', formula: 'H₂SO₄', state: 'aqueous', concentration: 1, color: 'colorless', hazardSymbols: ['corrosive'] },
      { id: 'naoh', name: 'Sodium Hydroxide', formula: 'NaOH', state: 'aqueous', concentration: 2, color: 'colorless', hazardSymbols: ['corrosive'] },
      { id: 'cuso4', name: 'Copper Sulfate', formula: 'CuSO₄', state: 'aqueous', concentration: 1, color: 'blue' },
      { id: 'zinc', name: 'Zinc', formula: 'Zn', state: 'solid', color: 'grey' },
      { id: 'magnesium', name: 'Magnesium', formula: 'Mg', state: 'solid', color: 'silver' },
      { id: 'iron', name: 'Iron', formula: 'Fe', state: 'solid', color: 'grey' },
      { id: 'nacl', name: 'Sodium Chloride', formula: 'NaCl', state: 'solid', color: 'white' },
      { id: 'limewater', name: 'Lime Water', formula: 'Ca(OH)₂', state: 'aqueous', color: 'colorless' },
      { id: 'mno2', name: 'Manganese Dioxide', formula: 'MnO₂', state: 'solid', color: 'black' },
      { id: 'h2o2', name: 'Hydrogen Peroxide', formula: 'H₂O₂', state: 'aqueous', concentration: 3, color: 'colorless' },
      { id: 'caco3', name: 'Calcium Carbonate', formula: 'CaCO₃', state: 'solid', color: 'white' },
      { id: 'universal_indicator', name: 'Universal Indicator', formula: 'UI', state: 'liquid', color: 'green' },
      { id: 'phenolphthalein', name: 'Phenolphthalein', formula: 'C₂₀H₁₄O₄', state: 'liquid', color: 'colorless' },
    ];

    chemicals.forEach(chem => this.chemicalCatalog.set(chem.id, chem));
  }

  private initializeReactions() {
    this.reactionRules = [
      {
        id: 'hcl_naoh_neutralization',
        name: 'HCl + NaOH Neutralization',
        reactants: [
          { chemicalId: 'hcl', state: 'aqueous', concentration: 2 },
          { chemicalId: 'naoh', state: 'aqueous', concentration: 2 }
        ],
        products: [
          { chemicalId: 'nacl', state: 'aqueous', formula: 'NaCl' },
          { chemicalId: 'water', state: 'liquid', formula: 'H₂O' }
        ],
        conditions: { heating: false },
        observations: [
          { type: 'temperature_change', description: 'Temperature increases', expectedValue: 'increases' },
          { type: 'color_change', description: 'Solution remains colorless', expectedValue: 'colorless' },
          { type: 'no_change', description: 'No visible gas produced', expectedValue: 'none' }
        ],
        safetyNotes: 'Both chemicals are corrosive. Wear safety goggles.',
        xpReward: 20
      },
      {
        id: 'zinc_hcl',
        name: 'Zinc + Hydrochloric Acid',
        reactants: [
          { chemicalId: 'zinc', state: 'solid' },
          { chemicalId: 'hcl', state: 'aqueous', concentration: 2 }
        ],
        products: [
          { chemicalId: 'hydrogen', state: 'gas', formula: 'H₂' },
          { chemicalId: 'zncl2', state: 'aqueous', formula: 'ZnCl₂' }
        ],
        conditions: { heating: false },
        observations: [
          { type: 'gas_produced', description: 'Bubbles of hydrogen gas', expectedValue: 'bubbles' },
          { type: 'temperature_change', description: 'Slight temperature increase', expectedValue: 'slight_increase' },
          { type: 'color_change', description: 'Zinc metal dissolves', expectedValue: 'metal_dissolves' }
        ],
        safetyNotes: 'Hydrogen gas is flammable. Keep away from open flames.',
        xpReward: 25
      },
      {
        id: 'magnesium_oxygen',
        name: 'Magnesium + Oxygen',
        reactants: [
          { chemicalId: 'magnesium', state: 'solid' },
          { chemicalId: 'oxygen', state: 'gas' }
        ],
        products: [
          { chemicalId: 'mgo', state: 'solid', formula: 'MgO' }
        ],
        conditions: { heating: true, temperature: 600 },
        observations: [
          { type: 'color_change', description: 'Bright white light', expectedValue: 'bright_white_light' },
          { type: 'temperature_change', description: 'Intense heat produced', expectedValue: 'intense_heat' },
          { type: 'color_change', description: 'White powder forms', expectedValue: 'white_powder' }
        ],
        safetyNotes: 'Do not look directly at burning magnesium. UV radiation hazard.',
        xpReward: 30
      },
      {
        id: 'caco3_hcl',
        name: 'Calcium Carbonate + HCl (CO₂ Preparation)',
        reactants: [
          { chemicalId: 'caco3', state: 'solid' },
          { chemicalId: 'hcl', state: 'aqueous', concentration: 2 }
        ],
        products: [
          { chemicalId: 'co2', state: 'gas', formula: 'CO₂' },
          { chemicalId: 'cacl2', state: 'aqueous', formula: 'CaCl₂' },
          { chemicalId: 'water', state: 'liquid', formula: 'H₂O' }
        ],
        conditions: { heating: false },
        observations: [
          { type: 'gas_produced', description: 'Effervescence - CO₂ bubbles', expectedValue: 'effervescence' },
          { type: 'color_change', description: 'Solid dissolves', expectedValue: 'solid_dissolves' },
          { type: 'no_change', description: 'Gas turns limewater milky', expectedValue: 'limewater_milky' }
        ],
        safetyNotes: 'Perform in well-ventilated area.',
        xpReward: 25
      },
      {
        id: 'titration_hcl_naoh',
        name: 'Acid-Base Titration (HCl + NaOH)',
        reactants: [
          { chemicalId: 'hcl', state: 'aqueous', concentration: 1 },
          { chemicalId: 'naoh', state: 'aqueous', concentration: 1 }
        ],
        products: [
          { chemicalId: 'nacl', state: 'aqueous', formula: 'NaCl' },
          { chemicalId: 'water', state: 'liquid', formula: 'H₂O' }
        ],
        conditions: { heating: false },
        observations: [
          { type: 'color_change', description: 'Indicator changes at endpoint', expectedValue: 'pink_to_colorless' },
          { type: 'no_change', description: 'Neutral solution forms', expectedValue: 'neutral' }
        ],
        safetyNotes: 'Use burette carefully. Read meniscus at eye level.',
        xpReward: 35
      }
    ];
  }

  processReaction(
    reactants: { chemicalId: string; volume?: number }[],
    conditions: { heating: boolean; temperature?: number }
  ): { 
    success: boolean; 
    reaction?: ReactionRule;
    observations: { type: ObservationType; expectedValue: string }[];
    xpReward: number;
    error?: string;
  } {
    // Find matching reaction rule
    const matchingReaction = this.reactionRules.find(rule => {
      if (rule.reactants.length !== reactants.length) return false;
      
      return rule.reactants.every(ruleReactant => 
        reactants.some(r => 
          r.chemicalId === ruleReactant.chemicalId &&
          (ruleReactant.concentration ? Math.abs((r.volume || 0) - 20) < 5 : true) // Volume tolerance
        )
      );
    });

    if (!matchingReaction) {
      return {
        success: false,
        observations: [],
        xpReward: 0,
        error: 'No reaction occurs with these chemicals under these conditions.'
      };
    }

    // Check conditions
    if (matchingReaction.conditions.heating !== conditions.heating) {
      return {
        success: false,
        observations: [],
        xpReward: 5, // Partial credit for attempting
        error: conditions.heating 
          ? 'Heating is not required for this reaction.' 
          : 'This reaction requires heating.'
      };
    }

    return {
      success: true,
      reaction: matchingReaction,
      observations: matchingReaction.observations,
      xpReward: matchingReaction.xpReward,
      error: undefined
    };
  }

  validateObservation(
    reaction: ReactionRule,
    studentObservation: { type: ObservationType; value: string }
  ): { isCorrect: boolean; points: number; feedback: string } {
    const expected = reaction.observations.find(obs => obs.type === studentObservation.type);
    
    if (!expected) {
      return { isCorrect: false, points: 0, feedback: 'Unexpected observation type.' };
    }

    // Simple string matching with tolerance for variations
    const isCorrect = this.normalizeObservation(studentObservation.value) === 
                     this.normalizeObservation(expected.expectedValue);

    return {
      isCorrect,
      points: isCorrect ? 5 : 0,
      feedback: isCorrect 
        ? 'Correct observation! Well done.' 
        : `Expected: ${expected.description}. Try again!`
    };
  }

  calculateScore(observations: StudentObservation[]): number {
    const totalPossible = observations.length * 5;
    const earned = observations.reduce((sum, obs) => sum + obs.points, 0);
    return Math.round((earned / totalPossible) * 100);
  }

  getStepHint(step: ExperimentStep): string {
    const hints: Record<string, string> = {
      'acid_base_neutralization': 'Start with the acid in the beaker, then slowly add the base.',
      'metal_acid': 'Add the metal pieces one at a time to observe the reaction rate.',
      'gas_preparation': 'Set up the apparatus to collect gas over water or in a gas syringe.',
      'titration': 'Add indicator first, then titrate until the endpoint color change.',
      'filtration': 'Fold the filter paper into a cone shape before placing in the funnel.'
    };

    return hints[step.id] || 'Follow the procedure carefully and record all observations.';
  }

  private normalizeObservation(value: string): string {
    return value.toLowerCase().replace(/[^a-z_]/g, '');
  }

  getChemical(id: string): Chemical | undefined {
    return this.chemicalCatalog.get(id);
  }

  getAllChemicals(): Chemical[] {
    return Array.from(this.chemicalCatalog.values());
  }
}