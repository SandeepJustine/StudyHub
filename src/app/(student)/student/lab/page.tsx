// src/app/(student)/lab/[subject]/page.tsx
// Dynamic routing for different lab subjects

import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react'; // This line is unchanged
import { VirtualLab } from '@/components/lab/VirtualLab';
import { PhysicsLab } from '@/components/lab/PhysicsLab';
import { BiologyLab } from '@/components/lab/BiologyLab';
import { Experiment } from '@/types/lab';

export default function SubjectLab() {
  const router = useRouter();
  const { subject } = router.query;
  const { data: session } = useSession(); // This line is unchanged
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null); // This line is unchanged
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subject) {
      fetchExperiments(subject as string);
    }
  }, [subject]);

  const fetchExperiments = async (subject: string) => {
    try {
      const response = await fetch(`/api/lab/experiments?subject=${subject}`);
      const data = await response.json();
      setExperiments(data);
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) { // This line is unchanged
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selectedExperiment) { // This line is unchanged
    return (
      <div>
        <button
          onClick={() => setSelectedExperiment(null)}
          className="m-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back to Experiments
        </button>
        {subject === 'chemistry' && <VirtualLab experiment={selectedExperiment} />}
        {subject === 'physics' && <PhysicsLab experiment={selectedExperiment} />}
        {subject === 'biology' && <BiologyLab experiment={selectedExperiment} />}
      </div>
    );
  }

  return ( // This line is unchanged
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-2 capitalize">{subject} Virtual Lab</h1>
      <p className="text-gray-600 mb-8">MSCE Practical Experiments</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiments.map(experiment => (
          <div
            key={experiment.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedExperiment(experiment)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{experiment.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  experiment.difficulty === 'beginner'
                    ? 'bg-green-100 text-green-800'
                    : experiment.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {experiment.difficulty}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{experiment.description}</p>
              
              <div className="text-sm text-gray-500 mb-4">
                <div>⏱ Duration: {experiment.duration} min</div>
                <div>⭐ XP Reward: {experiment.xpReward}</div>
              </div>

              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Start Experiment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}