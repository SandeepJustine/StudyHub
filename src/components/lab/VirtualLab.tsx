'use client';

import React, { useMemo, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChemistryEngine } from '@/services/lab/ChemistryEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LabEquipmentItem,
  Chemical,
  Experiment,
  ExperimentStep,
  StudentObservation,
  LabEquipment,
  ObservationType,
} from '@/types/lab';

const ItemTypes = {
  EQUIPMENT: 'equipment',
  CHEMICAL: 'chemical',
};

// Plausible multiple-choice distractors per observation type. The engine's
// expectedValue strings are answer-key codes (e.g. "bright_white_light"),
// not something a student could reasonably type from scratch — so we turn
// observation entry into a recognition task instead of a spelling test.
const OPTION_BANKS: Record<ObservationType, string[]> = {
  color_change: ['colorless', 'blue', 'white_powder', 'pink_to_colorless', 'metal_dissolves', 'solid_dissolves', 'bright_white_light', 'no_visible_change'],
  temperature_change: ['increases', 'decreases', 'no_change', 'slight_increase', 'intense_heat'],
  gas_produced: ['bubbles', 'effervescence', 'none', 'strong_odour'],
  precipitate_formed: ['white_precipitate', 'blue_precipitate', 'none'],
  ph_change: ['neutral', 'more_acidic', 'more_alkaline', 'no_change'],
  no_change: ['none', 'limewater_milky', 'neutral', 'no_visible_change'],
};

function buildOptions(type: ObservationType, correct: string): string[] {
  const pool = new Set([correct, ...(OPTION_BANKS[type] ?? [])]);
  const arr = Array.from(pool);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const chosen = arr.slice(0, 4);
  return chosen.includes(correct) ? chosen : [correct, ...chosen.slice(0, 3)];
}

function defaultAmount(chemical: Chemical) {
  return chemical.state === 'solid' ? 5 : 20;
}

function unitFor(chemicalId: string, engine: ChemistryEngine) {
  const chem = engine.getChemical(chemicalId);
  return chem?.state === 'solid' ? 'g' : 'mL';
}

