'use client';

import React, { useMemo, useRef, useState } from 'react';
import { biologyEngine } from '@/services/lab/BiologyEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Specimen, CellOrganelle, MicroscopeView } from '@/types/lab';

// ---- Structural types mirrored from BiologyEngine's internal (unexported) shapes ----
// These aren't exported by BiologyEngine, so we derive them structurally from the
// engine's own method signatures. If the engine's return shapes change, these follow.
type DissectionStep = ReturnType<typeof biologyEngine.startDissection>[number];
type SpecimenInfo = ReturnType<typeof biologyEngine.getSpecimenInfo>;
type ViewResult = ReturnType<typeof biologyEngine.viewSpecimen>;
type StainResult = ReturnType<typeof biologyEngine.applyStain>;

const MAG_LEVELS = [40, 100, 400, 1000] as const;

// Roughly how much of the slide (in % of the 0-100 coordinate space used for
// organelle positions) is visible in the eyepiece at each magnification.
// Real compound microscopes have a shrinking field of view as power increases,
// which is what makes finding structures at 400x/1000x genuinely hard.
const FIELD_OF_VIEW: Record<number, number> = {
  40: 100,
  100: 55,
  400: 22,
  1000: 10,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}

// ------------------------------------------------------------------
// Microscope Station
// ------------------------------------------------------------------

type PrepStage = 'unmounted' | 'mounted' | 'stained' | 'coverslipped';

