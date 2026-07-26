// components/lab/BiologyLab.tsx
// Biology Virtual Lab Component

import React, { useState } from 'react';
import { BiologyEngine } from '../../services/lab/BiologyEngine';
import { Specimen, CellOrganelle, MicroscopeView, BiologyExperiment } from '../../types/lab';

export const BiologyLab: React.FC<{ experiment: BiologyExperiment }> = ({ experiment }) => {
  const [engine] = useState(() => new BiologyEngine());
  const [activeTab, setActiveTab] = useState<'microscope' | 'dissection' | 'comparison'>('microscope');
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen>('onion_epidermis');
  const [microscopeView, setMicroscopeView] = useState<MicroscopeView>({
    magnification: 40,
    focus: 50,
    lightIntensity: 70,
    stage: { x: 0, y: 0 },
    visibleOrganelles: []
  });
  const [viewResult, setViewResult] = useState<any>(null);
  const [stainResult, setStainResult] = useState<any>(null);
  const [dissectionStep, setDissectionStep] = useState(0);
  const [dissectionSteps, setDissectionSteps] = useState<any[]>([]);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [score, setScore] = useState(0);

  const handleViewSpecimen = () => {
    const result = engine.viewSpecimen(selectedSpecimen, microscopeView);
    setViewResult(result);
  };

  const handleApplyStain = (stain: 'iodine' | 'methylene_blue') => {
    const result = engine.applyStain(selectedSpecimen, stain);
    setStainResult(result);
  };

  const handleStartDissection = (specimen: Specimen) => {
    const steps = engine.startDissection(specimen);
    setDissectionSteps(steps);
    setDissectionStep(0);
    setScore(0);
  };

  const handleIdentifyOrgan = () => {
    if (!dissectionSteps[dissectionStep]) return;
    
    const result = engine.identifyOrgan(
      selectedSpecimen,
      { organ: studentAnswer, location: '' },
      dissectionSteps[dissectionStep]
    );

    if (result.isCorrect) {
      setScore(prev => prev + result.score);
    }

    // Move to next step
    if (dissectionStep < dissectionSteps.length - 1) {
      setDissectionStep(prev => prev + 1);
      setStudentAnswer('');
    }
  };

  const renderMicroscope = () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">🔬 Microscope Lab</h2>
      
      <div className="grid grid-cols-3 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          {/* Specimen Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Specimen</label>
            <select
              value={selectedSpecimen}
              onChange={(e) => setSelectedSpecimen(e.target.value as Specimen)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="onion_epidermis">Onion Epidermis</option>
              <option value="cheek_cells">Human Cheek Cells</option>
              <option value="leaf_epidermis">Leaf Epidermis (Stomata)</option>
              <option value="pond_water">Pond Water Microorganisms</option>
            </select>
          </div>

          {/* Magnification */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Magnification: {microscopeView.magnification}x
            </label>
            <div className="flex space-x-2">
              {[40, 100, 400, 1000].map(mag => (
                <button
                  key={mag}
                  onClick={() => setMicroscopeView(prev => ({ ...prev, magnification: mag as any }))}
                  className={`px-3 py-2 rounded ${
                    microscopeView.magnification === mag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {mag}x
                </button>
              ))}
            </div>
          </div>

          {/* Focus Control */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Focus: {microscopeView.focus}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={microscopeView.focus}
              onChange={(e) => setMicroscopeView(prev => ({ ...prev, focus: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Light Intensity */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Light: {microscopeView.lightIntensity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={microscopeView.lightIntensity}
              onChange={(e) => setMicroscopeView(prev => ({ ...prev, lightIntensity: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Stage Controls */}
          <div>
            <label className="block text-sm font-medium mb-2">Stage Position</label>
            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <button
                onClick={() => setMicroscopeView(prev => ({
                  ...prev,
                  stage: { ...prev.stage, y: prev.stage.y - 10 }
                }))}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                ↑
              </button>
              <div></div>
              <button
                onClick={() => setMicroscopeView(prev => ({
                  ...prev,
                  stage: { ...prev.stage, x: prev.stage.x - 10 }
                }))}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                ←
              </button>
              <div className="p-2 text-center text-sm">Stage</div>
              <button
                onClick={() => setMicroscopeView(prev => ({
                  ...prev,
                  stage: { ...prev.stage, x: prev.stage.x + 10 }
                }))}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                →
              </button>
              <div></div>
              <button
                onClick={() => setMicroscopeView(prev => ({
                  ...prev,
                  stage: { ...prev.stage, y: prev.stage.y + 10 }
                }))}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>

          <button
            onClick={handleViewSpecimen}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            View Specimen
          </button>

          {/* Staining */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Staining</h4>
            <div className="space-x-2">
              <button
                onClick={() => handleApplyStain('iodine')}
                className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 rounded"
              >
                🟡 Iodine Solution
              </button>
              <button
                onClick={() => handleApplyStain('methylene_blue')}
                className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded"
              >
                🔵 Methylene Blue
              </button>
            </div>
            {stainResult && (
              <div className={`mt-2 p-2 rounded text-sm ${
                stainResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {stainResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Microscope View */}
        <div className="col-span-2">
          <div className="bg-black rounded-lg aspect-square relative overflow-hidden">
            {viewResult ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simulated microscope image */}
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {selectedSpecimen === 'onion_epidermis' ? '🧅' :
                     selectedSpecimen === 'cheek_cells' ? '🦠' :
                     selectedSpecimen === 'leaf_epidermis' ? '🍃' : '🔬'}
                  </div>
                  <p className="text-white text-lg mb-2">
                    {viewResult.visibleOrganelles.length} organelles visible
                  </p>
                  <div className="text-gray-300 text-sm">
                    Magnification: {microscopeView.magnification}x
                  </div>
                </div>
                
                {/* Annotations */}
                {viewResult.annotations.map((annotation: any, idx: number) => (
                  <div
                    key={idx}
                    className="absolute"
                    style={{
                      left: `${annotation.position.x}%`,
                      top: `${annotation.position.y}%`
                    }}
                  >
                    <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="absolute left-6 top-0 bg-white px-2 py-1 rounded text-xs shadow">
                      {annotation.organelle.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                Adjust settings and click "View Specimen" to observe
              </div>
            )}
          </div>

          {/* Visible Organelles List */}
          {viewResult && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {viewResult.annotations.map((annotation: any, idx: number) => (
                <div key={idx} className="p-3 bg-white rounded shadow">
                  <h4 className="font-semibold capitalize">
                    {annotation.organelle.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-gray-600">{annotation.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDissection = () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">🔪 Dissection Lab</h2>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Specimen Selection */}
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Specimen</label>
            <div className="space-x-2">
              <button
                onClick={() => handleStartDissection('flower_dissection')}
                className="px-4 py-2 bg-pink-100 hover:bg-pink-200 rounded"
              >
                🌸 Flower
              </button>
              <button
                onClick={() => handleStartDissection('earthworm')}
                className="px-4 py-2 bg-brown-100 hover:bg-brown-200 rounded"
              >
                🪱 Earthworm
              </button>
            </div>
          </div>

          {/* Dissection Progress */}
          {dissectionSteps.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  Step {dissectionStep + 1} of {dissectionSteps.length}
                </h3>
                <span className="text-sm">Score: {score}</span>
              </div>

              {/* Current Step */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2">Find the:</h4>
                <p className="text-xl font-bold mb-2">{dissectionSteps[dissectionStep]?.organ}</p>
                <p className="text-sm text-gray-600">
                  <strong>Hint:</strong> {dissectionSteps[dissectionStep]?.location}
                </p>
              </div>

              {/* Answer Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Type the organ name..."
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  onClick={handleIdentifyOrgan}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Identify
                </button>
              </div>

              {/* Organ Information */}
              {dissectionStep > 0 && (
                <div className="mt-4 p-4 bg-white rounded shadow">
                  <h4 className="font-semibold mb-2">Previous Organ:</h4>
                  <p className="font-medium">{dissectionSteps[dissectionStep - 1]?.organ}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {dissectionSteps[dissectionStep - 1]?.function}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dissectionSteps[dissectionStep - 1]?.systems.map((sys: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dissection Diagram */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
            {dissectionSteps.length > 0 ? (
              <div className="text-center">
                <div className="text-8xl mb-4">
                  {selectedSpecimen === 'flower_dissection' ? '🌸' : '🪱'}
                </div>
                <p className="text-lg font-semibold">
                  {selectedSpecimen === 'flower_dissection' ? 'Flower Structure' : 'Earthworm Anatomy'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Identify the organs by their description and location
                </p>
                
                {/* Progress dots */}
                <div className="flex justify-center space-x-2 mt-4">
                  {dissectionSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full ${
                        idx < dissectionStep
                          ? 'bg-green-500'
                          : idx === dissectionStep
                          ? 'bg-yellow-500 animate-pulse'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a specimen to begin dissection
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-16 bg-white border-r flex flex-col items-center py-4 space-y-4">
        <TabButton icon="🔬" label="Microscope" active={activeTab === 'microscope'} onClick={() => setActiveTab('microscope')} />
        <TabButton icon="🔪" label="Dissection" active={activeTab === 'dissection'} onClick={() => setActiveTab('dissection')} />
        <TabButton icon="🔬" label="Compare" active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'microscope' && renderMicroscope()}
        {activeTab === 'dissection' && renderDissection()}
        {activeTab === 'comparison' && <CellComparison engine={engine} />}
      </div>
    </div>
  );
};

const CellComparison: React.FC<{ engine: BiologyEngine }> = ({ engine }) => {
  const [specimen1, setSpecimen1] = useState<Specimen>('onion_epidermis');
  const [specimen2, setSpecimen2] = useState<Specimen>('cheek_cells');
  const [result, setResult] = useState<any>(null);

  const compareCells = () => {
    const comparison = engine.compareCells(specimen1, specimen2);
    setResult(comparison);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Cell Comparison</h2>
      
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Specimen 1</label>
          <select
            value={specimen1}
            onChange={(e) => setSpecimen1(e.target.value as Specimen)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="onion_epidermis">Onion Epidermis (Plant)</option>
            <option value="cheek_cells">Cheek Cells (Animal)</option>
            <option value="leaf_epidermis">Leaf Epidermis (Plant)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Specimen 2</label>
          <select
            value={specimen2}
            onChange={(e) => setSpecimen2(e.target.value as Specimen)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="cheek_cells">Cheek Cells (Animal)</option>
            <option value="onion_epidermis">Onion Epidermis (Plant)</option>
            <option value="pond_water">Pond Water (Protist)</option>
          </select>
        </div>
      </div>

      <button
        onClick={compareCells}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6"
      >
        Compare Cells
      </button>

      {result && (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Similarities</h3>
            <div className="space-y-2">
              {result.similarities.map((similarity: string, idx: number) => (
                <div key={idx} className="p-3 bg-green-50 rounded">
                  <p className="text-sm">{similarity}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Differences</h3>
            <div className="space-y-2">
              {result.differences.map((diff: any, idx: number) => (
                <div key={idx} className="p-3 bg-yellow-50 rounded">
                  <p className="font-medium text-sm capitalize">{diff.feature.replace('_', ' ')}</p>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <p className="text-xs text-gray-600">{diff.specimen1}</p>
                    <p className="text-xs text-gray-600">{diff.specimen2}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      active ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'
    }`}
    title={label}
  >
    <span className="text-xl">{icon}</span>
  </button>
);