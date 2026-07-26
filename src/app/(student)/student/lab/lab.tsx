// pages/dashboard/student/lab.tsx
// Student Virtual Lab Dashboard

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { VirtualLab } from '../../../../components/lab/VirtualLab';
import { Experiment, StudentExperiment, Badge } from '../../../../types/lab';

export default function StudentLabDashboard() {
  const { data: session } = useSession();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [completedExperiments, setCompletedExperiments] = useState<StudentExperiment[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'progress' | 'badges'>('browse');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabData();
  }, []);

  const fetchLabData = async () => {
    try {
      const [experimentsRes, completedRes, badgesRes] = await Promise.all([
        fetch('/api/lab/experiments?subject=chemistry'),
        fetch('/api/lab/student/experiments'),
        fetch('/api/lab/student/badges')
      ]);

      setExperiments(await experimentsRes.json());
      setCompletedExperiments(await completedRes.json());
      setBadges(await badgesRes.json());
    } catch (error) {
      console.error('Failed to fetch lab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExperiment = async (experiment: Experiment) => {
    try {
      const response = await fetch('/api/lab/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId: experiment.id,
          studentId: session?.user?.id
        })
      });

      if (response.ok) {
        setSelectedExperiment(experiment);
      }
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  };

  if (selectedExperiment) {
    return (
      <div>
        <button
          onClick={() => setSelectedExperiment(null)}
          className="m-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back to Lab
        </button>
        <VirtualLab experiment={selectedExperiment} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Virtual Chemistry Lab</h1>
          <p className="mt-2 text-gray-600">MSCE Practical Experiments</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Experiments Completed</div>
            <div className="text-3xl font-bold">{completedExperiments.length}</div>
            <div className="text-sm text-gray-400">of {experiments.length} available</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total XP Earned</div>
            <div className="text-3xl font-bold">
              {completedExperiments.reduce((sum, exp) => sum + exp.xpEarned, 0)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Average Score</div>
            <div className="text-3xl font-bold">
              {completedExperiments.length > 0
                ? Math.round(
                    completedExperiments.reduce((sum, exp) => sum + exp.score, 0) /
                    completedExperiments.length
                  )
                : 0}%
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">Badges Earned</div>
            <div className="text-3xl font-bold">{badges.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          {['browse', 'progress', 'badges'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'browse' ? 'Browse Experiments' : 
               tab === 'progress' ? 'My Progress' : 'Badges'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'browse' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Experiments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiments.map(experiment => {
                const isCompleted = completedExperiments.some(
                  e => e.experimentId === experiment.id && e.status === 'completed'
                );
                
                return (
                  <div
                    key={experiment.id}
                    className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
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
                        <div>📝 Steps: {experiment.steps.length}</div>
                      </div>

                      <button
                        onClick={() => startExperiment(experiment)}
                        disabled={isCompleted}
                        className={`w-full px-4 py-2 rounded-lg ${
                          isCompleted
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isCompleted ? '✅ Completed' : 'Start Experiment'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Experiment Progress</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3">Experiment</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Score</th>
                    <th className="text-left px-6 py-3">XP Earned</th>
                    <th className="text-left px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedExperiments.map(exp => (
                    <tr key={exp.id} className="border-t">
                      <td className="px-6 py-4">
                        {experiments.find(e => e.id === exp.experimentId)?.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          exp.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{exp.score}%</td>
                      <td className="px-6 py-4">{exp.xpEarned} XP</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {exp.completedAt
                          ? new Date(exp.completedAt).toLocaleDateString()
                          : 'In Progress'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className="bg-white rounded-lg shadow p-6 text-center"
                >
                  <div className="text-4xl mb-3">{badge.icon}</div>
                  <h3 className="font-semibold mb-1">{badge.name}</h3>
                  <p className="text-sm text-gray-500">{badge.description}</p>
                </div>
              ))}
              {badges.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-12">
                  Complete experiments to earn badges!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}