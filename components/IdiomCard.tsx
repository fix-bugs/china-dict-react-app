
import React from 'react';
import { Idiom } from '../types';

interface IdiomCardProps {
  idiom: Idiom;
  speaker: 'user' | 'ai';
}

const IdiomCard: React.FC<IdiomCardProps> = ({ idiom, speaker }) => {
  const isAi = speaker === 'ai';

  return (
    <div className={`flex w-full mb-8 animate-slide-up ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative max-w-[90%] md:max-w-[75%] ${isAi ? 'mr-auto' : 'ml-auto'}`}>
        {/* Speaker Label */}
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1 ${isAi ? 'text-red-500' : 'text-blue-500 flex-row-reverse'}`}>
          <span>{isAi ? '💡 智慧夫子' : '🌟 我的挑战'}</span>
        </div>

        {/* Card Body */}
        <div className={`rounded-3xl p-5 md:p-6 shadow-xl transition-all hover:shadow-2xl ${
          isAi 
            ? 'bg-white border-l-8 border-red-500 rounded-tl-none' 
            : 'bg-blue-50 border-r-8 border-blue-500 rounded-tr-none'
        }`}>
          {/* Idiom Display */}
          <div className="flex flex-col mb-4">
            <h3 className={`text-3xl md:text-4xl font-bold tracking-tighter mb-1 chinese-serif ${isAi ? 'text-red-900' : 'text-blue-900'}`}>
              {idiom.word}
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-mono">
                {idiom.pinyin}
              </span>
              {/* Play Button Icon (Mockup for future TTS) */}
              <button className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 transition-colors">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Meaning */}
            <div className="relative pl-4">
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${isAi ? 'bg-red-200' : 'bg-blue-200'}`}></div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">成语大意</h4>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                {idiom.explanation}
              </p>
            </div>
            
            {/* Origin/Story Story-telling style */}
            <div className={`p-4 rounded-2xl ${isAi ? 'bg-red-50/50' : 'bg-white'}`}>
              <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mb-2">
                <span>📖 成语故事</span>
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed italic">
                “{idiom.derivation}”
              </p>
            </div>

            {idiom.example && (
              <div className="pt-2 border-t border-dashed border-gray-200">
                <p className="text-xs text-gray-400 flex items-start gap-1">
                  <span className="font-bold shrink-0">造句:</span>
                  <span>{idiom.example}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdiomCard;
