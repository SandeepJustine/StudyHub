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

const CONDUCTOR_RESISTANCE_THRESHOLD = 0.5; // ohms — below this, a wire is treated as a plain conductor
const RESISTIVE_TYPES = new Set(['resistor', 'rheostat', 'bulb', 'wire']);

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

    const battery = components.find(c => c.type === 'battery');
    if (!battery) {
      return { nodes: [], currentFlow: 0, powerDissipated: 0, warnings: ['Add a battery to power the circuit.'] };
    }

    // Only components actually wired to the battery should count. The
    // previous version summed every resistor on the board even if it was
    // just sitting disconnected, which meant the wiring tool had no real
    // effect on the result.
    const connectedIds = this.getConnectedSubgraph(components, battery.id);
    const inCircuit = components.filter(c => connectedIds.has(c.id));

    if (inCircuit.length <= 1) {
      warnings.push('Nothing is wired to the battery yet — connect components with the wiring tool.');
      return { nodes: this.calculateNodes(inCircuit), currentFlow: 0, powerDissipated: 0, warnings };
    }

    // An open switch breaks the (single, shared) loop. This engine models
    // each component as one graph node rather than a two-terminal element,
    // so it can't tell whether a bypass branch exists around the switch —
    // any open switch in the connected set is treated as breaking the whole
    // circuit, which is correct for the common single-loop case this lab
    // is built around.
    const openSwitch = inCircuit.find(c => c.type === 'switch' && !c.isActive);
    if (openSwitch) {
      warnings.push('Circuit is open — close the switch to let current flow.');
      return { nodes: this.calculateNodes(inCircuit), currentFlow: 0, powerDissipated: 0, warnings };
    }

    if (this.detectShortCircuit(inCircuit, battery)) {
      warnings.push('⚠️ Short circuit detected! Circuit may overheat.');
      return { nodes: [], currentFlow: 0, powerDissipated: 0, warnings };
    }

    const totalResistance = this.resolveEquivalentResistance(inCircuit, warnings);
    const voltage = inCircuit
      .filter(c => c.type === 'battery')
      .reduce((sum, b) => sum + (b.properties.voltage || 0), 0);

    let currentFlow = 0;
    let powerDissipated = 0;
    if (totalResistance > 0) {
      currentFlow = voltage / totalResistance;
      powerDissipated = voltage * currentFlow;
    } else {
      warnings.push('No resistance in the circuit — add a resistor, bulb, or rheostat before closing the loop.');
    }

    inCircuit.forEach(comp => {
      if ((comp.type === 'resistor' || comp.type === 'rheostat') && comp.properties.resistance) {
        const powerRating = 0.25; // 1/4 watt typical
        const actualPower = currentFlow * currentFlow * comp.properties.resistance;
        if (actualPower > powerRating) {
          warnings.push(`⚠️ ${comp.type === 'rheostat' ? 'Rheostat' : 'Resistor'} may overheat! Power: ${actualPower.toFixed(2)}W`);
        }
      }
      if (comp.type === 'bulb' && currentFlow > 3) {
        warnings.push('⚠️ Bulb filament may blow — current exceeds a typical rating.');
      }
    });

    return {
      nodes: this.calculateNodes(inCircuit),
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

  /** BFS over `connections` to find every component reachable from startId. */
  private getConnectedSubgraph(components: PhysicsComponent[], startId: string): Set<string> {
    const byId = new Map(components.map(c => [c.id, c]));
    const visited = new Set<string>();
    const queue: string[] = [startId];
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const comp = byId.get(id);
      (comp?.connections || []).forEach(n => {
        if (!visited.has(n)) queue.push(n);
      });
    }
    return visited;
  }

  /**
   * Reduces the connected, non-battery components to a single equivalent
   * resistance. Components that share an identical connection signature
   * (i.e. bridge the exact same two neighbours) are recognised as a
   * parallel bank and combined with 1/R = Σ(1/Ri); everything else is
   * summed as if in series. This is an honest approximation, not a general
   * circuit solver — the underlying data model has one graph node per
   * component rather than per-terminal, so more exotic (non-planar, mixed
   * bridge) topologies fall back to a plain series sum.
   */
  private resolveEquivalentResistance(components: PhysicsComponent[], warnings: string[]): number {
    const resistive = components.filter(c => RESISTIVE_TYPES.has(c.type) && (c.properties.resistance || 0) > 0);
    if (resistive.length === 0) return 0;

    const used = new Set<string>();
    let total = 0;

    resistive.forEach(comp => {
      if (used.has(comp.id)) return;
      const signature = JSON.stringify([...(comp.connections || [])].sort());
      const group = signature === '[]' ? [comp] : resistive.filter(o => !used.has(o.id) && JSON.stringify([...(o.connections || [])].sort()) === signature);

      if (group.length > 1) {
        const reciprocalSum = group.reduce((sum, g) => sum + 1 / (g.properties.resistance || Infinity), 0);
        total += reciprocalSum > 0 ? 1 / reciprocalSum : 0;
        warnings.push(`Combined ${group.length} components wired in parallel between the same points.`);
      } else {
        total += comp.properties.resistance || 0;
      }
      group.forEach(g => used.add(g.id));
    });

    return total;
  }

  /**
   * Standard undirected cycle detection, restricted to "conductor" nodes
   * (the battery itself, plain wire below the conductor threshold, and
   * closed switches). A cycle here means current has a path back to the
   * battery without ever passing through a resistive load — a short.
   */
  private detectShortCircuit(components: PhysicsComponent[], battery: PhysicsComponent): boolean {
    const byId = new Map(components.map(c => [c.id, c]));
    const isConductor = (id: string): boolean => {
      if (id === battery.id) return true;
      const c = byId.get(id);
      if (!c) return false;
      if (c.type === 'wire') return (c.properties.resistance ?? 0) < CONDUCTOR_RESISTANCE_THRESHOLD;
      if (c.type === 'switch') return !!c.isActive;
      return false;
    };

    const visited = new Set<string>();
    const hasCycle = (id: string, parent: string | null): boolean => {
      visited.add(id);
      const comp = byId.get(id);
      for (const n of comp?.connections || []) {
        if (!isConductor(n)) continue;
        if (n === parent) continue;
        if (visited.has(n)) return true;
        if (hasCycle(n, id)) return true;
      }
      return false;
    };

    return hasCycle(battery.id, null);
  }

  private calculateNodes(components: PhysicsComponent[]): CircuitNode[] {
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

  getAllRules(): PhysicsRule[] {
    return this.rules;
  }
}