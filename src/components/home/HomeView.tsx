import { useEffect, useState } from 'react';
import type { ExperimentRecord } from '../../types';
import { ExperimentIcon, BotIcon } from '../Icons';

interface HomeViewProps {
  onStartNew: () => void;
  onViewExperiment: (record: ExperimentRecord) => void;
}

export function HomeView({ onStartNew, onViewExperiment }: HomeViewProps) {
  const [history, setHistory] = useState<ExperimentRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('experiment_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any null/invalid records that might have been saved
          setHistory(parsed.filter(r => r && r.id && r.rounds));
        }
      } catch (e) {
        console.error("Failed to parse experiment history", e);
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this experiment record?")) {
      const updated = history.filter(h => h.id !== id);
      setHistory(updated);
      localStorage.setItem('experiment_history', JSON.stringify(updated));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full gap-6">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExperimentIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to the AI Experiment Lab</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-8">
          Test different AI personalities in blind rounds to discover which profile generates the best educational content, explanations, and insights.
        </p>
        <button
          onClick={onStartNew}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 inline-flex items-center gap-2"
        >
          <BotIcon className="w-5 h-5" />
          Start New Experiment
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Past Experiments</h3>
        
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
            <p>No past experiments found.</p>
            <p className="text-sm mt-1">Your saved experiments will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((record) => (
              <div 
                key={record.id} 
                onClick={() => onViewExperiment(record)}
                className="bg-slate-50 border border-slate-200 p-5 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {record.rounds.length} Rounds
                  </span>
                  <button 
                    onClick={(e) => handleDelete(record.id, e)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Delete record"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
                
                <h4 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2" title={record.topic}>
                  {record.topic}
                </h4>
                
                <p className="text-xs text-slate-500 mb-4 mt-auto">
                  {new Date(record.date).toLocaleDateString()} at {new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                
                <div className="text-sm text-slate-600 bg-white p-2 rounded border border-slate-100 mt-auto">
                  Model: <span className="font-medium text-slate-800">{record.modelId}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}