const MicroscopeStation: React.FC = () => {
  const specimens = useMemo(() => biologyEngine.getAvailableSpecimens(), []);
  const [specimen, setSpecimen] = useState<Specimen>(specimens[0]);
  const [slideKey, setSlideKey] = useState(0); // bump to simulate cutting a fresh slide

  const [prep, setPrep] = useState<PrepStage>('unmounted');
  const [stainApplied, setStainApplied] = useState<'iodine' | 'methylene_blue' | null>(null);
  const [stainResult, setStainResult] = useState<StainResult | null>(null);

  const [view, setView] = useState<MicroscopeView>({
    magnification: 40,
    focus: 50,
    lightIntensity: 70,
    stage: { x: 50, y: 50 },
    visibleOrganelles: [],
  });

  const [viewResult, setViewResult] = useState<ViewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quizTarget, setQuizTarget] = useState<CellOrganelle | null>(null);
  const [quizGuess, setQuizGuess] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, attempts: 0 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ x: number; y: number } | null>(null);

  const info: SpecimenInfo = useMemo(() => biologyEngine.getSpecimenInfo(specimen), [specimen]);

  // Every real slide has a slightly different ideal focus point — this is what
  // makes turning the focus knob matter instead of being a fixed threshold.
  const idealFocus = useMemo(() => 35 + Math.random() * 40, [specimen, slideKey]);
  const blurPx = clamp(Math.abs(view.focus - idealFocus) / 3.5, 0, 10);
  const inFocus = blurPx < 1.5;

  const fieldOfView = FIELD_OF_VIEW[view.magnification];

  const resetSlide = (nextSpecimen?: Specimen) => {
    setSpecimen(nextSpecimen ?? specimen);
    setSlideKey((k) => k + 1);
    setPrep('unmounted');
    setStainApplied(null);
    setStainResult(null);
    setViewResult(null);
    setError(null);
    setQuizTarget(null);
    setQuizFeedback(null);
    setView((v) => ({ ...v, stage: { x: 50, y: 50 } }));
  };

  const handleMount = () => setPrep('mounted');

  const handleStain = (stain: 'iodine' | 'methylene_blue') => {
    try {
      setError(null);
      const result = biologyEngine.applyStain(specimen, stain);
      setStainResult(result);
      setStainApplied(stain);
      if (result.success) setPrep('stained');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCoverslip = () => {
    if (prep === 'unmounted') {
      setError('Mount the specimen on the slide before adding a coverslip.');
      return;
    }
    setPrep('coverslipped');
  };

  const canView = prep === 'mounted' || prep === 'stained' || prep === 'coverslipped';

  const handleViewSpecimen = () => {
    try {
      setError(null);
      if (!canView) {
        setError('Prepare the slide first: mount the specimen, then add a coverslip.');
        return;
      }
      setViewResult(biologyEngine.viewSpecimen(specimen, view));
    } catch (e: any) {
      setError(e.message);
    }
  };

  // --- Stage dragging (panning) ---
  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;
    dragState.current = { x: e.clientX, y: e.clientY };

    const pctDx = (dx / rect.width) * fieldOfView;
    const pctDy = (dy / rect.height) * fieldOfView;

    setView((v) => {
      const half = fieldOfView / 2;
      return {
        ...v,
        stage: {
          x: clamp(v.stage.x - pctDx, half, 100 - half),
          y: clamp(v.stage.y - pctDy, half, 100 - half),
        },
      };
    });
  };

  const onPointerUp = () => {
    dragState.current = null;
  };

  const setMagnification = (mag: typeof MAG_LEVELS[number]) => {
    setView((v) => {
      const half = FIELD_OF_VIEW[mag] / 2;
      return {
        ...v,
        magnification: mag,
        stage: {
          x: clamp(v.stage.x, half, 100 - half),
          y: clamp(v.stage.y, half, 100 - half),
        },
      };
    });
  };

  // Slide transform: maps the 0-100 slide coordinate space into the viewport
  // window, so panning the stage and changing magnification both feel physical.
  const slideStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${(100 / fieldOfView) * 100}%`,
    height: `${(100 / fieldOfView) * 100}%`,
    left: `${-((view.stage.x - fieldOfView / 2) / fieldOfView) * 100}%`,
    top: `${-((view.stage.y - fieldOfView / 2) / fieldOfView) * 100}%`,
    filter: `blur(${blurPx}px) brightness(${0.5 + view.lightIntensity / 100})`,
    transition: 'left 120ms ease-out, top 120ms ease-out, filter 150ms ease-out',
  };

  const handleDotClick = (organelle: CellOrganelle) => {
    if (!inFocus || !viewResult) return;
    setQuizTarget(organelle);
    setQuizGuess('');
    setQuizFeedback(null);
  };

  const submitQuiz = () => {
    if (!quizTarget) return;
    const correct = normalize(quizGuess) === normalize(quizTarget);
    setQuizScore((s) => ({ correct: s.correct + (correct ? 1 : 0), attempts: s.attempts + 1 }));
    setQuizFeedback(
      correct
        ? '✅ Correct!'
        : `❌ Not quite — this is the ${quizTarget.replace(/_/g, ' ')}.`
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Specimen</label>
          <select
            value={specimen}
            onChange={(e) => resetSlide(e.target.value as Specimen)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {specimens.map((s) => (
              <option key={s} value={s}>
                {biologyEngine.getSpecimenInfo(s)?.name ?? s}
              </option>
            ))}
          </select>
        </div>

        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Slide prep</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant={prep === 'unmounted' ? 'primary' : 'outline'} onClick={handleMount}>
                1. Mount specimen
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={prep === 'unmounted' || !info?.stainingRequired}
                onClick={() => handleStain(specimen === 'onion_epidermis' ? 'iodine' : 'methylene_blue')}
              >
                2. Add stain
              </Button>
              <Button size="sm" variant="outline" disabled={prep === 'unmounted'} onClick={handleCoverslip}>
                3. Add coverslip
              </Button>
              <Button size="sm" variant="outline" onClick={() => resetSlide()}>
                🔄 New slide
              </Button>
            </div>
            {info?.stainingRequired && prep !== 'stained' && prep !== 'coverslipped' && (
              <p className="text-xs text-amber-700">
                This specimen is nearly transparent unstained — structures will be faint.
              </p>
            )}
            {stainResult && (
              <div className={`text-xs p-2 rounded ${stainResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {stainResult.message}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Status: <span className="font-medium">{prep}</span>
            </p>
          </CardContent>
        </Card>

        <div>
          <label className="block text-sm font-medium mb-1">Magnification: {view.magnification}x</label>
          <div className="grid grid-cols-4 gap-2">
            {MAG_LEVELS.map((mag) => (
              <Button key={mag} variant={view.magnification === mag ? 'primary' : 'outline'} size="sm" onClick={() => setMagnification(mag)}>
                {mag}x
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Focus: {view.focus}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={view.focus}
            onChange={(e) => setView((v) => ({ ...v, focus: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Light: {view.lightIntensity}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={view.lightIntensity}
            onChange={(e) => setView((v) => ({ ...v, lightIntensity: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        <Button variant="primary" fullWidth onClick={handleViewSpecimen}>
          🔬 View Specimen
        </Button>

        {error && <div className="p-2 bg-red-50 text-red-700 rounded text-xs">{error}</div>}

        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>Quiz score</span>
          <Badge>{quizScore.correct}/{quizScore.attempts}</Badge>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-2">
        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative bg-black rounded-full aspect-square max-h-[440px] mx-auto overflow-hidden border-8 border-gray-800 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        >
          {/* vignette to sell "looking through an eyepiece" */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ boxShadow: 'inset 0 0 80px 40px rgba(0,0,0,0.85)' }}
          />

          {viewResult ? (
            <div style={slideStyle}>
              {viewResult.annotations.map((a, i) => {
                const enhanced = stainResult?.success && stainResult.enhancedOrganelles.includes(a.organelle as CellOrganelle);
                return (
                  <button
                    key={i}
                    onClick={() => handleDotClick(a.organelle as CellOrganelle)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{
                      left: `${a.position.x}%`,
                      top: `${a.position.y}%`,
                      width: 22,
                      height: 22,
                      background: enhanced ? 'rgba(96,165,250,0.55)' : 'rgba(255,255,255,0.25)',
                      borderColor: enhanced ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                    }}
                    title={a.organelle.replace(/_/g, ' ')}
                  />
                );
              })}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-center px-8 z-0">
              <div>
                <div className="text-4xl mb-2">🔬</div>
                <p className="text-sm">Prepare the slide, then click View Specimen.</p>
              </div>
            </div>
          )}

          {viewResult && !inFocus && (
            <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-amber-300 z-10">
              Out of focus — adjust the focus knob
            </div>
          )}
        </div>

        {viewResult && (
          <p className="text-center text-xs text-gray-500">
            Drag inside the eyepiece to move the slide · field of view: {fieldOfView}% of slide at {view.magnification}x
          </p>
        )}

        {quizTarget && (
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium">What structure did you just click on?</p>
              <div className="flex gap-2">
                <Input
                  value={quizGuess}
                  onChange={(e: any) => setQuizGuess(e.target.value)}
                  placeholder="e.g. nucleus"
                  className="flex-1"
                />
                <Button size="sm" onClick={submitQuiz}>
                  Submit
                </Button>
              </div>
              {quizFeedback && <p className="text-xs">{quizFeedback}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Dissection Station
// ------------------------------------------------------------------

const DissectionStation: React.FC = () => {
  const specimens = useMemo(() => biologyEngine.getDissectionSpecimens(), []);
  const [specimen, setSpecimen] = useState<Specimen>(specimens[0]);
  const [steps, setSteps] = useState<DissectionStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const begin = () => {
    try {
      setError(null);
      const guide = biologyEngine.startDissection(specimen);
      setSteps(guide);
      setIndex(0);
      setScore(0);
      setFeedback(null);
      setGuess('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const current = steps?.[index] ?? null;
  const finished = !!steps && index >= steps.length;

  const submitGuess = () => {
    if (!current) return;
    const result = biologyEngine.identifyOrgan(specimen, { organ: guess, location: current.location }, current);
    setScore((s) => s + result.score);
    setFeedback(result.feedback);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setGuess('');
    setFeedback(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Specimen</label>
          <select
            value={specimen}
            onChange={(e) => {
              setSpecimen(e.target.value as Specimen);
              setSteps(null);
            }}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {specimens.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <Button variant="primary" fullWidth onClick={begin}>
          🔪 Begin Dissection
        </Button>
        {error && <div className="p-2 bg-red-50 text-red-700 rounded text-xs">{error}</div>}
        {steps && (
          <div className="text-xs text-gray-500">
            Progress: {Math.min(index + (finished ? 0 : 0), steps.length)}/{steps.length}
            <div className="mt-1">
              Score: <Badge>{score}</Badge>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        {!steps && <p className="text-gray-500 text-sm">Choose a specimen and begin the dissection to identify structures in sequence.</p>}

        {steps && !finished && current && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Structure {index + 1} of {steps.length}</p>
              <p className="text-sm"><span className="font-medium">Location clue:</span> {current.location}</p>
              <p className="text-sm"><span className="font-medium">Appearance:</span> {current.appearance}</p>
              <div className="flex gap-2">
                <Input value={guess} onChange={(e: any) => setGuess(e.target.value)} placeholder="Name this structure" className="flex-1" />
                <Button size="sm" onClick={submitGuess} disabled={!!feedback}>
                  Identify
                </Button>
              </div>
              {feedback && (
                <div className="text-sm p-2 bg-gray-50 rounded">
                  {feedback}
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={next}>
                      Next structure →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {steps && finished && (
          <Card>
            <CardContent className="p-4 text-center space-y-2">
              <p className="text-lg font-semibold">Dissection complete 🎉</p>
              <p className="text-sm text-gray-600">
                Final score: {score} / {steps.length * 10}
              </p>
              <Button size="sm" variant="outline" onClick={begin}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Comparison Station
// ------------------------------------------------------------------

type VennBucket = 'specimen1' | 'both' | 'specimen2';

const ComparisonStation: React.FC = () => {
  const specimens = useMemo(() => biologyEngine.getAvailableSpecimens(), []);
  const [s1, setS1] = useState<Specimen>(specimens[0]);
  const [s2, setS2] = useState<Specimen>(specimens[1] ?? specimens[0]);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    similarities: string[];
    differences: { feature: string; specimen1: string; specimen2: string }[];
  } | null>(null);

  // chips to sort: label -> correct bucket
  const [chips, setChips] = useState<{ id: string; label: string; correct: VennBucket }[] | null>(null);
  const [placed, setPlaced] = useState<Record<string, VennBucket>>({});
  const [checked, setChecked] = useState(false);

  const compare = () => {
    try {
      setError(null);
      const r = biologyEngine.compareCells(s1, s2);
      setResult(r);

      const simChips = r.similarities.map((s, i) => ({
        id: `sim-${i}`,
        label: s.split(':')[0],
        correct: 'both' as VennBucket,
      }));
      const diffChips = r.differences
        .filter((d) => d.specimen1 !== 'Absent' || d.specimen2 !== 'Absent')
        .map((d, i) => ({
          id: `diff-${i}`,
          label: d.feature,
          correct: (d.specimen1.startsWith('Present') ? 'specimen1' : 'specimen2') as VennBucket,
        }));

      const all = [...simChips, ...diffChips].sort(() => Math.random() - 0.5);
      setChips(all);
      setPlaced({});
      setChecked(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const onDrop = (bucket: VennBucket) => (e: React.DragEvent) => {
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    setPlaced((p) => ({ ...p, [id]: bucket }));
  };

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const correctCount = chips ? chips.filter((c) => placed[c.id] === c.correct).length : 0;

  const bucketLabel: Record<VennBucket, string> = {
    specimen1: biologyEngine.getSpecimenInfo(s1)?.name ?? 'Specimen 1',
    both: 'Both',
    specimen2: biologyEngine.getSpecimenInfo(s2)?.name ?? 'Specimen 2',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Specimen 1</label>
          <select value={s1} onChange={(e) => setS1(e.target.value as Specimen)} className="w-full px-3 py-2 border rounded-lg text-sm">
            {specimens.map((s) => (
              <option key={s} value={s}>
                {biologyEngine.getSpecimenInfo(s)?.name ?? s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Specimen 2</label>
          <select value={s2} onChange={(e) => setS2(e.target.value as Specimen)} className="w-full px-3 py-2 border rounded-lg text-sm">
            {specimens.map((s) => (
              <option key={s} value={s}>
                {biologyEngine.getSpecimenInfo(s)?.name ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button variant="primary" onClick={compare}>
        Compare Cells
      </Button>
      {error && <div className="p-2 bg-red-50 text-red-700 rounded text-xs">{error}</div>}

      {chips && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Drag each feature into the correct part of the diagram.</p>

          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-lg bg-gray-50">
            {chips
              .filter((c) => !placed[c.id])
              .map((c) => (
                <span
                  key={c.id}
                  draggable
                  onDragStart={onDragStart(c.id)}
                  className="px-2 py-1 bg-white border rounded-full text-xs cursor-move shadow-sm capitalize"
                >
                  {c.label}
                </span>
              ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['specimen1', 'both', 'specimen2'] as VennBucket[]).map((bucket) => (
              <div
                key={bucket}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop(bucket)}
                className="min-h-[140px] border-2 border-dashed rounded-lg p-2 space-y-1 bg-white"
              >
                <p className="text-xs font-semibold text-center text-gray-500 capitalize">{bucketLabel[bucket]}</p>
                {chips
                  .filter((c) => placed[c.id] === bucket)
                  .map((c) => {
                    const isRight = checked ? c.correct === bucket : null;
                    return (
                      <div
                        key={c.id}
                        className={`px-2 py-1 rounded text-xs capitalize ${
                          isRight === null ? 'bg-gray-100' : isRight ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {c.label}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setChecked(true)}>
              Check answers
            </Button>
            {checked && (
              <span className="text-sm">
                {correctCount}/{chips.length} correct
              </span>
            )}
          </div>
        </div>
      )}

      {result && (
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-500">Show full comparison data</summary>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <h4 className="font-semibold text-green-800 mb-2">✅ Similarities ({result.similarities.length})</h4>
              {result.similarities.map((s, i) => (
                <div key={i} className="p-2 bg-green-50 rounded text-sm mb-1">
                  {s}
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-orange-800 mb-2">⚡ Differences ({result.differences.length})</h4>
              {result.differences.map((d, i) => (
                <div key={i} className="p-2 bg-orange-50 rounded text-sm mb-1">
                  <span className="font-medium capitalize">{d.feature}:</span> {d.specimen1} vs {d.specimen2}
                </div>
              ))}
            </div>
          </div>
        </details>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Mitotic Index Station
// ------------------------------------------------------------------

type FieldCell = { id: number; x: number; y: number; isMitotic: boolean };

function generateField(count = 45): FieldCell[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 6 + Math.random() * 88,
    y: 6 + Math.random() * 88,
    isMitotic: Math.random() < 0.16,
  }));
}

const MitosisStation: React.FC = () => {
  const [field, setField] = useState<FieldCell[]>(() => generateField());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const actualMitotic = field.filter((c) => c.isMitotic).length;

  const result = submitted ? biologyEngine.calculateMitoticIndex(field.length, actualMitotic) : null;

  const toggle = (id: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const newField = () => {
    setField(generateField());
    setSelected(new Set());
    setSubmitted(false);
  };

  const truePositives = field.filter((c) => c.isMitotic && selected.has(c.id)).length;
  const falsePositives = field.filter((c) => !c.isMitotic && selected.has(c.id)).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-3 space-y-2 text-sm">
            <p className="font-medium">Root tip squash — mitotic index</p>
            <p className="text-gray-600 text-xs">
              Click every cell showing condensed chromosomes (clustered dark clumps), as if identifying
              cells undergoing mitosis in a stained root tip squash. Interphase nuclei appear as a single
              faint blob.
            </p>
          </CardContent>
        </Card>
        <Button variant="primary" fullWidth onClick={() => setSubmitted(true)} disabled={submitted}>
          Submit count
        </Button>
        <Button variant="outline" fullWidth onClick={newField}>
          🔄 New field of view
        </Button>

        {result && (
          <Card>
            <CardContent className="p-3 space-y-1 text-sm">
              <p>
                Your selections: {selected.size} cells ({truePositives} correct, {falsePositives} false positives)
              </p>
              <p>
                Actual mitotic index: <span className="font-semibold">{result.mitoticIndex}%</span>
              </p>
              <p className="text-gray-600">{result.interpretation}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="relative bg-purple-950 rounded-xl aspect-square max-h-[440px] mx-auto overflow-hidden border-4 border-gray-800">
          {field.map((cell) => {
            const isSelected = selected.has(cell.id);
            const reveal = submitted;
            return (
              <button
                key={cell.id}
                onClick={() => toggle(cell.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${cell.x}%`,
                  top: `${cell.y}%`,
                  width: 18,
                  height: 18,
                  outline: isSelected ? '2px solid #facc15' : 'none',
                  background: cell.isMitotic
                    ? 'radial-gradient(circle at 30% 30%, #f472b6 0 3px, transparent 3px), radial-gradient(circle at 65% 40%, #f472b6 0 3px, transparent 3px), radial-gradient(circle at 45% 65%, #f472b6 0 3px, transparent 3px), rgba(226,232,240,0.5)'
                    : 'rgba(226,232,240,0.5)',
                  boxShadow: reveal && cell.isMitotic ? '0 0 0 2px #f472b6' : undefined,
                }}
                title={reveal ? (cell.isMitotic ? 'mitotic' : 'interphase') : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Main Lab shell
// ------------------------------------------------------------------

type Tab = 'microscope' | 'dissection' | 'comparison' | 'mitosis';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'microscope', icon: '🔬', label: 'Scope' },
  { id: 'dissection', icon: '🔪', label: 'Dissect' },
  { id: 'comparison', icon: '🔍', label: 'Compare' },
  { id: 'mitosis', icon: '🧬', label: 'Mitosis' },
];

export const BiologyLab: React.FC<{ experiment?: any; initialSpecimen?: Specimen }> = () => {
  const [activeTab, setActiveTab] = useState<Tab>('microscope');

  return (
    <div className="flex h-[calc(100vh-200px)] bg-grey-light">
      <div className="w-14 bg-white border-r flex flex-col items-center py-3 space-y-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs ${
              activeTab === tab.id ? 'bg-green-100 text-green-600' : 'text-grey-medium'
            }`}
          >
            {tab.icon}
            <span className="text-[9px]">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'microscope' && <MicroscopeStation />}
        {activeTab === 'dissection' && <DissectionStation />}
        {activeTab === 'comparison' && <ComparisonStation />}
        {activeTab === 'mitosis' && <MitosisStation />}
      </div>
    </div>
  );
};

export default BiologyLab;