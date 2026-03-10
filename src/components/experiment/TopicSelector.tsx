import { useState } from 'react';

const PREDEFINED_TOPICS = {
  'Philosophy': ['Modern Philosophy', 'Ethics', 'Existentialism', 'Ancient Greek Philosophy'],
  'Science': ['Quantum Physics', 'Astrophysics', 'Biology', 'Neuroscience'],
  'Creative Writing': ['Sci-Fi Story', 'Fantasy Worldbuilding', 'Poetry', 'Character Development'],
  'Literature': ['Classic Novels', 'Modern Poetry', 'Literary Analysis', 'Shakespeare'],
  'Technology': ['Artificial Intelligence', 'Cybersecurity', 'Software Engineering', 'Future Tech']
};

interface TopicSelectorProps {
  onSelect: (topic: string, subtopic: string) => void;
  disabled?: boolean;
}

export function TopicSelector({ onSelect, disabled }: TopicSelectorProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedTopic, setSelectedTopic] = useState(Object.keys(PREDEFINED_TOPICS)[0]);
  const [selectedSubtopic, setSelectedSubtopic] = useState(PREDEFINED_TOPICS[Object.keys(PREDEFINED_TOPICS)[0] as keyof typeof PREDEFINED_TOPICS][0]);
  
  const [customTopic, setCustomTopic] = useState('');
  const [customSubtopic, setCustomSubtopic] = useState('');

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTopic = e.target.value;
    setSelectedTopic(newTopic);
    setSelectedSubtopic(PREDEFINED_TOPICS[newTopic as keyof typeof PREDEFINED_TOPICS][0]);
  };

  const handleConfirm = () => {
    if (mode === 'preset') {
      onSelect(selectedTopic, selectedSubtopic);
    } else {
      if (customTopic.trim() && customSubtopic.trim()) {
        onSelect(customTopic.trim(), customSubtopic.trim());
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Choose a Topic</h3>
      
      <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setMode('preset')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            mode === 'preset' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pre-defined
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            mode === 'custom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Custom Input
        </button>
      </div>

      <div className="space-y-4">
        {mode === 'preset' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <select
                value={selectedTopic}
                onChange={handleTopicChange}
                disabled={disabled}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(PREDEFINED_TOPICS).map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtopic</label>
              <select
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PREDEFINED_TOPICS[selectedTopic as keyof typeof PREDEFINED_TOPICS].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Custom Topic</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g., Music Theory"
                disabled={disabled}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Custom Subtopic</label>
              <input
                type="text"
                value={customSubtopic}
                onChange={(e) => setCustomSubtopic(e.target.value)}
                placeholder="e.g., Jazz Harmony"
                disabled={disabled}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <button
          onClick={handleConfirm}
          disabled={disabled || (mode === 'custom' && (!customTopic.trim() || !customSubtopic.trim()))}
          className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          Generate Prompt
        </button>
      </div>
    </div>
  );
}