export const VirtualLab: React.FC<{ experiment: Experiment }> = ({ experiment }) => {
  const [engine] = useState(() => new ChemistryEngine());
  const [workbench, setWorkbench] = useState<LabEquipmentItem[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [observations, setObservations] = useState<StudentObservation[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [isHeating, setIsHeating] = useState(false);
  const [reactionResult, setReactionResult] = useState<any>(null);
  const [safetyAck, setSafetyAck] = useState(false);
  const [finished, setFinished] = useState(false);

  const inventory = useMemo<LabEquipment[]>(
    () => ['beaker', 'test_tube', 'flask', 'burette', 'pipette', 'measuring_cylinder', 'bunsen_burner', 'tripod_stand', 'wire_gauze', 'funnel', 'filter_paper', 'evaporating_dish', 'thermometer'],
    []
  );

  const chemicals = engine.getAllChemicals();
  const currentExperimentStep: ExperimentStep = experiment.steps[currentStep];

  // --- Requirements checklist for the current step (data already existed on
  // ExperimentStep but was never read anywhere) ---
  const hasRequiredEquipment = currentExperimentStep.equipmentNeeded.every((eq) => workbench.some((w) => w.type === eq));
  const hasRequiredChemical =
    !currentExperimentStep.chemicalNeeded ||
    workbench.some((w) =>
      w.contents?.some(
        (c) =>
          c.chemicalId === currentExperimentStep.chemicalNeeded &&
          (currentExperimentStep.volume ? Math.abs(c.volume - currentExperimentStep.volume) <= 5 : true)
      )
    );

  const hazardousInPlay = workbench.some((w) => w.contents?.some((c) => (engine.getChemical(c.chemicalId)?.hazardSymbols?.length ?? 0) > 0));
  const canRun = workbench.length > 0 && (!hazardousInPlay || safetyAck);

  // Placing new equipment from the panel is handled by <LabWorkbench>, which
  // renders *inside* <DndProvider> below. useDrop/useDrag must be called by a
  // component that is a descendant of DndProvider in the render tree — calling
  // it here in VirtualLab (the component that renders DndProvider itself)
  // throws "Expected drag drop context" because VirtualLab is DndProvider's
  // ancestor, not its child.
  const addEquipment = (type: LabEquipment, x: number, y: number) => {
    const newEquipment: LabEquipmentItem = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      position: { x, y },
      contents: [],
      isHeating: false,
    };
    setWorkbench((prev) => [...prev, newEquipment]);
  };

  const addChemical = (equipmentId: string, chemicalId: string) => {
    const chem = engine.getChemical(chemicalId);
    const amount = chem ? defaultAmount(chem) : 20;
    setWorkbench((prev) =>
      prev.map((item) => (item.id === equipmentId ? { ...item, contents: [...(item.contents || []), { chemicalId, volume: amount }] } : item))
    );
  };

  const updateContentAmount = (equipmentId: string, index: number, amount: number) => {
    setWorkbench((prev) =>
      prev.map((item) => {
        if (item.id !== equipmentId || !item.contents) return item;
        const contents = item.contents.map((c, i) => (i === index ? { ...c, volume: Math.max(0, amount) } : c));
        return { ...item, contents };
      })
    );
  };

  const removeContent = (equipmentId: string, index: number) => {
    setWorkbench((prev) =>
      prev.map((item) => (item.id === equipmentId && item.contents ? { ...item, contents: item.contents.filter((_, i) => i !== index) } : item))
    );
  };

  const moveEquipment = (id: string, x: number, y: number) => {
    setWorkbench((prev) => prev.map((i) => (i.id === id ? { ...i, position: { x, y } } : i)));
  };

  const removeEquipment = (id: string) => {
    setWorkbench((prev) => prev.filter((i) => i.id !== id));
    if (selectedEquipment === id) setSelectedEquipment(null);
  };

  const processExperiment = () => {
    if (!canRun) return;
    const equipmentWithChemicals = workbench.filter((e) => e.contents?.length);
    const reactants = equipmentWithChemicals.flatMap((eq) => eq.contents?.map((content) => ({ chemicalId: content.chemicalId, volume: content.volume })) || []);

    const result = engine.processReaction(reactants, { heating: isHeating, temperature: isHeating ? 100 : 25 });
    setReactionResult(result);

    if (result.success) {
      const newObservations: StudentObservation[] = result.observations.map((obs: any) => ({
        id: `${Date.now()}-${Math.random()}`,
        stepId: currentExperimentStep.id,
        type: obs.type,
        studentValue: '',
        expectedValue: obs.expectedValue,
        isCorrect: false,
        points: 0,
      }));
      setObservations((prev) => [...prev, ...newObservations]);
    }
  };

  const submitObservation = (observationId: string, value: string) => {
    setObservations((prev) =>
      prev.map((obs) => {
        if (obs.id === observationId && reactionResult?.reaction) {
          const validation = engine.validateObservation(reactionResult.reaction, { type: obs.type, value });
          return { ...obs, studentValue: value, isCorrect: validation.isCorrect, points: validation.points };
        }
        return obs;
      })
    );
  };

  const isLastStep = currentStep === experiment.steps.length - 1;

  const nextStep = () => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
      setReactionResult(null);
      setIsHeating(false);
    } else {
      setFinished(true);
    }
  };

  const finalScore = useMemo(() => engine.calculateScore(observations), [observations, engine]);
  const totalXp = useMemo(() => (reactionResult?.success ? observations.reduce((s, o) => s + o.points, 0) : 0), [observations, reactionResult]);

  if (finished) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-2xl">🧪🎉</p>
            <h2 className="text-lg font-bold text-navy">{experiment.title} — Complete</h2>
            <p className="text-sm text-gray-600">
              You recorded {observations.length} observation{observations.length !== 1 ? 's' : ''} across {experiment.steps.length} steps.
            </p>
            <div className="text-3xl font-bold text-navy">{finalScore}%</div>
            <p className="text-xs text-gray-500">Observation accuracy score</p>
            <Button
              variant="outline"
              onClick={() => {
                setFinished(false);
                setCurrentStep(0);
                setObservations([]);
                setWorkbench([]);
                setReactionResult(null);
              }}
            >
              Restart experiment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
        {/* Equipment Panel */}
        <div className="w-full lg:w-56 bg-white rounded-xl shadow-sm border p-4 overflow-y-auto">
          <h3 className="font-semibold text-navy mb-3 text-sm">Equipment</h3>
          <div className="space-y-1.5">
            {inventory.map((item) => (
              <DraggableEquipment key={item} type={item} />
            ))}
          </div>

          <h3 className="font-semibold text-navy mt-4 mb-3 text-sm">Chemicals</h3>
          <div className="space-y-1.5">
            {chemicals.map((chem) => (
              <DraggableChemical key={chem.id} chemical={chem} />
            ))}
          </div>
        </div>

        {/* Lab Workbench */}
        <LabWorkbench
          workbench={workbench}
          engine={engine}
          isHeating={isHeating}
          selectedEquipment={selectedEquipment}
          reactionResult={reactionResult}
          onSelect={setSelectedEquipment}
          onMove={moveEquipment}
          onRemove={removeEquipment}
          onDropChemical={addChemical}
          onUpdateAmount={updateContentAmount}
          onRemoveContent={removeContent}
          onDropEquipment={addEquipment}
          onToggleHeat={() => setIsHeating((h) => !h)}
        />

        {/* Experiment Panel */}
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-navy mb-3">{experiment.title}</h2>

          <Card className="mb-3 bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <h3 className="font-semibold text-navy text-sm mb-1">
                Step {currentStep + 1} of {experiment.steps.length}
              </h3>
              <p className="text-grey-dark text-sm">{currentExperimentStep.instruction}</p>
              {showHints && <p className="mt-2 text-xs text-grey-medium italic">💡 {currentExperimentStep.hint ?? engine.getStepHint(currentExperimentStep)}</p>}
              <button onClick={() => setShowHints(!showHints)} className="mt-1 text-xs text-navy hover:underline">
                {showHints ? 'Hide Hint' : 'Show Hint'}
              </button>
            </CardContent>
          </Card>

          {/* Requirements checklist */}
          <Card className="mb-3">
            <CardContent className="p-3 space-y-1 text-xs">
              <p className="font-semibold text-navy text-sm mb-1">This step needs</p>
              {currentExperimentStep.equipmentNeeded.map((eq) => (
                <div key={eq} className={hasRequiredEquipment ? 'text-green-700' : 'text-gray-500'}>
                  {workbench.some((w) => w.type === eq) ? '✅' : '⬜'} {eq.replace(/_/g, ' ')}
                </div>
              ))}
              {currentExperimentStep.chemicalNeeded && (
                <div className={hasRequiredChemical ? 'text-green-700' : 'text-gray-500'}>
                  {hasRequiredChemical ? '✅' : '⬜'} {engine.getChemical(currentExperimentStep.chemicalNeeded)?.name ?? currentExperimentStep.chemicalNeeded}
                  {currentExperimentStep.volume ? ` (~${currentExperimentStep.volume}${unitFor(currentExperimentStep.chemicalNeeded, engine)})` : ''}
                </div>
              )}
            </CardContent>
          </Card>

          {hazardousInPlay && (
            <label className="flex items-center gap-2 text-xs mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <input type="checkbox" checked={safetyAck} onChange={(e) => setSafetyAck(e.target.checked)} />
              🥽 I'm wearing safety goggles — a corrosive chemical is on the bench.
            </label>
          )}

          <div className="space-y-2 mb-4">
            <Button variant="primary" fullWidth size="sm" onClick={processExperiment} disabled={!canRun}>
              ⚗️ Run Experiment
            </Button>
            <Button variant="outline" fullWidth size="sm" onClick={nextStep}>
              {isLastStep ? 'Finish Experiment ✓' : 'Next Step →'}
            </Button>
          </div>

          {reactionResult && (
            <div className={`p-3 rounded-lg mb-3 text-sm ${reactionResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              <p className="font-semibold">{reactionResult.success ? '✅ Reaction Successful!' : '❌ No Reaction'}</p>
              {reactionResult.success ? <p>{reactionResult.reaction?.name}</p> : <p>{reactionResult.error}</p>}
              {reactionResult.success && reactionResult.reaction?.safetyNotes && <p className="text-xs mt-1 text-amber-700">⚠ {reactionResult.reaction.safetyNotes}</p>}
            </div>
          )}

          {observations.filter((o) => o.stepId === currentExperimentStep.id).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-navy text-sm">Record Observations:</h4>
              {observations
                .filter((o) => o.stepId === currentExperimentStep.id)
                .map((obs) => (
                  <ObservationInput key={obs.id} observation={obs} onSubmit={(value) => submitObservation(obs.id, value)} />
                ))}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

const DraggableEquipment: React.FC<{ type: LabEquipment }> = ({ type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EQUIPMENT,
    item: { equipment: type },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div ref={drag} className={`p-1.5 bg-white border rounded cursor-move hover:shadow text-xs ${isDragging ? 'opacity-50' : ''}`}>
      🔬 {type.replace(/_/g, ' ')}
    </div>
  );
};

const DraggableChemical: React.FC<{ chemical: Chemical }> = ({ chemical }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CHEMICAL,
    item: { chemicalId: chemical.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const hazardous = (chemical.hazardSymbols?.length ?? 0) > 0;

  return (
    <div ref={drag} className={`p-1.5 bg-white border rounded cursor-move hover:shadow text-xs ${isDragging ? 'opacity-50' : ''}`}>
      <span className="font-medium">{chemical.name}</span>
      <span className="text-grey-medium ml-1">{chemical.formula}</span>
      {hazardous && <span className="ml-1" title={chemical.safetyNotes}>⚠️</span>}
    </div>
  );
};

// Owns the "drop new equipment here" target. Must be rendered as a descendant
// of <DndProvider> (which it is, from VirtualLab's JSX) — that's the part that
// broke when the drop target lived directly in VirtualLab.
const LabWorkbench: React.FC<{
  workbench: LabEquipmentItem[];
  engine: ChemistryEngine;
  isHeating: boolean;
  selectedEquipment: string | null;
  reactionResult: any;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onDropChemical: (equipmentId: string, chemicalId: string) => void;
  onUpdateAmount: (equipmentId: string, index: number, amount: number) => void;
  onRemoveContent: (equipmentId: string, index: number) => void;
  onDropEquipment: (type: LabEquipment, x: number, y: number) => void;
  onToggleHeat: () => void;
}> = ({ workbench, engine, isHeating, selectedEquipment, reactionResult, onSelect, onMove, onRemove, onDropChemical, onUpdateAmount, onRemoveContent, onDropEquipment, onToggleHeat }) => {
  const workbenchRef = useRef<HTMLDivElement | null>(null);

  const [, dropRef] = useDrop(
    () => ({
      accept: ItemTypes.EQUIPMENT,
      drop: (item: { equipment: LabEquipment }, monitor) => {
        const offset = monitor.getClientOffset();
        const rect = workbenchRef.current?.getBoundingClientRect();
        if (!offset || !rect) return;
        onDropEquipment(item.equipment, offset.x - rect.left - 40, offset.y - rect.top - 40);
      },
    }),
    [onDropEquipment]
  );

  return (
    <div
      ref={(node) => {
        workbenchRef.current = node;
        dropRef(node);
      }}
      className="flex-1 relative bg-white rounded-xl shadow-sm border-2 border-dashed border-grey-light min-h-[400px] overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center text-grey-medium pointer-events-none">
        {workbench.length === 0 && 'Drag equipment here'}
      </div>

      {workbench.map((item) => (
        <WorkbenchItem
          key={item.id}
          item={item}
          engine={engine}
          isHeating={isHeating}
          isSelected={selectedEquipment === item.id}
          onSelect={() => onSelect(item.id)}
          onMove={onMove}
          onRemove={() => onRemove(item.id)}
          onDropChemical={(chemicalId) => onDropChemical(item.id, chemicalId)}
          onUpdateAmount={(index, amount) => onUpdateAmount(item.id, index, amount)}
          onRemoveContent={(index) => onRemoveContent(item.id, index)}
          reactionResult={reactionResult}
        />
      ))}

      {workbench.some((item) => item.type === 'bunsen_burner') && (
        <div className="absolute bottom-4 right-4">
          <Button variant={isHeating ? 'danger' : 'outline'} size="sm" onClick={onToggleHeat}>
            {isHeating ? '🔥 Heating ON' : '🔥 Heat OFF'}
          </Button>
        </div>
      )}
    </div>
  );
};

const WorkbenchItem: React.FC<{
  item: LabEquipmentItem;
  engine: ChemistryEngine;
  isHeating: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: () => void;
  onDropChemical: (chemicalId: string) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onRemoveContent: (index: number) => void;
  reactionResult: any;
}> = ({ item, engine, isHeating, isSelected, onSelect, onMove, onRemove, onDropChemical, onUpdateAmount, onRemoveContent, reactionResult }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.CHEMICAL,
    drop: (i: { chemicalId: string }) => onDropChemical(i.chemicalId),
  }));

  const dragOrigin = useRef<{ pointerX: number; pointerY: number; itemX: number; itemY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    onSelect();
    dragOrigin.current = { pointerX: e.clientX, pointerY: e.clientY, itemX: item.position.x, itemY: item.position.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMoveHandler = (e: React.PointerEvent) => {
    if (!dragOrigin.current) return;
    const dx = e.clientX - dragOrigin.current.pointerX;
    const dy = e.clientY - dragOrigin.current.pointerY;
    onMove(item.id, dragOrigin.current.itemX + dx, dragOrigin.current.itemY + dy);
  };
  const onPointerUp = () => {
    dragOrigin.current = null;
  };

  const liquidColor = item.contents?.[0] ? engine.getChemical(item.contents[0].chemicalId)?.color : undefined;
  const showBubbles = reactionResult?.success && reactionResult.observations?.some((o: any) => o.type === 'gas_produced') && (item.contents?.length ?? 0) > 0;
  const showFlash = reactionResult?.success && reactionResult.observations?.some((o: any) => o.type === 'color_change' || o.type === 'temperature_change');

  return (
    <div
      ref={drop as any}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMoveHandler}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className={`absolute p-3 bg-white border-2 rounded-lg text-center cursor-move text-xs select-none ${isSelected ? 'border-navy shadow-md' : 'border-grey-light'}`}
      style={{ left: item.position.x, top: item.position.y, touchAction: 'none', minWidth: 90 }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] leading-5"
        title="Remove"
      >
        ✕
      </button>

      <div className="relative inline-block">
        <span className="text-xl">🔬</span>
        {isHeating && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-base animate-pulse">🔥</span>}
        {showBubbles && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs animate-bounce">💨</span>}
      </div>

      <div>{item.type.replace(/_/g, ' ')}</div>

      {liquidColor && (
        <div
          className={`mx-auto mt-1 w-6 h-3 rounded-sm border ${showFlash ? 'ring-2 ring-yellow-400' : ''}`}
          style={{ background: liquidColor === 'colorless' ? 'rgba(180,220,255,0.4)' : liquidColor }}
          title={`Contents tinted ${liquidColor}`}
        />
      )}

      <div className="mt-1 space-y-1" onPointerDown={(e) => e.stopPropagation()}>
        {item.contents?.map((c, i) => {
          const chem = engine.getChemical(c.chemicalId);
          const unit = chem?.state === 'solid' ? 'g' : 'mL';
          return (
            <div key={i} className="flex items-center gap-1 justify-center">
              <span className="text-[10px] truncate max-w-[50px]">{c.chemicalId}</span>
              <input
                type="number"
                value={c.volume}
                onChange={(e) => onUpdateAmount(i, Number(e.target.value))}
                className="w-12 text-[10px] border rounded px-1"
              />
              <span className="text-[9px] text-gray-400">{unit}</span>
              {item.type === 'burette' && (
                <button className="text-[10px] text-navy" onClick={() => onUpdateAmount(i, c.volume + 1)} title="Dispense 1 more mL (titration)">
                  +1
                </button>
              )}
              <button className="text-[10px] text-red-500" onClick={() => onRemoveContent(i)}>
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ObservationInput: React.FC<{ observation: StudentObservation; onSubmit: (value: string) => void }> = ({ observation, onSubmit }) => {
  const [submittedValue, setSubmittedValue] = useState<string | null>(observation.studentValue || null);
  const options = useMemo(() => buildOptions(observation.type, observation.expectedValue), [observation.type, observation.expectedValue]);

  const choose = (value: string) => {
    if (submittedValue) return;
    setSubmittedValue(value);
    onSubmit(value);
  };

  return (
    <div className="p-2 bg-white border rounded text-xs space-y-1.5">
      <label className="block font-medium">What did you observe ({observation.type.replace(/_/g, ' ')})?</label>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => {
          const isChosen = submittedValue === opt;
          const isCorrectAnswer = submittedValue && opt === observation.expectedValue;
          return (
            <button
              key={opt}
              disabled={!!submittedValue}
              onClick={() => choose(opt)}
              className={`px-2 py-1 rounded border text-[11px] capitalize ${
                isChosen && observation.isCorrect
                  ? 'bg-green-100 border-green-400 text-green-800'
                  : isChosen && !observation.isCorrect
                  ? 'bg-red-100 border-red-400 text-red-800'
                  : isCorrectAnswer
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {opt.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>
      {submittedValue && (
        <div className={observation.isCorrect ? 'text-green-700' : 'text-red-700'}>
          {observation.isCorrect ? '✅ Correct!' : '❌ Not quite'} {observation.points > 0 && `(+${observation.points}pts)`}
        </div>
      )}
    </div>
  );
};

export default VirtualLab;