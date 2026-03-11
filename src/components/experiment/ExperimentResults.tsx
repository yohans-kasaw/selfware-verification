import { useState, useEffect } from 'react';
import { Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import type { RatingCriteria, ExperimentRoundResult } from '../../types';
import { Home, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ResultProps {
  experimentId: string | null;
  scores: Record<string, RatingCriteria>;
  roundHistory: ExperimentRoundResult[];
  apiKey: string;
  modelId: string;
  onGoHome?: () => void;
}

export function ExperimentResults({ experimentId, scores, roundHistory, onGoHome, apiKey, modelId }: ResultProps) {
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const profileIds = Object.keys(scores);
  
  // Load analysis from local storage on mount
  useEffect(() => {
    if (experimentId) {
      const savedAnalysis = localStorage.getItem(`analysis_${experimentId}`);
      if (savedAnalysis) {
        setAnalysis(savedAnalysis);
      }
    }
  }, [experimentId]);

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis('');

    const analysisPrompt = `
      You are an expert data analyst. Based on the following blind test results for different AI personalities, provide a concise, insightful, and data-driven summary.

      **Data:**
      - Overall Winner: ${winner}
      - Most Improved Profile: ${mostImproved.name} (with an improvement of ${mostImproved.improvement.toFixed(1)} points from first to last round)
      - Total Rounds: ${roundHistory.length}
      - Final Scores (sum of all rounds for each criteria): ${JSON.stringify(scores, null, 2)}
      - Round-by-Round History (scores for each round): ${JSON.stringify(roundHistory, null, 2)}

      **Your Task:**
      Your analysis must be extremely concise (under 150 words) and heavily data-driven.
      1.  **Overall Summary:** State the winner and the key reason for their win based on the data.
      2.  **Key Insights & Comparisons:** Provide 2-3 bullet points. Each point must include a quantitative comparison using percentages. For example: "Profile A's 'Clarity' score was 35% higher than the runner-up, Profile B," or "Profile C showed a 50% score improvement from Round 1 to Round 5."
      3.  **Conclusion:** Briefly state the main strength of the winning profile.

      Focus on percentages and direct data comparisons. Do not use vague statements.
    `;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(analysisPrompt);
      const newAnalysis = await result.response.text();
      setAnalysis(newAnalysis);

      // Save to local storage
      if (experimentId) {
        localStorage.setItem(`analysis_${experimentId}`, newAnalysis);
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
      setAnalysis("Sorry, I was unable to generate the analysis. Please check the console for errors.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Transform data for the Overall Bar Chart
  const overallBarData = profileIds.map(id => ({
    name: id.charAt(0).toUpperCase() + id.slice(1),
    score: scores[id].vibes
  })).sort((a, b) => b.score - a.score);

  // New: Transform data for Round-by-Round Line Chart
  const roundLineData = roundHistory.map((round, index) => {
    const roundData: { name: string, [key: string]: number | string } = { name: `Round ${index + 1}`};
    profileIds.forEach(id => {
      const profileName = id.charAt(0).toUpperCase() + id.slice(1);
      roundData[profileName] = round.ratings[id]?.vibes || 0;
    });
    return roundData;
  });

  // New: Transform data for individual criteria bar charts
  const criteria = ['clarity', 'enjoyment'];
  const criteriaBarData = criteria.map(criterion => ({
    name: criterion.charAt(0).toUpperCase() + criterion.slice(1),
    data: profileIds.map(id => ({
      name: id.charAt(0).toUpperCase() + id.slice(1),
      score: scores[id][criterion as keyof RatingCriteria]
    })).sort((a, b) => b.score - a.score)
  }));

  // New: Summary Data
  const winner = overallBarData.length > 0 ? overallBarData[0].name : 'N/A';
  const mostImproved = profileIds.map(id => {
    const profileName = id.charAt(0).toUpperCase() + id.slice(1);
    const firstRoundScore = roundHistory[0]?.ratings[id]?.vibes || 0;
    const lastRoundScore = roundHistory[roundHistory.length - 1]?.ratings[id]?.vibes || 0;
    return { name: profileName, improvement: lastRoundScore - firstRoundScore };
  }).sort((a, b) => b.improvement - a.improvement)[0];

  // Transform data for the Radar Chart (Average across rounds)
  const numRounds = roundHistory.length || 1;
  const radarData = [
    { subject: 'Clarity', fullMark: numRounds * 5 },
    { subject: 'Enjoyment', fullMark: numRounds * 5 },
    { subject: 'Vibes', fullMark: numRounds * 5 },
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

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-center">
          <h4 className="text-sm font-semibold text-blue-800 uppercase">Winner</h4>
          <p className="text-3xl font-bold text-blue-600">{winner}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-center">
          <h4 className="text-sm font-semibold text-emerald-800 uppercase">Most Improved</h4>
          <p className="text-3xl font-bold text-emerald-600">{mostImproved.name} (+{mostImproved.improvement.toFixed(1)})</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-center">
          <h4 className="text-sm font-semibold text-amber-800 uppercase">Total Rounds</h4>
          <p className="text-3xl font-bold text-amber-600">{roundHistory.length}</p>
        </div>
      </div>
      
      {/* AI Analysis Section */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-800">AI-Powered Analysis</h3>
          {!isAnalyzing && (
            <button
              onClick={handleGenerateAnalysis}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {analysis ? 'Regenerate Analysis' : 'Generate Analysis'}
            </button>
          )}
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-4 text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <span>Generating insights with {modelId}...</span>
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}>
          </div>
        )}
      </div>

      {/* Scoring Explanation */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Understanding the Scores</h3>
        <p className="text-sm text-slate-600">
          Each AI personality was rated across five criteria for each of the <strong>{roundHistory.length}</strong> rounds. The scores you see in the charts are the cumulative totals from all rounds.
        </p>
        <ul className="text-sm text-slate-600 mt-2 list-disc list-inside space-y-1">
          <li><strong>Overall Score:</strong> The total sum of the 'Vibes' rating given in each round. This is the primary metric for the winner.</li>
          <li><strong>Performance by Criteria:</strong> Shows the total score for each specific criterion (Clarity, Enjoyment, etc.) across all rounds. This helps identify specific strengths.</li>
          <li><strong>Score Progression:</strong> Tracks the 'Vibes' score each personality received in each round, showing performance trends over time.</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        
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

        {/* New: Line Chart for Round-by-Round score */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Overall Score Progression</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={roundLineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        {profileIds.map((id, index) => {
                            const name = id.charAt(0).toUpperCase() + id.slice(1);
                            return <Line key={id} type="monotone" dataKey={name} stroke={colors[index % colors.length]} strokeWidth={2} activeDot={{ r: 8 }} />;
                        })}
                    </LineChart>
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
                {profileIds.map((id: string, index: number) => {
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

        {/* New: Bar charts for each criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {criteriaBarData.map((criterion, index) => (
                <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">{criterion.name}</h3>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={criterion.data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                    {criterion.data.map((_entry, cellIndex) => (
                                        <Cell key={`cell-${cellIndex}`} fill={colors[cellIndex % colors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ))}
        </div>

        {/* New: Detailed Score Table */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Detailed Scores per Round</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-l-lg">Round</th>
                            {profileIds.map(id => <th key={id} scope="col" className="px-6 py-3 text-center">{id.charAt(0).toUpperCase() + id.slice(1)}</th>)}
                            <th scope="col" className="px-6 py-3 rounded-r-lg text-center">Topic</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roundHistory.map((round, index) => (
                            <tr key={index} className="bg-white border-b last:border-b-0">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                    Round {index + 1}
                                </th>
                                {profileIds.map(id => {
                                    const rating = round.ratings[id];
                                    return (
                                        <td key={id} className="px-6 py-4 text-center">
                                            {rating ? `${rating.vibes.toFixed(1)}` : 'N/A'}
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-4 text-center text-slate-400 italic">
                                    "{round.prompts[profileIds[0]]}"
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
