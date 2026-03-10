import { Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

interface ResultProps {
  scores: Record<string, number>;
  roundHistory: Array<{ round: number; ratings: Record<string, number> }>;
}

export function ExperimentResults({ scores, roundHistory }: ResultProps) {
  const profileIds = Object.keys(scores);
  
  // Transform data for the bar chart
  const barData = profileIds.map(id => ({
    name: id.charAt(0).toUpperCase() + id.slice(1),
    score: scores[id]
  })).sort((a, b) => b.score - a.score);

  // Transform data for line chart
  const lineData = roundHistory.map(h => {
    const dataPoint: any = { round: `Round ${h.round}` };
    profileIds.forEach(id => {
      dataPoint[id.charAt(0).toUpperCase() + id.slice(1)] = h.ratings[id] || 0;
    });
    return dataPoint;
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']; // Blue, Emerald, Amber, Violet

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Experiment Complete!</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Total Score (The Winner)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {barData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Round by Round Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="round" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 5]} />
                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                {profileIds.map((id, index) => (
                  <Line 
                    key={id}
                    type="monotone" 
                    dataKey={id.charAt(0).toUpperCase() + id.slice(1)} 
                    stroke={colors[index % colors.length]} 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
