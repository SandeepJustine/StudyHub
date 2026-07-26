// components/lab/PhysicsLab.tsx
// Physics Virtual Lab Component

import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PhysicsEngine } from '../../services/lab/PhysicsEngine';
import { PhysicsComponent, PhysicsExperiment, PhysicsEquipment } from '../../types/lab';

const ItemTypes = {
  PHYSICS_COMPONENT: 'physics_component',
  WIRE: 'wire'
};

export const PhysicsLab: React.FC<{ experiment: PhysicsExperiment }> = ({ experiment }) => {
  const [engine] = useState(() => new PhysicsEngine());
  const [components, setComponents] = useState<PhysicsComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [circuitResult, setCircuitResult] = useState<any>(null);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'circuit' | 'optics' | 'mechanics'>('circuit');

  const addComponent = (type: PhysicsEquipment, x: number, y: number) => {
    const newComponent: PhysicsComponent = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x, y },
      properties: getDefaultProperties(type),
      connections: [],
      isActive: false
    };
    setComponents(prev => [...prev, newComponent]);
  };

  const getDefaultProperties = (type: PhysicsEquipment): any => {
    const defaults: Record<string, any> = {
      'battery': { voltage: 6 },
      'resistor': { resistance: 10 },
      'bulb': { resistance: 3 },
      'lens_convex': { focalLength: 10 },
      'lens_concave': { focalLength: -10 },
      'spring': { springConstant: 100 },
      'weight': { mass: 100 },
      'wire': { resistance: 0.1 }
    };
    return defaults[type] || {};
  };

  const runCircuitSimulation = () => {
    const result = engine.simulateCircuit(components);
    setCircuitResult(result);
  };

  const measureValue = (componentId: string, measurementType: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    // Simulate measurement
    const value = measurementType === 'voltage' 
      ? component.properties.voltage 
      : measurementType === 'current'
      ? circuitResult?.currentFlow
      : component.properties.resistance;

    setMeasurements(prev => ({ ...prev, [`${componentId}_${measurementType}`]: value || 0 }));
  };

  const connectComponents = (fromId: string, toId: string) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id === fromId) {
        return {
          ...comp,
          connections: [...(comp.connections || []), toId]
        };
      }
      if (comp.id === toId) {
        return {
          ...comp,
          connections: [...(comp.connections || []), fromId]
        };
      }
      return comp;
    }));
  };

  // Circuit Builder Tab
  const renderCircuitBuilder = () => (
    <div className="flex h-full">
      {/* Component Palette */}
      <div className="w-64 bg-white border-r p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Circuit Components</h3>
        <div className="space-y-2">
          {[
            { type: 'battery', icon: '🔋', label: 'Battery' },
            { type: 'wire', icon: '➖', label: 'Wire' },
            { type: 'resistor', icon: '⚡', label: 'Resistor' },
            { type: 'bulb', icon: '💡', label: 'Bulb' },
            { type: 'switch', icon: '🔌', label: 'Switch' },
            { type: 'ammeter', icon: '📊', label: 'Ammeter' },
            { type: 'voltmeter', icon: '📈', label: 'Voltmeter' }
          ].map(item => (
            <CircuitComponent
              key={item.type}
              type={item.type as PhysicsEquipment}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>
      </div>

      {/* Work Area */}
      <div 
        className="flex-1 bg-gray-50 relative"
        onDrop={(e) => {
          e.preventDefault();
          const type = e.dataTransfer.getData('componentType') as PhysicsEquipment;
          const rect = e.currentTarget.getBoundingClientRect();
          addComponent(type, e.clientX - rect.left, e.clientY - rect.top);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Grid Background */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Components on Workbench */}
        {components.map(comp => (
          <WorkbenchComponent
            key={comp.id}
            component={comp}
            isSelected={selectedComponent === comp.id}
            onSelect={() => setSelectedComponent(comp.id)}
            onMove={(x, y) => {
              setComponents(prev => prev.map(c =>
                c.id === comp.id ? { ...c, position: { x, y } } : c
              ));
            }}
            onMeasure={(type) => measureValue(comp.id, type)}
            measurements={measurements}
          />
        ))}

        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none">
          {components.map(comp =>
            comp.connections?.map(targetId => {
              const target = components.find(c => c.id === targetId);
              if (!target) return null;
              return (
                <line
                  key={`${comp.id}-${targetId}`}
                  x1={comp.position.x + 40}
                  y1={comp.position.y + 40}
                  x2={target.position.x + 40}
                  y2={target.position.y + 40}
                  stroke="red"
                  strokeWidth="2"
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-white border-l p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Circuit Controls</h3>
        
        <button
          onClick={runCircuitSimulation}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg mb-4 hover:bg-green-700"
        >
          ⚡ Run Simulation
        </button>

        {circuitResult && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Circuit Analysis</h4>
              <div className="space-y-2 text-sm">
                <div>Current: {circuitResult.currentFlow.toFixed(2)} A</div>
                <div>Power: {circuitResult.powerDissipated.toFixed(2)} W</div>
              </div>
            </div>

            {circuitResult.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2">⚠️ Warnings</h4>
                {circuitResult.warnings.map((warning: string, idx: number) => (
                  <p key={idx} className="text-sm text-yellow-800">{warning}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Component Properties */}
        {selectedComponent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Component Properties</h4>
            <ComponentProperties
              component={components.find(c => c.id === selectedComponent)!}
              onUpdate={(props) => {
                setComponents(prev => prev.map(c =>
                  c.id === selectedComponent ? { ...c, properties: { ...c.properties, ...props } } : c
                ));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Optics Tab
  const renderOptics = () => {
    const [lensType, setLensType] = useState<'lens_convex' | 'lens_concave'>('lens_convex');
    const [focalLength, setFocalLength] = useState(10);
    const [objectDistance, setObjectDistance] = useState(25);
    const [objectHeight, setObjectHeight] = useState(5);
    const [result, setResult] = useState<any>(null);

    const runOpticsSimulation = () => {
      const simResult = engine.simulateOptics(lensType, focalLength, objectDistance, objectHeight);
      setResult(simResult);
    };

    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Optics Simulation</h2>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Lens Type</label>
              <select
                value={lensType}
                onChange={(e) => setLensType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="lens_convex">Convex Lens (Converging)</option>
                <option value="lens_concave">Concave Lens (Diverging)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Focal Length: {focalLength} cm
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={focalLength}
                onChange={(e) => setFocalLength(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Object Distance: {objectDistance} cm
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={objectDistance}
                onChange={(e) => setObjectDistance(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Object Height: {objectHeight} cm
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={objectHeight}
                onChange={(e) => setObjectHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={runOpticsSimulation}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔬 Simulate Image Formation
            </button>
          </div>

          {/* Visualization */}
          <div className="bg-white rounded-lg shadow p-6">
            {result ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Results</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="text-sm text-gray-600">Image Distance</div>
                    <div className="text-2xl font-bold">{Math.abs(result.imageDistance).toFixed(1)} cm</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-sm text-gray-600">Magnification</div>
                    <div className="text-2xl font-bold">{result.magnification.toFixed(2)}x</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <div className="text-sm text-gray-600">Image Type</div>
                    <div className="text-xl font-bold capitalize">{result.imageType}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="text-sm text-gray-600">Orientation</div>
                    <div className="text-xl font-bold capitalize">{result.imageOrientation}</div>
                  </div>
                </div>

                {/* Ray Diagram */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Ray Diagram</h4>
                  <svg className="w-full h-64 bg-white border rounded">
                    {/* Lens */}
                    <line x1="200" y1="20" x2="200" y2="240" stroke="blue" strokeWidth="3"/>
                    
                    {/* Optical Axis */}
                    <line x1="0" y1="130" x2="400" y2="130" stroke="gray" strokeWidth="1" strokeDasharray="5,5"/>
                    
                    {/* Object */}
                    <line x1="100" y1="130" x2="100" y2={130 - objectHeight * 10} stroke="green" strokeWidth="2"/>
                    
                    {/* Rays */}
                    {result.rayDiagram.rays.map((ray: any, idx: number) => (
                      <line
                        key={idx}
                        x1={ray.start.x + 150}
                        y1={130 - ray.start.y * 10}
                        x2={ray.end.x + 150}
                        y2={130 - ray.end.y * 10}
                        stroke="red"
                        strokeWidth="1.5"
                        markerEnd="url(#arrowhead)"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Adjust parameters and click simulate to see results
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        {/* Tab Navigation */}
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 space-y-4">
          <TabButton icon="⚡" label="Circuit" active={activeTab === 'circuit'} onClick={() => setActiveTab('circuit')} />
          <TabButton icon="🔬" label="Optics" active={activeTab === 'optics'} onClick={() => setActiveTab('optics')} />
          <TabButton icon="⚙️" label="Mechanics" active={activeTab === 'mechanics'} onClick={() => setActiveTab('mechanics')} />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'circuit' && renderCircuitBuilder()}
          {activeTab === 'optics' && renderOptics()}
          {activeTab === 'mechanics' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Mechanics Experiments</h2>
              <p className="text-gray-600">Coming soon: Hooke's Law, Simple Pendulum, Forces on Inclined Plane</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

// Sub-components
const CircuitComponent: React.FC<{ type: PhysicsEquipment; icon: string; label: string }> = ({ type, icon, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PHYSICS_COMPONENT,
    item: { type },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border rounded-lg cursor-move hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('componentType', type);
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="ml-2 text-sm">{label}</span>
    </div>
  );
};

const WorkbenchComponent: React.FC<{
  component: PhysicsComponent;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onMeasure: (type: string) => void;
  measurements: Record<string, number>;
}> = ({ component, isSelected, onSelect, onMove, onMeasure, measurements }) => {
  return (
    <div
      className={`absolute p-4 bg-white border-2 rounded-lg cursor-move ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
      style={{ left: component.position.x, top: component.position.y }}
      onClick={onSelect}
      draggable
      onDragEnd={(e) => {
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          onMove(e.clientX - rect.left - 40, e.clientY - rect.top - 40);
        }
      }}
    >
      <div className="text-center">
        <span className="text-3xl">
          {component.type === 'battery' ? '🔋' :
           component.type === 'resistor' ? '⚡' :
           component.type === 'bulb' ? '💡' : '🔌'}
        </span>
        <div className="text-xs mt-1 capitalize">{component.type}</div>
        
        {isSelected && (
          <div className="mt-2 space-y-1">
            {component.type === 'resistor' && (
              <button
                onClick={() => onMeasure('resistance')}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                Measure R: {measurements[`${component.id}_resistance`] || '?'} Ω
              </button>
            )}
            {component.type === 'battery' && (
              <button
                onClick={() => onMeasure('voltage')}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                Measure V: {measurements[`${component.id}_voltage`] || '?'} V
              </button>
            )}
            <button
              onClick={() => onMeasure('current')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Measure I: {measurements[`${component.id}_current`]?.toFixed(2) || '?'} A
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ComponentProperties: React.FC<{
  component: PhysicsComponent;
  onUpdate: (props: any) => void;
}> = ({ component, onUpdate }) => {
  return (
    <div className="space-y-3">
      {component.type === 'resistor' && (
        <div>
          <label className="block text-xs">Resistance (Ω)</label>
          <input
            type="number"
            value={component.properties.resistance}
            onChange={(e) => onUpdate({ resistance: Number(e.target.value) })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      )}
      {component.type === 'battery' && (
        <div>
          <label className="block text-xs">Voltage (V)</label>
          <input
            type="number"
            value={component.properties.voltage}
            onChange={(e) => onUpdate({ voltage: Number(e.target.value) })}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
      active ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
    }`}
    title={label}
  >
    <span className="text-xl">{icon}</span>
  </button>
);