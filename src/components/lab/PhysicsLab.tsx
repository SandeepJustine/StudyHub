'use client';

import React, { useMemo, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PhysicsEngine } from '@/services/lab/PhysicsEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PhysicsComponent, PhysicsExperiment, PhysicsEquipment } from '@/types/lab';

const ItemTypes = { PHYSICS_COMPONENT: 'physics_component' };

const COMPONENT_LIBRARY: { type: PhysicsEquipment; icon: string; label: string }[] = [
  { type: 'battery', icon: '🔋', label: 'Battery' },
  { type: 'wire', icon: '➖', label: 'Wire' },
  { type: 'resistor', icon: '⚡', label: 'Resistor' },
  { type: 'bulb', icon: '💡', label: 'Bulb' },
  { type: 'switch', icon: '🔌', label: 'Switch' },
  { type: 'rheostat', icon: '🎚️', label: 'Rheostat' },
  { type: 'ammeter', icon: '🅐', label: 'Ammeter' },
  { type: 'voltmeter', icon: '🅥', label: 'Voltmeter' },
];

const ICONS: Record<string, string> = Object.fromEntries(COMPONENT_LIBRARY.map((c) => [c.type, c.icon]));

const DEFAULT_PROPS: Record<string, PhysicsComponent['properties']> = {
  battery: { voltage: 6 },
  wire: { resistance: 0.1 },
  resistor: { resistance: 10 },
  bulb: { resistance: 3 },
  switch: {},
  rheostat: { resistance: 50 },
  ammeter: {},
  voltmeter: {},
};

function componentKey(a: string, b: string) {
  return [a, b].sort().join('::');
}

