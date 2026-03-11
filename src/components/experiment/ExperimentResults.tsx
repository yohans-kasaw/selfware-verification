import { Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import type { RatingCriteria, ExperimentRoundResult } from '../../types';
import { Home } from 'lucide-react';

interface ResultProps {
  scores: Record<string, RatingCriteria>;
  roundHistory: ExperimentRoundResult[];
  onGoHome?: () => void;
}

export function ExperimentResults({ scores, roundHistory, onGoHome }: ResultProps) {
  const profileIds = Object.keys(scores);
  
  // Transform data for the Overall Bar Chart
  const overallBarData = profileIds.map(id => ({
    name: id.charAt(0).toUpperCase() + id.slice(1),
    score: scores[id].overall
  })).sort((a, b) => b.score - a.score);

  // Transform data for the Radar Chart (Average across rounds)
  const numRounds = roundHistory.length || 1;
  const radarData = [
    { subject: 'Clarity', fullMark: numRounds * 5 },
    { subject: 'Depth', fullMark: numRounds * 5 },
    { subject: 'Engagement', fullMark: numRounds * 5 },
    { subject: 'Enjoyment', fullMark: numRounds * 5 },
    { subject: 'Overall', fullMark: numRounds * 5 },
  ];

  radarData.forEach(dataPoint => {
    profileIds.forEach(id => {
      const key = dataPoint.subject.toLowerCase() as keyof RatingCriteria;
      (dataPoint as any)[id.charAt(0).toUpperCase() + id.slice(1)] = scores[id][key];
    });
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']; // Blue, Emerald, Amber, Violet, Red

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full max-w-5xl mx-auto flex flex-col gap-8 relative">
      
      {onGoHome && (
        <button 
          onClick={onGoHome}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>
      )}

      <div className="text-center mt-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Experiment Complete!</h2>
        <p className="text-slate-500">Here is the breakdown of how each personality performed.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bar Chart: Overall Scores */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col">
          <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Total Overall Score</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overallBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {overallBarData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart: Criteria Breakdown */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col">
          <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Performance by Criteria</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} />
                <PolarRadiusAxis angle={30} domain={[0, numRounds * 5]} tick={false} axisLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                {profileIds.map((id, index) => {
                  const name = id.charAt(0).toUpperCase() + id.slice(1);
                  return (
                    <Radar
                      key={id}
                      name={name}
                      dataKey={name}
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={0.3}
                    />
                  );
                })}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
