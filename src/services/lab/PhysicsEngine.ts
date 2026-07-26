// services/lab/PhysicsEngine.ts
// Physics simulation engine

import { PhysicsComponent, PhysicsExperiment, CircuitNode } from '../../types/lab';

interface PhysicsRule {
  id: string;
  name: string;
  formula: string;
  validate: (components: PhysicsComponent[], measurements: any) => boolean;
  expectedResults: (components: PhysicsComponent[]) => any;
}

export class PhysicsEngine {
  private rules: PhysicsRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.rules = [
      // Ohm's Law: V = IR
      {
        id: 'ohms_law',
        name: "Ohm's Law Verification",
        formula: 'V = IR',
        validate: (components, measurements) => {
          const resistor = components.find(c => c.type === 'resistor');
          const battery = components.find(c => c.type === 'battery');
          
          if (!resistor || !battery) return false;
          
          const expectedCurrent = battery.properties.voltage! / resistor.properties.resistance!;
          const measuredCurrent = measurements.current;
          
          return Math.abs(expectedCurrent - measuredCurrent) < 0.1; // 0.1A tolerance
        },
        expectedResults: (components) => {
          const resistor = components.find(c => c.type === 'resistor');
          const battery = components.find(c => c.type === 'battery');
          
          return {
            voltage: battery?.properties.voltage,
            resistance: resistor?.properties.resistance,
            current: battery && resistor 
              ? battery.properties.voltage! / resistor.properties.resistance! 
              : 0
          };
        }
      },
      
      // Series Circuit: Total R = R1 + R2 + ...
      {
        id: 'series_resistance',
        name: 'Resistors in Series',
        formula: 'R_total = R1 + R2 + ...',
        validate: (components, measurements) => {
          const resistors = components.filter(c => c.type === 'resistor');
          const expectedTotal = resistors.reduce((sum, r) => sum + (r.properties.resistance || 0), 0);
          
          return Math.abs(expectedTotal - measurements.totalResistance) < 1;
        },
        expectedResults: (components) => {
          const resistors = components.filter(c => c.type === 'resistor');
          return {
            totalResistance: resistors.reduce((sum, r) => sum + (r.properties.resistance || 0), 0),
            individualResistances: resistors.map(r => r.properties.resistance)
          };
        }
      },
      
      // Parallel Circuit: 1/R = 1/R1 + 1/R2 + ...
      {
        id: 'parallel_resistance',
        name: 'Resistors in Parallel',
        formula: '1/R_total = 1/R1 + 1/R2 + ...',
        validate: (components, measurements) => {
          const resistors = components.filter(c => c.type === 'resistor');
          const reciprocalSum = resistors.reduce((sum, r) => sum + 1 / (r.properties.resistance || 1), 0);
          const expectedTotal = 1 / reciprocalSum;
          
          return Math.abs(expectedTotal - measurements.totalResistance) < 1;
        },
        expectedResults: (components) => {
          const resistors = components.filter(c => c.type === 'resistor');
          const reciprocalSum = resistors.reduce((sum, r) => sum + 1 / (r.properties.resistance || 1), 0);
          return {
            totalResistance: 1 / reciprocalSum,
            individualResistances: resistors.map(r => r.properties.resistance)
          };
        }
      },
      
      // Magnetic Field Lines
      {
        id: 'magnetic_field',
        name: 'Magnetic Field Lines',
        formula: 'Field direction: North to South',
        validate: (components, measurements) => {
          const magnet = components.find(c => c.type === 'magnet');
          if (!magnet) return false;
          
          // Check compass direction at different points
          return measurements.fieldDirection === 'north_to_south';
        },
        expectedResults: () => ({
          fieldPattern: 'Lines emerge from North pole and enter South pole',
          fieldStrength: 'Strongest at poles'
        })
      },
      
      // Lens Formula: 1/f = 1/u + 1/v
      {
        id: 'lens_formula',
        name: 'Convex Lens - Image Formation',
        formula: '1/f = 1/u + 1/v',
        validate: (components, measurements) => {
          const lens = components.find(c => c.type === 'lens_convex');
          if (!lens || !lens.properties.focalLength) return false;
          
          const f = lens.properties.focalLength;
          const u = measurements.objectDistance;
          const v = measurements.imageDistance;
          
          const calculatedV = 1 / (1/f - 1/u);
          return Math.abs(calculatedV - v) < 0.5; // 0.5cm tolerance
        },
        expectedResults: (components) => {
          const lens = components.find(c => c.type === 'lens_convex');
          const f = lens?.properties.focalLength || 10;
          
          return {
            focalLength: f,
            imageCharacteristics: {
              'beyond_2f': 'Real, inverted, diminished',
              'at_2f': 'Real, inverted, same size',
              'between_f_and_2f': 'Real, inverted, magnified',
              'at_f': 'Image at infinity',
              'inside_f': 'Virtual, erect, magnified'
            }
          };
        }
      },
      
      // Hooke's Law: F = kx
      {
        id: 'hookes_law',
        name: "Hooke's Law",
        formula: 'F = kx',
        validate: (components, measurements) => {
          const spring = components.find(c => c.type === 'spring');
          if (!spring || !spring.properties.springConstant) return false;
          
          const expectedExtension = measurements.force / spring.properties.springConstant;
          return Math.abs(expectedExtension - measurements.extension) < 0.1; // 0.1cm tolerance
        },
        expectedResults: (components) => {
          const spring = components.find(c => c.type === 'spring');
          return {
            springConstant: spring?.properties.springConstant,
            relationship: 'Force is directly proportional to extension'
          };
        }
      },
      
      // Simple Pendulum: T = 2π√(l/g)
      {
        id: 'simple_pendulum',
        name: 'Simple Pendulum - Period',
        formula: 'T = 2π√(l/g)',
        validate: (components, measurements) => {
          const length = measurements.pendulumLength;
          const expectedPeriod = 2 * Math.PI * Math.sqrt(length / 9.81);
          
          return Math.abs(expectedPeriod - measurements.period) < 0.05; // 0.05s tolerance
        },
        expectedResults: (components) => ({
          g: 9.81,
          relationship: 'T² ∝ L'
        })
      }
    ];
  }

  simulateCircuit(components: PhysicsComponent[]): {
    nodes: CircuitNode[];
    currentFlow: number;
    powerDissipated: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let currentFlow = 0;
    let powerDissipated = 0;
    
    // Check for short circuit
    const hasShortCircuit = this.detectShortCircuit(components);
    if (hasShortCircuit) {
      warnings.push('⚠️ Short circuit detected! Circuit may overheat.');
      return { nodes: [], currentFlow: 0, powerDissipated: 0, warnings };
    }
    
    // Calculate total resistance
    const resistors = components.filter(c => c.type === 'resistor');
    const totalResistance = resistors.reduce((sum, r) => sum + (r.properties.resistance || 0), 0);
    
    // Find battery voltage
    const battery = components.find(c => c.type === 'battery');
    const voltage = battery?.properties.voltage || 0;
    
    // Calculate current (Ohm's Law)
    if (totalResistance > 0) {
      currentFlow = voltage / totalResistance;
      powerDissipated = voltage * currentFlow;
    }
    
    // Check component ratings
    components.forEach(comp => {
      if (comp.type === 'resistor' && comp.properties.resistance) {
        const powerRating = 0.25; // 1/4 watt typical
        const actualPower = currentFlow * currentFlow * comp.properties.resistance;
        if (actualPower > powerRating) {
          warnings.push(`⚠️ Resistor may overheat! Power: ${actualPower.toFixed(2)}W`);
        }
      }
    });
    
    return {
      nodes: this.calculateNodes(components),
      currentFlow,
      powerDissipated,
      warnings
    };
  }

  simulateOptics(
    lensType: 'lens_convex' | 'lens_concave',
    focalLength: number,
    objectDistance: number,
    objectHeight: number
  ): {
    imageDistance: number;
    imageHeight: number;
    magnification: number;
    imageType: 'real' | 'virtual';
    imageOrientation: 'inverted' | 'erect';
    rayDiagram: { rays: { start: {x: number, y: number}, end: {x: number, y: number} }[] };
  } {
    // Lens formula: 1/f = 1/v - 1/u (sign convention)
    const u = -Math.abs(objectDistance);
    const f = lensType === 'lens_convex' ? Math.abs(focalLength) : -Math.abs(focalLength);
    
    const v = 1 / (1/f - 1/u);
    const magnification = v / u;
    const imageHeight = Math.abs(magnification) * objectHeight;
    
    return {
      imageDistance: v,
      imageHeight,
      magnification: Math.abs(magnification),
      imageType: v > 0 ? 'real' : 'virtual',
      imageOrientation: magnification > 0 ? 'erect' : 'inverted',
      rayDiagram: this.generateRayDiagram(f, u, objectHeight)
    };
  }

  private detectShortCircuit(components: PhysicsComponent[]): boolean {
    // Simplified short circuit detection
    let hasDirectConnection = false;
    
    components.forEach(comp => {
      if (comp.type === 'wire' && comp.connections) {
        const connectedComponents = comp.connections.map(id => 
          components.find(c => c.id === id)
        );
        
        // Check if wire connects battery terminals directly
        const hasBatteryConnection = connectedComponents.some(c => c?.type === 'battery');
        if (hasBatteryConnection && comp.properties.resistance === 0) {
          hasDirectConnection = true;
        }
      }
    });
    
    return hasDirectConnection;
  }

  private calculateNodes(components: PhysicsComponent[]): CircuitNode[] {
    // Simplified node analysis
    const battery = components.find(c => c.type === 'battery');
    const voltage = battery?.properties.voltage || 0;
    
    return [{
      id: 'main_circuit',
      components: components.map(c => c.id),
      voltage
    }];
  }

  private generateRayDiagram(f: number, u: number, objectHeight: number) {
    const rays = [];
    
    // Ray 1: Parallel to axis, then through focal point
    rays.push({
      start: { x: u, y: objectHeight },
      end: { x: f, y: 0 }
    });
    
    // Ray 2: Through center of lens
    rays.push({
      start: { x: u, y: objectHeight },
      end: { x: -u, y: -objectHeight }
    });
    
    // Ray 3: Through focal point on object side, then parallel
    rays.push({
      start: { x: u, y: objectHeight },
      end: { x: -f, y: 0 }
    });
    
    return { rays };
  }

  getRule(ruleId: string): PhysicsRule | undefined {
    return this.rules.find(r => r.id === ruleId);
  }
}