export const PhysicsLab: React.FC<{ experiment: PhysicsExperiment }> = ({ experiment }) => {
  const [engine] = useState(() => new PhysicsEngine());
  const [components, setComponents] = useState<PhysicsComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<string | null>(null);
  const [circuitResult, setCircuitResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'circuit' | 'optics' | 'mechanics' | 'magnetism'>('circuit');

  const addComponent = (type: PhysicsEquipment, x: number, y: number) => {
    setComponents((prev) => [
      ...prev,
      {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        position: { x, y },
        properties: { ...(DEFAULT_PROPS[type] || {}) },
        connections: [],
        isActive: type === 'switch' ? true : false,
      },
    ]);
  };

  const moveComponent = (id: string, x: number, y: number) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, position: { x, y } } : c)));
  };

  const removeComponent = (id: string) => {
    setComponents((prev) =>
      prev.filter((c) => c.id !== id).map((c) => ({ ...c, connections: (c.connections || []).filter((cid) => cid !== id) }))
    );
    if (selectedComponent === id) setSelectedComponent(null);
  };

  const updateProperties = (id: string, patch: Partial<PhysicsComponent['properties']>) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, properties: { ...c.properties, ...patch } } : c)));
  };

  const toggleSwitch = (id: string) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  const handleComponentClick = (id: string) => {
    if (!connectMode) {
      setSelectedComponent(id);
      return;
    }
    if (!pendingConnection) {
      setPendingConnection(id);
      return;
    }
    if (pendingConnection === id) {
      setPendingConnection(null);
      return;
    }
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === pendingConnection) return { ...c, connections: Array.from(new Set([...(c.connections || []), id])) };
        if (c.id === id) return { ...c, connections: Array.from(new Set([...(c.connections || []), pendingConnection])) };
        return c;
      })
    );
    setPendingConnection(null);
  };

  const clearWires = () => {
    setComponents((prev) => prev.map((c) => ({ ...c, connections: [] })));
  };

  const runSimulation = () => {
    const result = engine.simulateCircuit(components);
    setCircuitResult(result);

    // Reflect the simulated result onto any meters wired into the circuit.
    // NOTE: PhysicsEngine.simulateCircuit only returns an aggregate
    // currentFlow/powerDissipated for the whole board (its source wasn't
    // available to build this against), so this treats it as a single-loop
    // series circuit: every ammeter reads the loop current, every voltmeter
    // reads the total source voltage. If PhysicsEngine exposes per-branch or
    // per-node results, wire those in here instead for parallel circuits.
    const totalVoltage = components.filter((c) => c.type === 'battery').reduce((sum, c) => sum + (c.properties.voltage || 0), 0);
    setComponents((prev) =>
      prev.map((c) => {
        if (c.type === 'ammeter') return { ...c, properties: { ...c.properties, current: result.currentFlow } };
        if (c.type === 'voltmeter') return { ...c, properties: { ...c.properties, voltage: totalVoltage } };
        return c;
      })
    );
  };

  const nextStep = () => {
    if (currentStep < experiment.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setCircuitResult(null);
    }
  };

  const anySwitchOpen = components.some((c) => c.type === 'switch' && !c.isActive);
  const hasBattery = components.some((c) => c.type === 'battery');

  const submitReading = (measurementType: string, value: string) => {
    setReadings((prev) => ({ ...prev, [measurementType]: value }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-[calc(100vh-200px)] bg-grey-light">
        <div className="w-14 bg-white border-r flex flex-col items-center py-3 space-y-2">
          <button
            onClick={() => setActiveTab('circuit')}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs ${activeTab === 'circuit' ? 'bg-blue-100 text-blue-600' : 'text-grey-medium hover:bg-grey-light'}`}
            title="Circuit"
          >
            ⚡<span className="text-[9px]">Circuit</span>
          </button>
          <button
            onClick={() => setActiveTab('optics')}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs ${activeTab === 'optics' ? 'bg-blue-100 text-blue-600' : 'text-grey-medium hover:bg-grey-light'}`}
            title="Optics"
          >
            🔍<span className="text-[9px]">Optics</span>
          </button>
          <button
            onClick={() => setActiveTab('mechanics')}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs ${activeTab === 'mechanics' ? 'bg-blue-100 text-blue-600' : 'text-grey-medium hover:bg-grey-light'}`}
            title="Mechanics"
          >
            🌀<span className="text-[9px]">Mech</span>
          </button>
          <button
            onClick={() => setActiveTab('magnetism')}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs ${activeTab === 'magnetism' ? 'bg-blue-100 text-blue-600' : 'text-grey-medium hover:bg-grey-light'}`}
            title="Magnetism"
          >
            🧲<span className="text-[9px]">Magnet</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'circuit' && (
            <CircuitStation
              experiment={experiment}
              components={components}
              selectedComponent={selectedComponent}
              connectMode={connectMode}
              pendingConnection={pendingConnection}
              circuitResult={circuitResult}
              currentStep={currentStep}
              readings={readings}
              anySwitchOpen={anySwitchOpen}
              hasBattery={hasBattery}
              onAddComponent={addComponent}
              onMoveComponent={moveComponent}
              onRemoveComponent={removeComponent}
              onSelectComponent={handleComponentClick}
              onToggleSwitch={toggleSwitch}
              onUpdateProperties={updateProperties}
              onToggleConnectMode={() => {
                setConnectMode((m) => !m);
                setPendingConnection(null);
              }}
              onClearWires={clearWires}
              onRunSimulation={runSimulation}
              onNextStep={nextStep}
              onSubmitReading={submitReading}
              engine={engine}
            />
          )}
          {activeTab === 'optics' && <OpticsStation engine={engine} />}
          {activeTab === 'mechanics' && <MechanicsStation engine={engine} />}
          {activeTab === 'magnetism' && <MagnetismStation engine={engine} />}
        </div>
      </div>
    </DndProvider>
  );
};

// ------------------------------------------------------------------
// Circuit Station
// ------------------------------------------------------------------

