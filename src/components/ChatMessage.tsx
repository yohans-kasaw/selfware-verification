import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BotIcon, UserIcon } from './Icons';

interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  loading?: boolean;
}

export function ChatMessage({ role, content, loading }: ChatMessageProps) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex gap-4 items-start w-full max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
         isUser 
           ? 'bg-slate-800 border-slate-700 text-white' 
           : 'bg-blue-100 border-blue-200 text-blue-700'
       }`}>
          {isUser ? <UserIcon /> : <BotIcon className="w-4 h-4" />}
       </div>
       
       <div className={`flex-1 border p-5 shadow-sm max-w-full overflow-hidden ${
         isUser
           ? 'bg-slate-800 border-slate-700 text-slate-100 rounded-2xl rounded-tr-none'
           : 'bg-white border-slate-200 rounded-2xl rounded-tl-none text-slate-800'
       }`}>
         {!isUser && content === '' && loading ? (
           <div className="flex gap-1.5 items-center h-6">
             <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
           </div>
         ) : (
           <div className={`prose prose-sm max-w-none ${
             isUser ? 'prose-invert text-slate-100 whitespace-pre-wrap' : 'prose-slate'
           }`}>
             {isUser ? (
               content
             ) : (
               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                 {content}
               </ReactMarkdown>
             )}
           </div>
         )}
       </div>
    </div>
  );
}
