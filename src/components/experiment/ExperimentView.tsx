import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TopicSelector } from './TopicSelector';
import { CriteriaRating } from './CriteriaRating';
import { ExperimentResults } from './ExperimentResults';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Profile, RatingCriteria, ExperimentRoundResult, ExperimentRecord } from '../../types';

interface ExperimentViewProps {
  apiKey: string;
  profiles: Profile[];
  modelId: string;
  onExperimentComplete: (record: ExperimentRecord) => void;
  initialRecord?: ExperimentRecord | null;
}

export function ExperimentView({ apiKey, profiles, modelId, onExperimentComplete, initialRecord }: ExperimentViewProps) {
  const [round, setRound] = useState(1);
  const [topic, setTopic] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
  // Responses and rating state
  const [responses, setResponses] = useState<Array<{ profileId: string; content: string; prompt: string }>>([]);
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false);
  const [ratings, setRatings] = useState<Record<string, RatingCriteria>>({});
  
  // UI State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Overall experiment state
  const [totalScores, setTotalScores] = useState<Record<string, RatingCriteria>>({});
  const [history, setHistory] = useState<ExperimentRoundResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Load initial record if viewing past experiment
  useEffect(() => {
    if (initialRecord) {
      setIsComplete(true);
      setHistory(initialRecord.rounds);
      setTotalScores(initialRecord.totalScores);
      setTopic(initialRecord.topic);
    } else {
      setIsComplete(false);
      setRound(1);
      setTopic('');
      setResponses([]);
      setRatings({});
      setCurrentCardIndex(0);
      setHistory([]);
      
      const initialScores: Record<string, RatingCriteria> = {};
      profiles.forEach(p => { 
        initialScores[p.id] = { clarity: 0, depth: 0, engagement: 0, enjoyment: 0, overall: 0 }; 
      });
      setTotalScores(initialScores);
    }
  }, [initialRecord, profiles]);

  const handleStartExperiment = async (mainTopic: string, targetWordLimit: number) => {
    if (!apiKey) {
      alert("Please provide a Gemini API Key in the Chat view first.");
      return;
    }
    
    setTopic(mainTopic);
    setIsGeneratingPrompt(true);
    setResponses([]);
    setRatings({});
    setCurrentCardIndex(0);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelId });
      
      const promptInstruction = `You are designing a blind test to evaluate different AI personalities on their ability to explain complex concepts simply.
      
The topic is: "${mainTopic}".

Generate exactly 5 distinct, highly educational prompts/questions about different specific aspects or angles of this topic.
The prompts must ask the AI to explain a concept or educate the user. Do NOT generate argumentative, persuasive, or debate-style prompts.
Specify in each prompt that the output should not exceed ${targetWordLimit} words.

Return ONLY a valid JSON array of strings, with exactly 5 strings. No markdown formatting, no code blocks, just the JSON array. Example: ["Explain X...", "How does Y work...", ...]`;
      
      const result = await model.generateContent(promptInstruction);
      let text = result.response.text().trim();
      
      // Clean up potential markdown formatting if Gemini included it despite instructions
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/, '').replace(/```\n?$/, '').trim();
      }

      const promptsArray = JSON.parse(text);
      if (!Array.isArray(promptsArray) || promptsArray.length !== 5) {
        throw new Error("Invalid format returned from Gemini");
      }
      
      // Immediately run the test
      await runBlindTest(promptsArray);

    } catch (error) {
      console.error("Error generating prompts:", error);
      alert("Failed to generate prompts or parse the response. Check console.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const runBlindTest = async (prompts: string[]) => {
    setIsGeneratingResponses(true);
    setResponses([]);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Assign a different prompt to each profile (up to 5 profiles, if more it will wrap around or break if less)
      // For now, assume profiles.length <= 5 or handle gracefully
      
      const generatePromises = profiles.map(async (profile, idx) => {
        const modelConfig: any = { model: modelId };
        if (profile.systemInstruction) {
          modelConfig.systemInstruction = profile.systemInstruction;
        }
        
        const assignedPrompt = prompts[idx % prompts.length];
        const model = genAI.getGenerativeModel(modelConfig);
        try {
           const result = await model.generateContent(assignedPrompt);
           return {
             profileId: profile.id,
             prompt: assignedPrompt,
             content: result.response.text()
           };
        } catch(e) {
          return {
             profileId: profile.id,
             prompt: assignedPrompt,
             content: "Error generating response: " + (e as Error).message
           };
        }
      });

      const results = await Promise.all(generatePromises);
      
      // Shuffle the results so the user doesn't know which is which
      const shuffled = [...results].sort(() => Math.random() - 0.5);
      setResponses(shuffled);
      
      // Initialize ratings state for this round
      const newRatings: Record<string, RatingCriteria> = {};
      shuffled.forEach(r => { 
        newRatings[r.profileId] = { clarity: 0, depth: 0, engagement: 0, enjoyment: 0, overall: 0 }; 
      });
      setRatings(newRatings);
      
    } catch (error) {
       console.error("Error running test:", error);
       alert("Failed to generate responses. Check console.");
    } finally {
      setIsGeneratingResponses(false);
    }
  };

  const handleRate = (profileId: string, newRatings: RatingCriteria) => {
    setRatings(prev => ({ ...prev, [profileId]: newRatings }));
  };

  const areAllCurrentCardRatingsFilled = () => {
    if (responses.length === 0) return false;
    const currentProfileId = responses[currentCardIndex].profileId;
    const r = ratings[currentProfileId];
    if (!r) return false;
    return r.clarity > 0 && r.depth > 0 && r.engagement > 0 && r.enjoyment > 0 && r.overall > 0;
  };

  const areAllRatingsFilled = () => {
    if (responses.length === 0) return false;
    return responses.every(r => {
      const crit = ratings[r.profileId];
      if (!crit) return false;
      return crit.clarity > 0 && crit.depth > 0 && crit.engagement > 0 && crit.enjoyment > 0 && crit.overall > 0;
    });
  };

  const handleSubmitRound = () => {
    if (!areAllRatingsFilled()) {
      alert("Please rate all criteria for all responses before continuing.");
      return;
    }

    // Accumulate total scores
    const newTotalScores = { ...totalScores };
    Object.keys(ratings).forEach(id => {
      if (!newTotalScores[id]) {
        newTotalScores[id] = { clarity: 0, depth: 0, engagement: 0, enjoyment: 0, overall: 0 };
      }
      const r = ratings[id];
      newTotalScores[id].clarity += r.clarity;
      newTotalScores[id].depth += r.depth;
      newTotalScores[id].engagement += r.engagement;
      newTotalScores[id].enjoyment += r.enjoyment;
      newTotalScores[id].overall += r.overall;
    });
    setTotalScores(newTotalScores);

    const promptsMap: Record<string, string> = {};
    const responsesMap: Record<string, string> = {};
    responses.forEach(r => {
      promptsMap[r.profileId] = r.prompt;
      responsesMap[r.profileId] = r.content;
    });

    // Save history
    const roundResult: ExperimentRoundResult = {
      round,
      ratings: { ...ratings },
      prompts: promptsMap,
      responses: responsesMap
    };
    
    const newHistory = [...history, roundResult];
    setHistory(newHistory);

    if (round < 5) {
      // Move to next round
      setRound(prev => prev + 1);
      setTopic(''); // Optional: clear topic or keep it for the next round
      setResponses([]);
      setRatings({});
      setCurrentCardIndex(0);
    } else {
      // Complete experiment
      setIsComplete(true);
      
      const record: ExperimentRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        topic: topic,
        modelId,
        rounds: newHistory,
        totalScores: newTotalScores
      };
      
      onExperimentComplete(record);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < responses.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  if (isComplete) {
    return (
       <ExperimentResults 
         scores={totalScores} 
         roundHistory={history} 
         onGoHome={() => onExperimentComplete(null as any)} 
       />
    );
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
            <span className="bg-emerald-100 text-emerald-800 text-lg font-bold px-3 py-1 rounded-full">{round} / 5</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8 flex flex-col gap-6">
        
        {/* Step 1: Topic Selection */}
        {!isGeneratingPrompt && !isGeneratingResponses && responses.length === 0 && (
          <TopicSelector onStartExperiment={handleStartExperiment} disabled={isGeneratingPrompt} apiKey={apiKey} />
        )}

        {(isGeneratingPrompt || isGeneratingResponses) && (
           <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 gap-6 animate-pulse">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {isGeneratingPrompt ? "Generating Educational Prompts..." : "Simulating AI Personalities..."}
                </h3>
                <p className="text-sm">
                  {isGeneratingPrompt 
                    ? `Creating 5 distinct educational scenarios for "${topic}"` 
                    : `Running ${profiles.length} distinct personality profiles in parallel`}
                </p>
              </div>
           </div>
        )}

        {/* Step 2: Blind Rating (Card Slider UI) */}
        {responses.length > 0 && !isGeneratingResponses && (
          <div className="flex flex-col gap-6 animate-fade-in relative min-h-[600px]">
            
            {/* Card Slider Controls & Indicators */}
            <div className="flex justify-between items-center px-4">
              <span className="text-sm font-medium text-slate-500">
                Response {currentCardIndex + 1} of {responses.length}
              </span>
              <div className="flex gap-2">
                {responses.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all ${idx === currentCardIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-300'}`} 
                  />
                ))}
              </div>
            </div>

            {/* The Current Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col max-h-[75vh] relative">

              {/* Scrollable Card Content */}
              <div className="flex-1 overflow-y-auto">
                
                {/* Top: Title & Response Content */}
                <div className="p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">{topic}</h2>
                  <div className="prose prose-sm md:prose-base prose-slate max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: responses[currentCardIndex].content.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>

                {/* Bottom: Criteria Rating */}
                <div className="bg-slate-50/50 p-6 lg:p-8 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Rate this response</h3>
                  <div className="max-w-2xl mx-auto">
                    <CriteriaRating 
                      initialRatings={ratings[responses[currentCardIndex].profileId]}
                      onRate={(newRatings) => handleRate(responses[currentCardIndex].profileId, newRatings)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl font-medium transition-all hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous Response
              </button>

              {currentCardIndex < responses.length - 1 ? (
                <button 
                  onClick={handleNextCard}
                  disabled={!areAllCurrentCardRatingsFilled()}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium transition-all hover:bg-slate-900 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Response
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmitRound}
                  disabled={!areAllRatingsFilled()}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 flex items-center gap-2"
                >
                  {round < 5 ? "Submit Ratings & Next Round" : "Submit Final Ratings & View Results"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}