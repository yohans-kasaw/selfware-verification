import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BotIcon, ClearIcon, ErrorIcon, SendIcon, ChatBubbleIcon } from './components/Icons';
import { ChatMessage } from './components/ChatMessage';

interface Profile {
  id: string;
  name: string;
  systemInstruction: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState('none');
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([{ id: 'none', name: 'None (Default)', systemInstruction: '' }]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const modules = import.meta.glob('../personality_profiles/*.md', { query: '?raw', import: 'default', eager: true });
        const loadedProfiles: Profile[] = [{ id: 'none', name: 'None (Default)', systemInstruction: '' }];
        
        for (const path in modules) {
          const content = modules[path] as string;
          const nameMatch = path.match(/\/([^/]+)\.md$/);
          const name = nameMatch ? nameMatch[1] : 'Unknown';
          
          loadedProfiles.push({
            id: name.toLowerCase(),
            name: name,
            systemInstruction: content
          });
        }
        
        setProfiles(loadedProfiles);
      } catch (err) {
        console.error("Failed to load profiles", err);
      }
    };

    loadProfiles();
  }, []);

  const handleClear = () => {
    setMessages([]);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('Please provide a Gemini API Key');
      return;
    }
    const currentPrompt = prompt.trim();
    if (!currentPrompt) {
      setError('Please enter a prompt');
      return;
    }

    setError('');
    setPrompt(''); // Clear input early
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
    setLoading(true);
    
    // Add empty model message to be streamed into
    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const profile = profiles.find(p => p.id === profileId);
      
      const modelConfig: any = { model: "gemini-1.5-pro-latest" };
      if (profile && profile.systemInstruction) {
        modelConfig.systemInstruction = profile.systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelConfig);
      const chatSession = model.startChat({
        history: messages.slice(0, -1).map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });
      
      const result = await chatSession.sendMessageStream(currentPrompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + chunkText
          };
          return newMessages;
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      // Remove the empty model message if it failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BotIcon />
              Gemini UI
            </h1>
            <p className="text-slate-400 text-sm mt-1">Interactive chat with custom personality profiles</p>
          </div>
          
          <button 
            onClick={handleClear}
            disabled={messages.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear Chat"
          >
            <ClearIcon />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Settings Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">API Key</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Personality Profile</label>
            <select 
              value={profileId} 
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm flex items-start gap-3 mx-auto max-w-2xl w-full">
              <ErrorIcon className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {messages.length === 0 && !error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                <ChatBubbleIcon />
              </div>
              <p>Start a conversation with Gemini</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage 
                key={index} 
                role={msg.role} 
                content={msg.content} 
                loading={loading && index === messages.length - 1} 
              />
            ))
          )}
          <div ref={messagesEndRef} className="h-4 shrink-0" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if(prompt.trim()) handleSubmit(e as any);
                  }
                }}
                placeholder="Message Gemini... (Press Enter to send, Shift+Enter for new line)"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none min-h-[52px] max-h-32"
                rows={prompt.split('\n').length > 1 ? Math.min(prompt.split('\n').length, 5) : 1}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !prompt.trim()}
              className="h-[52px] px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Send</span>
                  <SendIcon />
                </div>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;
