import { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { generateRandomTopic } from '../../lib/gemini';

interface TopicSelectorProps {
  onStartExperiment: (topic: string, wordLimit: number) => void;
  disabled?: boolean;
  apiKey: string;
}

export function TopicSelector({ onStartExperiment, disabled, apiKey }: TopicSelectorProps) {
  const [topic, setTopic] = useState('');
  const [wordLimit, setWordLimit] = useState(120);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRandom = async () => {
    if (!apiKey) {
      alert("Please enter an API key first.");
      return;
    }
    setIsGenerating(true);
    try {
      const randomTopic = await generateRandomTopic(apiKey);
      setTopic(randomTopic);
    } catch (e) {
      console.error(e);
      alert("Failed to generate a random topic.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStart = () => {
    if (topic.trim()) {
      onStartExperiment(topic.trim(), wordLimit);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-emerald-500" />
        Choose an Experiment Topic
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What concept should the AI personalities explain?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The philosophical implications of artificial gravity"
              disabled={disabled || isGenerating}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleGenerateRandom}
              disabled={disabled || isGenerating || !apiKey}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              title="Generate a random topic using Gemini"
            >
              <Wand2 className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Random Topic"}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Word Limit per Response</label>
          <input
            type="number"
            min="10"
            max="1000"
            value={wordLimit}
            onChange={(e) => setWordLimit(parseInt(e.target.value) || 120)}
            disabled={disabled}
            className="w-1/3 min-w-[120px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={disabled || !topic.trim()}
          className="w-full mt-6 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all shadow-sm"
        >
          Start Experiment
        </button>
      </div>
    </div>
  );
}
