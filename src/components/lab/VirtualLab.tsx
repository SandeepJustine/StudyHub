// components/lab/VirtualLab.tsx
// Main Virtual Lab Component with Drag & Drop

import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChemistryEngine } from '../../services/lab/ChemistryEngine';
import { 
  LabEquipmentItem, Chemical, Experiment, ExperimentStep, 
  StudentObservation, LabEquipment 
} from '../../types/lab';

const ItemTypes = {
  EQUIPMENT: 'equipment',
  CHEMICAL: 'chemical',
};

export const VirtualLab: React.FC<{ experiment: Experiment }> = ({ experiment }) => {
  const [engine] = useState(() => new ChemistryEngine());
  const [workbench, setWorkbench] = useState<LabEquipmentItem[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [observations, setObservations] = useState<StudentObservation[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [isHeating, setIsHeating] = useState(false);
  const [reactionResult, setReactionResult] = useState<any>(null);

  // Available equipment from inventory
  const [inventory] = useState<LabEquipment[]>([
    'beaker', 'test_tube', 'flask', 'burette', 
    'pipette', 'measuring_cylinder', 'bunsen_burner',
    'tripod_stand', 'wire_gauze', 'funnel', 
    'filter_paper', 'evaporating_dish', 'thermometer'
  ]);

  const chemicals = engine.getAllChemicals();

  const moveEquipment = useCallback((id: string, x: number, y: number) => {
    setWorkbench(prev => prev.map(item => 
      item.id === id ? { ...item, position: { x, y } } : item
    ));
  }, []);

  const addChemical = (equipmentId: string, chemicalId: string, volume: number) => {
    setWorkbench(prev => prev.map(item => {
      if (item.id === equipmentId) {
        const existingContents = item.contents || [];
        return {
          ...item,
          contents: [...existingContents, { chemicalId, volume }]
        };
      }
      return item;
    }));
  };

  const processExperiment = () => {
    const currentExperimentStep = experiment.steps[currentStep];
    const equipmentWithChemicals = workbench.filter(e => e.contents?.length);
    
    // Collect all reactants
    const reactants = equipmentWithChemicals.flatMap(eq => 
      eq.contents?.map(content => ({
        chemicalId: content.chemicalId,
        volume: content.volume
      })) || []
    );

    const result = engine.processReaction(reactants, { 
      heating: isHeating,
      temperature: isHeating ? 100 : 25 
    });

    setReactionResult(result);
    
    if (result.success) {
      // Record observations
      const newObservations: StudentObservation[] = result.observations.map(obs => ({
        id: `${Date.now()}-${Math.random()}`,
        stepId: currentExperimentStep.id,
        type: obs.type,
        studentValue: '',
        expectedValue: obs.expectedValue,
        isCorrect: false,
        points: 0
      }));
      
      setObservations(prev => [...prev, ...newObservations]);
    }
  };

  const submitObservation = (observationId: string, value: string) => {
    setObservations(prev => prev.map(obs => {
      if (obs.id === observationId) {
        const validation = engine.validateObservation(
          reactionResult.reaction,
          { type: obs.type, value }
        );
        return {
          ...obs,
          studentValue: value,
          isCorrect: validation.isCorrect,
          points: validation.points
        };
      }
      return obs;
    }));
  };

  const nextStep = () => {
    if (currentStep < experiment.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setReactionResult(null);
      setIsHeating(false);
    }
  };

  const currentExperimentStep = experiment.steps[currentStep];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        {/* Equipment Panel */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Equipment</h3>
          <div className="space-y-2">
            {inventory.map(item => (
              <DraggableEquipment key={item} type={item} />
            ))}
          </div>

          <h3 className="font-semibold mt-6 mb-4">Chemicals</h3>
          <div className="space-y-2">
            {chemicals.map(chem => (
              <DraggableChemical key={chem.id} chemical={chem} />
            ))}
          </div>
        </div>

        {/* Lab Workbench */}
        <div className="flex-1 relative bg-gray-100 border-2 border-dashed border-gray-300 m-4 rounded-lg"
          onDrop={(e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.type === 'equipment') {
              const newEquipment: LabEquipmentItem = {
                id: `${Date.now()}-${Math.random()}`,
                type: data.equipment,
                position: { 
                  x: e.clientX - e.currentTarget.getBoundingClientRect().left - 50,
                  y: e.clientY - e.currentTarget.getBoundingClientRect().top - 50
                },
                contents: [],
                isHeating: false
              };
              setWorkbench(prev => [...prev, newEquipment]);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {workbench.map(item => (
            <DraggableWorkbenchItem 
              key={item.id}
              item={item}
              onMove={moveEquipment}
              isSelected={selectedEquipment === item.id}
              onSelect={() => setSelectedEquipment(item.id)}
              onDropChemical={(chemicalId) => {
                // Default volume of 20mL
                addChemical(item.id, chemicalId, 20);
              }}
            />
          ))}

          {/* Bunsen Burner Control */}
          {workbench.some(item => item.type === 'bunsen_burner') && (
            <div className="absolute bottom-4 right-4">
              <button
                onClick={() => setIsHeating(!isHeating)}
                className={`px-4 py-2 rounded-lg ${
                  isHeating ? 'bg-red-500 text-white' : 'bg-gray-200'
                }`}
              >
                {isHeating ? '🔥 Heating ON' : '🔥 Heat OFF'}
              </button>
            </div>
          )}
        </div>

        {/* Experiment Panel */}
        <div className="w-96 bg-white border-l p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{experiment.title}</h2>
          
          {/* Step Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">
              Step {currentStep + 1} of {experiment.steps.length}
            </h3>
            <p className="text-gray-700">{currentExperimentStep.instruction}</p>
            
            {showHints && (
              <p className="mt-2 text-sm text-gray-500 italic">
                💡 {engine.getStepHint(currentExperimentStep)}
              </p>
            )}
            
            <button 
              onClick={() => setShowHints(!showHints)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              {showHints ? 'Hide Hint' : 'Show Hint'}
            </button>
          </div>

          {/* Required Equipment */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Required Equipment:</h4>
            <div className="flex flex-wrap gap-2">
              {currentExperimentStep.equipmentNeeded.map(eq => (
                <span key={eq} className="px-2 py-1 bg-gray-100 rounded text-sm">
                  {eq.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mb-6">
            <button
              onClick={processExperiment}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={workbench.length === 0}
            >
              Run Experiment
            </button>
            
            {currentStep < experiment.steps.length - 1 && (
              <button
                onClick={nextStep}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next Step →
              </button>
            )}
          </div>

          {/* Reaction Results */}
          {reactionResult && (
            <div className={`p-4 rounded-lg mb-4 ${
              reactionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h4 className="font-semibold mb-2">
                {reactionResult.success ? '✅ Reaction Successful!' : '❌ No Reaction'}
              </h4>
              {reactionResult.error && (
                <p className="text-sm text-red-600 mb-2">{reactionResult.error}</p>
              )}
              {reactionResult.success && (
                <p className="text-sm">+{reactionResult.xpReward} XP Earned!</p>
              )}
            </div>
          )}

          {/* Observation Panel */}
          {observations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold">Record Observations:</h4>
              {observations
                .filter(obs => obs.stepId === currentExperimentStep.id)
                .map(obs => (
                  <ObservationInput
                    key={obs.id}
                    observation={obs}
                    onSubmit={(value) => submitObservation(obs.id, value)}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

// Draggable Equipment Component
const DraggableEquipment: React.FC<{ type: LabEquipment }> = ({ type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EQUIPMENT,
    item: { type: 'equipment', equipment: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-2 bg-white border rounded cursor-move hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span className="text-sm">🔬 {type.replace('_', ' ')}</span>
    </div>
  );
};

// Draggable Chemical Component
const DraggableChemical: React.FC<{ chemical: Chemical }> = ({ chemical }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CHEMICAL,
    item: { type: 'chemical', chemicalId: chemical.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const hazardColors: Record<string, string> = {
    'corrosive': 'border-red-500',
    'flammable': 'border-orange-500',
    'toxic': 'border-purple-500',
  };

  const hazardClass = chemical.hazardSymbols?.[0] 
    ? hazardColors[chemical.hazardSymbols[0]] || ''
    : 'border-gray-200';

  return (
    <div
      ref={drag}
      className={`p-2 bg-white border-2 ${hazardClass} rounded cursor-move hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="text-sm font-medium">{chemical.name}</div>
      <div className="text-xs text-gray-500">{chemical.formula}</div>
      {chemical.hazardSymbols && (
        <div className="text-xs text-red-600 mt-1">⚠️ {chemical.hazardSymbols.join(', ')}</div>
      )}
    </div>
  );
};

// Draggable Workbench Item
const DraggableWorkbenchItem: React.FC<{
  item: LabEquipmentItem;
  onMove: (id: string, x: number, y: number) => void;
  isSelected: boolean;
  onSelect: () => void;
  onDropChemical: (chemicalId: string) => void;
}> = ({ item, onMove, isSelected, onSelect, onDropChemical }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'workbench_item',
    item: { id: item.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.CHEMICAL,
    drop: (droppedItem: { type: string; chemicalId: string }) => {
      onDropChemical(droppedItem.chemicalId);
    },
  }));

  const getEquipmentColor = (type: LabEquipment): string => {
    const colors: Record<string, string> = {
      'beaker': 'bg-blue-100 border-blue-300',
      'test_tube': 'bg-green-100 border-green-300',
      'flask': 'bg-purple-100 border-purple-300',
      'burette': 'bg-yellow-100 border-yellow-300',
      'bunsen_burner': 'bg-red-100 border-red-300',
    };
    return colors[type] || 'bg-gray-100 border-gray-300';
  };

  return (
    <div
      ref={(node) => { drag(drop(node)); }}
      className={`absolute p-3 border-2 rounded-lg cursor-move ${
        getEquipmentColor(item.type)
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{ 
        left: item.position.x, 
        top: item.position.y,
        opacity: isDragging ? 0.5 : 1 
      }}
      onClick={onSelect}
    >
      <div className="text-center">
        <span className="text-2xl">
          {item.type === 'bunsen_burner' ? '🔥' : '🔬'}
        </span>
        <div className="text-xs mt-1">{item.type.replace('_', ' ')}</div>
        
        {/* Contents Display */}
        {item.contents && item.contents.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.contents.map((content, idx) => (
              <div key={idx} className="text-xs bg-white bg-opacity-50 rounded px-1 py-0.5">
                {content.volume}mL {content.chemicalId}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Observation Input Component
const ObservationInput: React.FC<{
  observation: StudentObservation;
  onSubmit: (value: string) => void;
}> = ({ observation, onSubmit }) => {
  const [value, setValue] = useState(observation.studentValue);
  const [submitted, setSubmitted] = useState(false);

  const observationPrompts: Record<string, string> = {
    color_change: 'What color change did you observe?',
    temperature_change: 'Describe the temperature change:',
    gas_produced: 'What gas was produced? (Describe)',
    precipitate_formed: 'Describe the precipitate:',
    ph_change: 'What pH change occurred?',
    no_change: 'Did you observe any changes?',
  };

  return (
    <div className="p-3 bg-white border rounded">
      <label className="block text-sm font-medium mb-1">
        {observationPrompts[observation.type]}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitted}
          className="flex-1 px-2 py-1 border rounded text-sm"
          placeholder="Your observation..."
        />
        {!submitted && (
          <button
            onClick={() => {
              onSubmit(value);
              setSubmitted(true);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Submit
          </button>
        )}
      </div>
      {submitted && (
        <div className={`mt-2 text-xs ${
          observation.isCorrect ? 'text-green-600' : 'text-red-600'
        }`}>
          {observation.isCorrect ? '✅ Correct!' : '❌ Incorrect'} 
          {observation.points > 0 && ` (+${observation.points} pts)`}
        </div>
      )}
    </div>
  );
};