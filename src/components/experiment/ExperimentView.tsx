import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TopicSelector } from './TopicSelector';
import { StarRating } from './StarRating';
import { ExperimentResults } from './ExperimentResults';
import type { Profile } from '../../types';

interface ExperimentViewProps {
  apiKey: string;
  profiles: Profile[];
}

export function ExperimentView({ apiKey, profiles }: ExperimentViewProps) {
  const [round, setRound] = useState(1);
  const [topic, setTopic] = useState({ main: '', sub: '' });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
  // Responses and rating state
  const [responses, setResponses] = useState<Array<{ profileId: string; content: string }>>([]);
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  
  // Overall experiment state
  const [totalScores, setTotalScores] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<Array<{ round: number; ratings: Record<string, number> }>>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize total scores when profiles change
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    profiles.forEach(p => { initialScores[p.id] = 0; });
    setTotalScores(initialScores);
  }, [profiles]);

  const handleGeneratePrompt = async (mainTopic: string, subTopic: string) => {
    if (!apiKey) {
      alert("Please provide a Gemini API Key in the Chat view first.");
      return;
    }
    
    setTopic({ main: mainTopic, sub: subTopic });
    setIsGeneratingPrompt(true);
    setGeneratedPrompt('');
    setResponses([]);
    setRatings({});

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
      
      const promptInstruction = `Create a complex, thought-provoking prompt about the subtopic "${subTopic}" within the broader topic of "${mainTopic}". The prompt should be challenging enough to test different AI personalities. Do not answer the prompt yourself, just write the question/instruction for another AI to answer. make the prompt not more than 20 words.`;
      
      const result = await model.generateContent(promptInstruction);
      setGeneratedPrompt(result.response.text().trim());
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate prompt. Check console.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleRunTest = async () => {
    if (!generatedPrompt.trim() || !apiKey) return;
    
    setIsGeneratingResponses(true);
    setResponses([]);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Map over profiles to create an array of promises
      const generatePromises = profiles.map(async (profile) => {
        const modelConfig: any = { model: "gemini-3.1-pro-preview" };
        if (profile.systemInstruction) {
          modelConfig.systemInstruction = profile.systemInstruction;
        }
        
        const model = genAI.getGenerativeModel(modelConfig);
        try {
           const result = await model.generateContent(generatedPrompt);
           return {
             profileId: profile.id,
             content: result.response.text()
           };
        } catch(e) {
          return {
             profileId: profile.id,
             content: "Error generating response: " + (e as Error).message
           };
        }
      });

      // Wait for all generations to finish
      const results = await Promise.all(generatePromises);
      
      // Shuffle the results so the user doesn't know which is which
      const shuffled = [...results].sort(() => Math.random() - 0.5);
      setResponses(shuffled);
      
      // Initialize ratings state for this round
      const newRatings: Record<string, number> = {};
      shuffled.forEach(r => { newRatings[r.profileId] = 0; });
      setRatings(newRatings);
      
    } catch (error) {
       console.error("Error running test:", error);
    } finally {
      setIsGeneratingResponses(false);
    }
  };

  const handleRate = (profileId: string, score: number) => {
    setRatings(prev => ({ ...prev, [profileId]: score }));
  };

  const handleSubmitRound = () => {
    // Check if all responses are rated (score > 0)
    const allRated = Object.values(ratings).every(r => r > 0);
    if (!allRated) {
      alert("Please rate all responses before continuing.");
      return;
    }

    // Update total scores
    const newTotalScores = { ...totalScores };
    Object.keys(ratings).forEach(id => {
      newTotalScores[id] = (newTotalScores[id] || 0) + ratings[id];
    });
    setTotalScores(newTotalScores);

    // Save history
    setHistory(prev => [...prev, { round, ratings: { ...ratings } }]);

    if (round < 5) {
      // Move to next round
      setRound(prev => prev + 1);
      setTopic({ main: '', sub: '' });
      setGeneratedPrompt('');
      setResponses([]);
      setRatings({});
    } else {
      // Complete experiment
      setIsComplete(true);
    }
  };

  if (isComplete) {
    return <ExperimentResults scores={totalScores} roundHistory={history} />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full gap-6">
      
      {/* Header section showing Round Progress */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center shrink-0">
         <div>
           <h2 className="text-xl font-bold text-slate-800">Experiment Lab</h2>
           <p className="text-sm text-slate-500">Blind testing AI personalities across different topics.</p>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Round</span>
            <span className="bg-blue-100 text-blue-800 text-lg font-bold px-3 py-1 rounded-full">{round} / 5</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8 flex flex-col gap-6">
        
        {/* Step 1: Topic Selection */}
        {!generatedPrompt && !isGeneratingPrompt && (
          <TopicSelector onSelect={handleGeneratePrompt} disabled={isGeneratingPrompt} />
        )}

        {isGeneratingPrompt && (
           <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p>Crafting a challenging prompt...</p>
           </div>
        )}

        {/* Step 2: Review and Edit Prompt */}
        {generatedPrompt && responses.length === 0 && !isGeneratingResponses && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-slate-800">Review Prompt</h3>
               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Topic: {topic.sub}</span>
             </div>
             
             <textarea 
               value={generatedPrompt}
               onChange={(e) => setGeneratedPrompt(e.target.value)}
               className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[150px] mb-4 text-slate-700 leading-relaxed"
             />
             
             <div className="flex gap-3 justify-end">
               <button 
                 onClick={() => setGeneratedPrompt('')} 
                 className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleRunTest}
                 className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
               >
                 Run Blind Test (4 Profiles)
               </button>
             </div>
          </div>
        )}

        {isGeneratingResponses && (
           <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <p>Generating responses from all 4 profiles in parallel...</p>
           </div>
        )}

        {/* Step 3: Blind Rating */}
        {responses.length > 0 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <h3 className="text-sm font-semibold text-blue-900 mb-1">Original Prompt</h3>
               <p className="text-sm text-blue-800">{generatedPrompt}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {responses.map((response, index) => (
                <div key={response.profileId} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                     <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Response {index + 1}</span>
                     <StarRating 
                       initialRating={ratings[response.profileId] || 0} 
                       onRate={(score) => handleRate(response.profileId, score)} 
                     />
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-64 prose prose-sm prose-slate">
                    <div dangerouslySetInnerHTML={{ __html: response.content.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <button 
                onClick={handleSubmitRound}
                disabled={!Object.values(ratings).every(r => r > 0)}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 flex items-center gap-2"
              >
                {round < 5 ? "Submit Ratings & Continue to Next Round" : "Submit Final Ratings & View Results"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