const CircuitStation: React.FC<{
  experiment: PhysicsExperiment;
  components: PhysicsComponent[];
  selectedComponent: string | null;
  connectMode: boolean;
  pendingConnection: string | null;
  circuitResult: any;
  currentStep: number;
  readings: Record<string, string>;
  anySwitchOpen: boolean;
  hasBattery: boolean;
  onAddComponent: (type: PhysicsEquipment, x: number, y: number) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onRemoveComponent: (id: string) => void;
  onSelectComponent: (id: string) => void;
  onToggleSwitch: (id: string) => void;
  onUpdateProperties: (id: string, patch: Partial<PhysicsComponent['properties']>) => void;
  onToggleConnectMode: () => void;
  onClearWires: () => void;
  onRunSimulation: () => void;
  onNextStep: () => void;
  onSubmitReading: (type: string, value: string) => void;
  engine: PhysicsEngine;
}> = ({
  experiment,
  components,
  selectedComponent,
  connectMode,
  pendingConnection,
  circuitResult,
  currentStep,
  readings,
  anySwitchOpen,
  hasBattery,
  onAddComponent,
  onMoveComponent,
  onRemoveComponent,
  onSelectComponent,
  onToggleSwitch,
  onUpdateProperties,
  onToggleConnectMode,
  onClearWires,
  onRunSimulation,
  onNextStep,
  onSubmitReading,
  engine,
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Must live in a DndProvider descendant — see the fix applied to the
  // chemistry lab's workbench for why this can't be called in a component
  // that itself renders <DndProvider>.
  const [, dropRef] = useDrop(
    () => ({
      accept: ItemTypes.PHYSICS_COMPONENT,
      drop: (item: { type: PhysicsEquipment }, monitor) => {
        const offset = monitor.getClientOffset();
        const rect = boardRef.current?.getBoundingClientRect();
        if (!offset || !rect) return;
        onAddComponent(item.type, offset.x - rect.left - 36, offset.y - rect.top - 36);
      },
    }),
    [onAddComponent]
  );

  const selected = components.find((c) => c.id === selectedComponent) || null;
  const currentExperimentStep = experiment.steps[currentStep];

  const wires = useMemo(() => {
    const seen = new Set<string>();
    const lines: { a: PhysicsComponent; b: PhysicsComponent }[] = [];
    components.forEach((c) => {
      (c.connections || []).forEach((otherId) => {
        const key = componentKey(c.id, otherId);
        if (seen.has(key)) return;
        seen.add(key);
        const other = components.find((o) => o.id === otherId);
        if (other) lines.push({ a: c, b: other });
      });
    });
    return lines;
  }, [components]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="w-full lg:w-56 bg-white rounded-xl shadow-sm border p-4 overflow-y-auto">
        <h3 className="font-semibold text-navy text-sm mb-3">Components</h3>
        <div className="space-y-1.5">
          {COMPONENT_LIBRARY.map((item) => (
            <CircuitComponentSource key={item.type} type={item.type} icon={item.icon} label={item.label} />
          ))}
        </div>

        <div className="mt-4 space-y-1.5">
          <Button size="sm" variant={connectMode ? 'primary' : 'outline'} fullWidth onClick={onToggleConnectMode}>
            {connectMode ? '🔌 Click two parts to wire' : '🔌 Wire components'}
          </Button>
          <Button size="sm" variant="outline" fullWidth onClick={onClearWires}>
            Clear wires
          </Button>
        </div>

        {selected && (
          <Card className="mt-4">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold capitalize">{selected.type.replace(/_/g, ' ')}</p>
                <button className="text-[10px] text-red-500" onClick={() => onRemoveComponent(selected.id)}>
                  Remove
                </button>
              </div>

              {selected.type === 'battery' && (
                <PropertySlider label="Voltage" unit="V" min={1.5} max={12} step={0.5} value={selected.properties.voltage ?? 6} onChange={(v) => onUpdateProperties(selected.id, { voltage: v })} />
              )}
              {(selected.type === 'resistor' || selected.type === 'rheostat' || selected.type === 'wire') && (
                <PropertySlider label="Resistance" unit="Ω" min={0.1} max={1000} step={0.1} value={selected.properties.resistance ?? 10} onChange={(v) => onUpdateProperties(selected.id, { resistance: v })} />
              )}
              {selected.type === 'bulb' && (
                <PropertySlider label="Rated resistance" unit="Ω" min={1} max={20} step={0.5} value={selected.properties.resistance ?? 3} onChange={(v) => onUpdateProperties(selected.id, { resistance: v })} />
              )}
              {selected.type === 'switch' && (
                <Button size="sm" variant="outline" fullWidth onClick={() => onToggleSwitch(selected.id)}>
                  {selected.isActive ? 'Closed — click to open' : 'Open — click to close'}
                </Button>
              )}
              {selected.type === 'ammeter' && <p className="text-xs text-gray-500">Reads: {selected.properties.current !== undefined ? `${selected.properties.current.toFixed(2)} A` : '— run simulation'}</p>}
              {selected.type === 'voltmeter' && <p className="text-xs text-gray-500">Reads: {selected.properties.voltage !== undefined ? `${selected.properties.voltage.toFixed(2)} V` : '— run simulation'}</p>}
            </CardContent>
          </Card>
        )}
      </div>

      <div
        ref={(node) => {
          boardRef.current = node;
          dropRef(node);
        }}
        className="flex-1 bg-white rounded-xl shadow-sm border-2 border-dashed border-grey-light min-h-[400px] relative overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center text-grey-medium pointer-events-none">{components.length === 0 && 'Drag components here'}</div>

        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
          {wires.map(({ a, b }, i) => (
            <line key={i} x1={a.position.x + 36} y1={a.position.y + 36} x2={b.position.x + 36} y2={b.position.y + 36} stroke="#94a3b8" strokeWidth={3} />
          ))}
          {connectMode && pendingConnection && (() => {
            const p = components.find((c) => c.id === pendingConnection);
            return p ? <circle cx={p.position.x + 36} cy={p.position.y + 36} r={40} fill="none" stroke="#2563eb" strokeDasharray="4 3" /> : null;
          })()}
        </svg>

        {components.map((comp) => (
          <CircuitComponentNode
            key={comp.id}
            component={comp}
            isSelected={selectedComponent === comp.id}
            isPending={pendingConnection === comp.id}
            connectMode={connectMode}
            circuitResult={circuitResult}
            onMove={onMoveComponent}
            onClick={() => onSelectComponent(comp.id)}
          />
        ))}
      </div>

      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border p-4 overflow-y-auto space-y-3">
        <h3 className="font-semibold text-navy text-sm">{experiment.title}</h3>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <p className="text-xs text-grey-dark">
              Step {currentStep + 1} of {experiment.steps.length}: {currentExperimentStep?.instruction}
            </p>
          </CardContent>
        </Card>

        {hasBattery && anySwitchOpen && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">⚠ A switch in the circuit is open — current won't flow until it's closed.</p>}

        <div className="space-y-2">
          <Button variant="primary" fullWidth size="sm" onClick={onRunSimulation} disabled={components.length === 0}>
            ⚡ Run Simulation
          </Button>
          {currentStep < experiment.steps.length - 1 && (
            <Button variant="outline" fullWidth size="sm" onClick={onNextStep}>
              Next Step →
            </Button>
          )}
        </div>

        {circuitResult && (
          <div className="p-3 bg-green-50 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-green-800">Circuit Analysis</p>
            <p>Current: {circuitResult.currentFlow?.toFixed(2) ?? 0} A</p>
            <p>Power: {circuitResult.powerDissipated?.toFixed(2) ?? 0} W</p>
            {circuitResult.warnings?.map((w: string, i: number) => (
              <p key={i} className="text-yellow-700">
                ⚠ {w}
              </p>
            ))}
          </div>
        )}

        {experiment.requiredMeasurements?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-navy text-sm">Record your readings</h4>
            {experiment.requiredMeasurements
              .filter((m) => m.type === 'voltage' || m.type === 'current' || m.type === 'resistance')
              .map((m) => {
                const value = readings[m.type];
                const parsed = value !== undefined ? parseFloat(value) : NaN;
                const inRange = !isNaN(parsed) && parsed >= m.expectedRange.min && parsed <= m.expectedRange.max;
                return (
                  <div key={m.type} className="flex items-center gap-2">
                    <Input placeholder={`${m.type} (${m.unit})`} value={value ?? ''} onChange={(e: any) => onSubmitReading(m.type, e.target.value)} className="flex-1 text-xs" />
                    {value && <Badge className={inRange ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{inRange ? '✓' : '✗'}</Badge>}
                  </div>
                );
              })}
          </div>
        )}

        {circuitResult && <RuleVerificationPanel components={components} circuitResult={circuitResult} engine={engine} />}
      </div>
    </div>
  );
};

const RuleVerificationPanel: React.FC<{ components: PhysicsComponent[]; circuitResult: any; engine: PhysicsEngine }> = ({ components, circuitResult, engine }) => {
  const [ohmGuess, setOhmGuess] = useState('');
  const [ohmResult, setOhmResult] = useState<string | null>(null);
  const [totalRGuess, setTotalRGuess] = useState('');
  const [totalRResult, setTotalRResult] = useState<string | null>(null);
  const [layout, setLayout] = useState<'series' | 'parallel'>('series');

  const resistorCount = components.filter((c) => c.type === 'resistor').length;
  const hasBattery = components.some((c) => c.type === 'battery');
  const ohmApplicable = hasBattery && resistorCount >= 1;

  const checkOhm = () => {
    const rule = engine.getRule('ohms_law');
    if (!rule) return;
    const guess = parseFloat(ohmGuess);
    const ok = rule.validate(components, { current: guess });
    const expected = rule.expectedResults(components);
    setOhmResult(ok ? `✅ Correct — I ≈ ${expected.current?.toFixed(2)}A (V/R).` : `❌ Not quite. Using V=IR: I ≈ ${expected.current?.toFixed(2)}A.`);
  };

  const checkTotalResistance = () => {
    const rule = engine.getRule(layout === 'series' ? 'series_resistance' : 'parallel_resistance');
    if (!rule) return;
    const guess = parseFloat(totalRGuess);
    const ok = rule.validate(components, { totalResistance: guess });
    const expected = rule.expectedResults(components);
    setTotalRResult(ok ? `✅ Correct — R_total ≈ ${expected.totalResistance?.toFixed(2)}Ω.` : `❌ Not quite. R_total ≈ ${expected.totalResistance?.toFixed(2)}Ω for that formula.`);
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-3 text-xs">
        <p className="font-semibold text-navy text-sm">Verify the physics</p>

        {ohmApplicable && (
          <div className="space-y-1">
            <p className="text-gray-600">Ohm's Law (V = IR): what current do you predict?</p>
            <div className="flex gap-2">
              <Input placeholder="Predicted current (A)" value={ohmGuess} onChange={(e: any) => setOhmGuess(e.target.value)} className="flex-1" />
              <Button size="sm" onClick={checkOhm}>
                Check
              </Button>
            </div>
            {ohmResult && <p>{ohmResult}</p>}
          </div>
        )}

        {resistorCount >= 2 && (
          <div className="space-y-1">
            <p className="text-gray-600">These resistors are wired in:</p>
            <div className="flex gap-2">
              <Button size="sm" variant={layout === 'series' ? 'primary' : 'outline'} onClick={() => setLayout('series')}>
                Series
              </Button>
              <Button size="sm" variant={layout === 'parallel' ? 'primary' : 'outline'} onClick={() => setLayout('parallel')}>
                Parallel
              </Button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Predicted total resistance (Ω)" value={totalRGuess} onChange={(e: any) => setTotalRGuess(e.target.value)} className="flex-1" />
              <Button size="sm" onClick={checkTotalResistance}>
                Check
              </Button>
            </div>
            {totalRResult && <p>{totalRResult}</p>}
          </div>
        )}

        {!ohmApplicable && resistorCount < 2 && <p className="text-gray-400">Add a battery and at least one resistor to unlock verification questions.</p>}
      </CardContent>
    </Card>
  );
};

const PropertySlider: React.FC<{ label: string; unit: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }> = ({ label, unit, min, max, step, value, onChange }) => (
  <div>
    <label className="block text-[11px] text-gray-500 mb-0.5">
      {label}: {value}
      {unit}
    </label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
  </div>
);

const CircuitComponentSource: React.FC<{ type: PhysicsEquipment; icon: string; label: string }> = ({ type, icon, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({ type: ItemTypes.PHYSICS_COMPONENT, item: { type }, collect: (m) => ({ isDragging: m.isDragging() }) }));
  return (
    <div ref={drag as any} className={`p-1.5 bg-white border rounded cursor-move hover:shadow text-xs ${isDragging ? 'opacity-50' : ''}`}>
      {icon} {label}
    </div>
  );
};

const CircuitComponentNode: React.FC<{
  component: PhysicsComponent;
  isSelected: boolean;
  isPending: boolean;
  connectMode: boolean;
  circuitResult: any;
  onMove: (id: string, x: number, y: number) => void;
  onClick: () => void;
}> = ({ component, isSelected, isPending, connectMode, circuitResult, onMove, onClick }) => {
  const dragOrigin = useRef<{ px: number; py: number; ix: number; iy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    dragOrigin.current = { px: e.clientX, py: e.clientY, ix: component.position.x, iy: component.position.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragOrigin.current || connectMode) return;
    const dx = e.clientX - dragOrigin.current.px;
    const dy = e.clientY - dragOrigin.current.py;
    onMove(component.id, dragOrigin.current.ix + dx, dragOrigin.current.iy + dy);
  };
  const onPointerUp = () => {
    dragOrigin.current = null;
  };

  const bulbGlow = component.type === 'bulb' && circuitResult?.currentFlow ? Math.min(1, circuitResult.currentFlow / 2) : 0;
  const switchOpen = component.type === 'switch' && !component.isActive;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={onClick}
      className={`absolute p-2 bg-white border-2 rounded-lg text-center text-[11px] select-none ${connectMode ? 'cursor-pointer' : 'cursor-move'} ${
        isSelected ? 'border-navy shadow-md' : isPending ? 'border-blue-500' : 'border-grey-light'
      }`}
      style={{ left: component.position.x, top: component.position.y, width: 72, touchAction: 'none' }}
    >
      <span
        className="text-2xl inline-block"
        style={
          bulbGlow > 0
            ? { filter: `drop-shadow(0 0 ${6 + bulbGlow * 10}px rgba(250,204,21,${0.5 + bulbGlow * 0.5}))`, opacity: 0.6 + bulbGlow * 0.4 }
            : undefined
        }
      >
        {switchOpen ? '🔓' : ICONS[component.type] ?? '❔'}
      </span>
      <div className="capitalize truncate">{component.type.replace(/_/g, ' ')}</div>
      {component.type === 'ammeter' && component.properties.current !== undefined && <div className="text-[10px] text-navy">{component.properties.current.toFixed(2)}A</div>}
      {component.type === 'voltmeter' && component.properties.voltage !== undefined && <div className="text-[10px] text-navy">{component.properties.voltage.toFixed(2)}V</div>}
    </div>
  );
};

// ------------------------------------------------------------------
// Optics Station — now driven by PhysicsEngine.simulateOptics, including
// its rayDiagram output, instead of duplicating the lens math client-side.
// ------------------------------------------------------------------

const OpticsStation: React.FC<{ engine: PhysicsEngine }> = ({ engine }) => {
  const [lensType, setLensType] = useState<'lens_convex' | 'lens_concave'>('lens_convex');
  const [focalLength, setFocalLength] = useState(10);
  const [objectDistance, setObjectDistance] = useState(20);
  const [objectHeight, setObjectHeight] = useState(4);

  const result = useMemo(() => engine.simulateOptics(lensType, focalLength, objectDistance, objectHeight), [engine, lensType, focalLength, objectDistance, objectHeight]);

  // Simple SVG viewport: optical axis along y=150, lens at x=300, scale px-per-cm.
  const scale = 6;
  const axisY = 150;
  const lensX = 300;
  const toSvgX = (x: number) => lensX + x * scale;
  const toSvgY = (y: number) => axisY - y * scale;
  const isVirtual = result.imageType === 'virtual';
  const imageArrowY = result.imageOrientation === 'inverted' ? -result.imageHeight : result.imageHeight;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-3 space-y-3">
            <p className="text-sm font-medium">Lens setup</p>
            <div className="flex gap-2">
              <Button size="sm" variant={lensType === 'lens_convex' ? 'primary' : 'outline'} onClick={() => setLensType('lens_convex')}>
                Convex
              </Button>
              <Button size="sm" variant={lensType === 'lens_concave' ? 'primary' : 'outline'} onClick={() => setLensType('lens_concave')}>
                Concave
              </Button>
            </div>
            <PropertySlider label="Focal length" unit=" cm" min={5} max={30} step={1} value={focalLength} onChange={setFocalLength} />
            <PropertySlider label="Object distance" unit=" cm" min={2} max={60} step={1} value={objectDistance} onChange={setObjectDistance} />
            <PropertySlider label="Object height" unit=" cm" min={1} max={10} step={0.5} value={objectHeight} onChange={setObjectHeight} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-sm space-y-1">
            <p>
              Image distance (v): <span className="font-semibold">{Math.abs(result.imageDistance).toFixed(1)} cm</span> ({result.imageType}, {result.imageType === 'real' ? 'opposite side' : 'same side'})
            </p>
            <p>
              Magnification: <span className="font-semibold">{result.magnification.toFixed(2)}×</span> ({result.imageOrientation})
            </p>
            <p>
              Image height: <span className="font-semibold">{result.imageHeight.toFixed(1)} cm</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 bg-gray-50 rounded-xl border p-2">
        <svg viewBox="0 0 600 300" className="w-full h-full">
          <line x1={0} y1={axisY} x2={600} y2={axisY} stroke="#cbd5e1" strokeWidth={1} />

          {lensType === 'lens_convex' ? (
            <>
              <line x1={lensX} y1={30} x2={lensX} y2={270} stroke="#2563eb" strokeWidth={3} />
              <polygon points={`${lensX - 8},30 ${lensX + 8},30 ${lensX},50`} fill="#2563eb" />
              <polygon points={`${lensX - 8},270 ${lensX + 8},270 ${lensX},250`} fill="#2563eb" />
            </>
          ) : (
            <>
              <line x1={lensX} y1={30} x2={lensX} y2={270} stroke="#2563eb" strokeWidth={3} />
              <polygon points={`${lensX - 8},50 ${lensX + 8},50 ${lensX},30`} fill="#2563eb" />
              <polygon points={`${lensX - 8},250 ${lensX + 8},250 ${lensX},270`} fill="#2563eb" />
            </>
          )}

          {[lensX - focalLength * scale, lensX + focalLength * scale].map((fx, i) => (
            <circle key={i} cx={fx} cy={axisY} r={3} fill="#f97316" />
          ))}

          {/* object arrow */}
          <line x1={toSvgX(-objectDistance)} y1={axisY} x2={toSvgX(-objectDistance)} y2={toSvgY(objectHeight)} stroke="#16a34a" strokeWidth={3} markerEnd="url(#arrow-green)" />
          {/* image arrow, positioned from the engine's own imageDistance/height/orientation */}
          <line
            x1={toSvgX(result.imageDistance)}
            y1={axisY}
            x2={toSvgX(result.imageDistance)}
            y2={toSvgY(imageArrowY)}
            stroke="#dc2626"
            strokeWidth={3}
            strokeDasharray={isVirtual ? '5 4' : undefined}
            markerEnd="url(#arrow-red)"
          />
          {/* principal rays straight from the engine's rayDiagram */}
          {result.rayDiagram.rays.map((ray, i) => (
            <line key={i} x1={toSvgX(ray.start.x)} y1={toSvgY(ray.start.y)} x2={toSvgX(ray.end.x)} y2={toSvgY(ray.end.y)} stroke="#94a3b8" strokeWidth={1} strokeDasharray={isVirtual ? '4 3' : undefined} />
          ))}

          <defs>
            <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#16a34a" />
            </marker>
            <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#dc2626" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Mechanics Station — Hooke's Law and the simple pendulum, both of which
// PhysicsEngine already had rules for (hookes_law, simple_pendulum) that
// nothing in the app ever called.
// ------------------------------------------------------------------

const MechanicsStation: React.FC<{ engine: PhysicsEngine }> = ({ engine }) => {
  const [springConstant, setSpringConstant] = useState(20); // N/m
  const [mass, setMass] = useState(200); // grams
  const [extensionGuess, setExtensionGuess] = useState('');
  const [hookeResult, setHookeResult] = useState<string | null>(null);

  const force = (mass / 1000) * 9.81; // N
  const extensionM = force / springConstant;
  const extensionCm = extensionM * 100;

  const checkHooke = () => {
    const rule = engine.getRule('hookes_law');
    if (!rule) return;
    const springComponent: PhysicsComponent = { id: 'spring-1', type: 'spring', position: { x: 0, y: 0 }, properties: { springConstant }, isActive: true };
    const guessM = parseFloat(extensionGuess) / 100;
    const ok = rule.validate([springComponent], { force, extension: guessM });
    setHookeResult(ok ? `✅ Correct — extension ≈ ${extensionCm.toFixed(1)} cm.` : `❌ Not quite. F = kx gives extension ≈ ${extensionCm.toFixed(1)} cm.`);
  };

  const [length, setLength] = useState(50); // cm
  const [periodGuess, setPeriodGuess] = useState('');
  const [pendulumResult, setPendulumResult] = useState<string | null>(null);
  const period = 2 * Math.PI * Math.sqrt(length / 100 / 9.81);

  const checkPendulum = () => {
    const rule = engine.getRule('simple_pendulum');
    if (!rule) return;
    const guess = parseFloat(periodGuess);
    const ok = rule.validate([], { pendulumLength: length / 100, period: guess });
    setPendulumResult(ok ? `✅ Correct — T ≈ ${period.toFixed(2)}s.` : `❌ Not quite. T = 2π√(l/g) gives T ≈ ${period.toFixed(2)}s.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-navy">🌀 Hooke's Law — Spring Extension</p>
          <PropertySlider label="Spring constant (k)" unit=" N/m" min={5} max={100} step={1} value={springConstant} onChange={setSpringConstant} />
          <PropertySlider label="Hanging mass" unit=" g" min={50} max={1000} step={10} value={mass} onChange={setMass} />
          <div className="relative bg-gray-50 border rounded-lg h-40 flex flex-col items-center justify-start pt-2 overflow-hidden">
            <div className="w-1.5 bg-gray-400" style={{ height: Math.min(140, 30 + extensionCm * 4) }} />
            <div className="w-8 h-8 bg-navy rounded-sm" title={`${mass}g mass`} />
          </div>
          <p className="text-xs text-gray-600">Force applied: {force.toFixed(2)} N</p>
          <div className="flex gap-2">
            <Input placeholder="Predicted extension (cm)" value={extensionGuess} onChange={(e: any) => setExtensionGuess(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={checkHooke}>
              Check
            </Button>
          </div>
          {hookeResult && <p className="text-xs">{hookeResult}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-navy">⏱️ Simple Pendulum — Period</p>
          <PropertySlider label="String length" unit=" cm" min={10} max={150} step={5} value={length} onChange={setLength} />
          <div className="relative bg-gray-50 border rounded-lg h-40 flex flex-col items-center justify-start pt-2 overflow-hidden">
            <div className="w-0.5 bg-gray-400" style={{ height: Math.min(130, length) }} />
            <div className="w-5 h-5 rounded-full bg-navy" />
          </div>
          <p className="text-xs text-gray-600">g = 9.81 m/s² (assumed)</p>
          <div className="flex gap-2">
            <Input placeholder="Predicted period (s)" value={periodGuess} onChange={(e: any) => setPeriodGuess(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={checkPendulum}>
              Check
            </Button>
          </div>
          {pendulumResult && <p className="text-xs">{pendulumResult}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

// ------------------------------------------------------------------
// Magnetism Station — exercises the engine's magnetic_field rule, which
// previously had no UI anywhere in the lab.
// ------------------------------------------------------------------

const MagnetismStation: React.FC<{ engine: PhysicsEngine }> = ({ engine }) => {
  const [choice, setChoice] = useState<'north_to_south' | 'south_to_north' | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const check = (dir: 'north_to_south' | 'south_to_north') => {
    setChoice(dir);
    const rule = engine.getRule('magnetic_field');
    if (!rule) return;
    const magnet: PhysicsComponent = { id: 'magnet-1', type: 'magnet', position: { x: 0, y: 0 }, properties: {}, isActive: true };
    const ok = rule.validate([magnet], { fieldDirection: dir });
    setResult(ok ? '✅ Correct! Field lines run from the North pole to the South pole outside the magnet.' : '❌ Not quite — field lines actually run from North to South outside the magnet.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
          <p className="font-semibold text-navy">🧲 Bar Magnet Field</p>
          <p className="text-gray-600">A compass near a bar magnet aligns with the local field. Which way do field lines point outside the magnet?</p>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant={choice === 'north_to_south' ? 'primary' : 'outline'} onClick={() => check('north_to_south')}>
              North → South
            </Button>
            <Button size="sm" variant={choice === 'south_to_north' ? 'primary' : 'outline'} onClick={() => check('south_to_north')}>
              South → North
            </Button>
          </div>
          {result && <p>{result}</p>}
        </CardContent>
      </Card>

      <div className="lg:col-span-2 bg-gray-50 rounded-xl border p-4 flex items-center justify-center">
        <svg viewBox="0 0 400 200" className="w-full max-w-md">
          <rect x={150} y={80} width={50} height={40} fill="#dc2626" />
          <rect x={200} y={80} width={50} height={40} fill="#334155" />
          <text x={168} y={105} fill="white" fontSize={14} fontWeight="bold">
            N
          </text>
          <text x={218} y={105} fill="white" fontSize={14} fontWeight="bold">
            S
          </text>
          {[0, 1, 2, 3].map((i) => {
            const r = 40 + i * 20;
            return <path key={i} d={`M 175 80 C ${175 - r} ${80 - r}, ${225 + r} ${80 - r}, 225 80`} fill="none" stroke="#2563eb" strokeWidth={1.5} markerEnd="url(#arrow-blue)" />;
          })}
          <defs>
            <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default PhysicsLab;