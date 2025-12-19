
import React, { useState, useRef, useEffect } from 'react';
import { idiomService } from './services/idiomService';
import { dataService } from './services/dataService';
import { cacheService } from './services/cacheService';
import { GameStep, ModuleType, DictionaryWord, CiItem, XiehouyuItem, Idiom } from './types';
import IdiomCard from './components/IdiomCard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModuleType>('jielong');
  const [isDbReady, setIsDbReady] = useState(false);
  const [loadingModules, setLoadingModules] = useState<Record<string, boolean>>({});
  
  // 更新状态
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const [updateProgress, setUpdateProgress] = useState('');

  // 接龙状态
  const [chain, setChain] = useState<GameStep[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [homeSuggestions, setHomeSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 查询模块状态
  const [searchQuery, setSearchQuery] = useState('');
  const [dictResults, setDictResults] = useState<DictionaryWord[]>([]);
  const [ciResults, setCiResults] = useState<CiItem[]>([]);
  const [xieResults, setXieResults] = useState<XiehouyuItem[]>([]);
  const [idiomResults, setIdiomResults] = useState<Idiom[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    idiomService.init().then(() => {
      setIsDbReady(true);
      idiomService.getRandomIdioms(5).then(setHomeSuggestions);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'dictionary') loadModule('word');
    if (activeTab === 'ci') loadModule('ci');
    if (activeTab === 'xiehouyu') loadModule('xiehouyu');
    setSearchQuery('');
    setSuggestions([]);
  }, [activeTab]);

  // 处理接龙模式下的输入建议
  useEffect(() => {
    if (activeTab !== 'jielong' || !inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const lastWord = chain.length > 0 ? chain[chain.length - 1].idiom.word : undefined;
      const lastChar = lastWord ? Array.from(lastWord).pop() : undefined;
      const results = await idiomService.getSuggestions(inputValue, lastChar);
      setSuggestions(results);
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, chain, activeTab]);

  const loadModule = async (type: 'word' | 'ci' | 'xiehouyu') => {
    if (loadingModules[type] === false) return;
    setLoadingModules(prev => ({ ...prev, [type]: true }));
    try {
      await dataService.initModule(type);
      setLoadingModules(prev => ({ ...prev, [type]: false }));
    } catch (e) {
      setLoadingModules(prev => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery) {
        setDictResults([]); setCiResults([]); setXieResults([]); setIdiomResults([]);
        return;
      }
      if (activeTab === 'dictionary') setDictResults(dataService.searchWord(searchQuery));
      if (activeTab === 'ci') setCiResults(dataService.searchCi(searchQuery));
      if (activeTab === 'xiehouyu') setXieResults(dataService.searchXiehouyu(searchQuery));
      if (activeTab === 'idiom_search') {
        const words = await idiomService.getSuggestions(searchQuery);
        const results = await Promise.all(words.map(w => idiomService.getIdiom(w)));
        setIdiomResults(results.filter((r): r is Idiom => r !== null));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    if (activeTab === 'jielong' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chain, activeTab]);

  const handleFullUpdate = async () => {
    setUpdateStatus('updating');
    try {
      setUpdateProgress('正在同步成语库...');
      await idiomService.init(true);
      setUpdateProgress('正在同步字典库...');
      await dataService.initModule('word', true);
      setUpdateProgress('正在同步词语库...');
      await dataService.initModule('ci', true);
      setUpdateProgress('正在同步歇后语库...');
      await dataService.initModule('xiehouyu', true);
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch (e) {
      setUpdateStatus('error');
    }
  };

  const processSubmit = async (word: string) => {
    setIsLoading(true); setError(null); setInputValue(''); setSuggestions([]);
    try {
      const lastWord = chain.length > 0 ? chain[chain.length - 1].idiom.word : undefined;
      const result = await idiomService.validateAndNext(word, lastWord);
      if (!result.isValid) { setError(result.message || "不符合规则哦"); }
      else {
        if (result.userIdiom) setChain(prev => [...prev, { idiom: result.userIdiom!, speaker: 'user', timestamp: Date.now() }]);
        if (result.aiIdiom) setTimeout(() => setChain(prev => [...prev, { idiom: result.aiIdiom!, speaker: 'ai', timestamp: Date.now() + 500 }]), 600);
      }
    } finally { setIsLoading(false); }
  };

  const renderModuleContent = () => {
    if (activeTab === 'jielong') {
      return (
        <div className="flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 hide-scrollbar">
            {chain.length === 0 ? (
              <div className="min-h-full flex flex-col items-center justify-center text-center p-6 animate-slide-up">
                <div className="max-w-md w-full p-8 bg-white rounded-[40px] shadow-xl border border-red-50 relative">
                  <div className="absolute -top-6 -left-4 w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center text-3xl shadow-lg border-4 border-white">🎓</div>
                  <h2 className="text-3xl font-bold text-red-900 mb-4 chinese-serif">成语接龙园</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed">小朋友，我是智慧夫子。<br/>输入一个成语，开始我们的接龙赛吧！</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {homeSuggestions.map(s => (
                      <button key={s} onClick={() => processSubmit(s)} className="px-4 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 rounded-2xl text-sm font-bold transition-all border border-red-100">{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto w-full">
                {chain.map(step => <IdiomCard key={step.timestamp} idiom={step.idiom} speaker={step.speaker} />)}
                {isLoading && (
                  <div className="flex items-center gap-3 text-red-400 p-4 animate-pulse">
                    <div className="flex gap-1"><div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce delay-200"></div></div>
                    <span className="text-xs font-bold uppercase tracking-widest">夫子正在查阅典籍...</span>
                  </div>
                )}
                {error && <div className="p-4 bg-white/60 backdrop-blur rounded-2xl border-2 border-dashed border-red-200 text-red-600 text-center text-sm my-4">{error}</div>}
              </div>
            )}
          </div>
          <footer className="p-4 bg-white/90 backdrop-blur-lg border-t border-red-50 z-20 pb-safe">
            <div className="max-w-2xl mx-auto relative">
              {suggestions.length > 0 && inputValue.length > 0 && (
                <div className="absolute bottom-full mb-4 left-0 right-0 p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-red-50 grid grid-cols-2 gap-1 z-50">
                  {suggestions.slice(0, 6).map(word => (
                    <button key={word} onClick={() => processSubmit(word)} className="px-4 py-3.5 text-sm text-gray-700 hover:bg-red-600 hover:text-white rounded-xl text-left truncate font-bold transition-colors">{word}</button>
                  ))}
                </div>
              )}
              <form onSubmit={e => { e.preventDefault(); processSubmit(inputValue.trim()); }} className="flex gap-2">
                <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={chain.length > 0 ? `接“${chain[chain.length-1].idiom.word.slice(-1)}”开头...` : "输入成语..."} className="flex-1 px-5 py-3.5 rounded-2xl bg-gray-100 border-2 border-transparent focus:border-red-400 outline-none font-medium" />
                <button type="submit" disabled={!inputValue.trim() || isLoading} className="px-6 bg-red-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 disabled:bg-gray-300 transition-transform">接龙</button>
              </form>
            </div>
          </footer>
        </div>
      );
    }

    if (activeTab === 'mine') {
      return (
        <div className="flex flex-col h-full bg-[#FDF6E3] overflow-y-auto p-6 md:p-12 hide-scrollbar">
          <div className="max-w-xl mx-auto w-full space-y-8 animate-slide-up">
            <div className="flex flex-col items-center text-center">
               <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl flex items-center justify-center text-5xl mb-4 border-4 border-red-50">👴</div>
               <h2 className="text-2xl font-bold text-red-900 chinese-serif">智慧夫子</h2>
               <p className="text-gray-400 text-sm mt-1">学海无涯，数据常新</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-50">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-red-500 rounded-full"></span>数据管理中心
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                   <div>
                     <p className="font-bold text-gray-800">全量离线数据库</p>
                     <p className="text-xs text-gray-400 mt-0.5">包含成语、字典、词语及歇后语</p>
                   </div>
                   <button 
                    onClick={handleFullUpdate}
                    disabled={updateStatus === 'updating'}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${
                      updateStatus === 'updating' ? 'bg-gray-100 text-gray-400' : 'bg-red-600 text-white'
                    }`}
                   >
                     {updateStatus === 'updating' ? '更新中...' : '立即同步'}
                   </button>
                </div>
                {updateStatus === 'updating' && (
                  <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-blue-600 font-bold">{updateProgress}</span>
                  </div>
                )}
                {updateStatus === 'success' && (
                  <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-xs font-bold text-center">✅ 同步成功！所有数据已保存至本地。</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-50">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-red-500 rounded-full"></span>关于国学智慧
              </h3>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400">当前版本</span>
                  <span className="font-mono font-bold">v1.2.0</span>
                </div>
                <p>
                  《国学智慧》是一款专为儿童设计的中国传统文化学习工具。我们通过趣味性的成语接龙和全方位的辞海查询，旨在激发孩子们对汉字的兴趣。
                </p>
                <div className="p-4 bg-yellow-50/50 rounded-2xl text-xs italic text-yellow-700">
                  “腹有诗书气自华，最是书香能致远。”
                </div>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-gray-300 uppercase tracking-widest">© 2025 国学智慧开发小组 · 寓教于乐</p>
          </div>
        </div>
      );
    }

    const isLoadingModule = loadingModules[activeTab === 'dictionary' ? 'word' : activeTab === 'ci' ? 'ci' : 'xiehouyu'];
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 glass-panel border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
             <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={`查找${activeTab === 'dictionary' ? '汉字' : activeTab === 'ci' ? '词语' : activeTab === 'xiehouyu' ? '歇后语' : '成语'}...`} className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-gray-100/50 border-2 border-transparent focus:border-blue-400 outline-none transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 hide-scrollbar space-y-4">
          <div className="max-w-2xl mx-auto w-full">
            {isLoadingModule ? (
               <div className="text-center py-20 flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div><p className="text-blue-400 font-bold tracking-widest text-sm">正在整理卷轴...</p></div>
            ) : (
              <>
                {activeTab === 'dictionary' && dictResults.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-blue-50 animate-slide-up mb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-5xl font-bold text-blue-900 chinese-serif">{item.word}</span>
                      <div className="flex flex-col"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold font-mono">{item.pinyin}</span><span className="text-[10px] text-gray-400 mt-1">{item.radicals}部 | {item.strokes}画</span></div>
                    </div>
                    <div className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50/50 p-4 rounded-2xl border border-blue-50/50">{item.explanation}</div>
                  </div>
                ))}
                {activeTab === 'ci' && ciResults.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-purple-50 animate-slide-up mb-4">
                    <div className="text-2xl font-bold text-purple-900 mb-3 chinese-serif">{item.ci}</div>
                    <div className="text-gray-700 text-sm leading-relaxed border-t border-purple-50 pt-3">{item.explanation}</div>
                  </div>
                ))}
                {activeTab === 'xiehouyu' && xieResults.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50 animate-slide-up mb-4 overflow-hidden">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-2"><span className="shrink-0 w-6 h-6 bg-orange-100 text-orange-600 text-[10px] flex items-center justify-center rounded-full font-bold">引</span><div className="text-lg font-bold text-orange-900">{item.riddle}</div></div>
                      <div className="flex items-start gap-2 bg-orange-50/50 p-4 rounded-2xl"><span className="shrink-0 w-6 h-6 bg-orange-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">释</span><div className="text-md text-orange-700 font-bold">{item.answer}</div></div>
                    </div>
                  </div>
                ))}
                {activeTab === 'idiom_search' && idiomResults.map((item, idx) => <div key={idx} className="mb-4"><IdiomCard idiom={item} speaker="ai" /></div>)}
                {searchQuery && !isLoadingModule && ((activeTab==='dictionary' && dictResults.length===0) || (activeTab==='ci' && ciResults.length===0) || (activeTab==='xiehouyu' && xieResults.length===0) || (activeTab==='idiom_search' && idiomResults.length===0)) && <div className="text-center text-gray-400 py-10 italic">没有找到相关内容，换个词试试？</div>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabs: {id: ModuleType, icon: string, label: string}[] = [
    {id: 'jielong', icon: '🏮', label: '接龙'},
    {id: 'dictionary', icon: '📖', label: '字典'},
    {id: 'ci', icon: '📝', label: '词语'},
    {id: 'xiehouyu', icon: '🎭', label: '歇后语'},
    {id: 'idiom_search', icon: '🔍', label: '成语'},
    {id: 'mine', icon: '🏠', label: '我的'},
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto shadow-2xl bg-[#FDF6E3]">
      <header className="px-5 py-4 flex items-center justify-between bg-white border-b border-gray-100 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-red-100">文</div>
          <div>
            <h1 className="text-lg font-bold text-red-900 chinese-serif leading-none tracking-tight">国学智慧</h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Growth Through Classics</p>
          </div>
        </div>
        {activeTab === 'jielong' && chain.length > 0 && (
           <button onClick={() => { setChain([]); setError(null); idiomService.getRandomIdioms(5).then(setHomeSuggestions); }} className="text-xs font-bold text-red-600 bg-red-50 px-3.5 py-1.5 rounded-full border border-red-100 active:scale-95 transition-transform">重新开始</button>
        )}
      </header>
      <main className="flex-1 min-h-0 overflow-hidden relative">{renderModuleContent()}</main>
      <nav className="flex items-center justify-around bg-white border-t border-gray-100 shrink-0 px-1 py-3 shadow-2xl z-40">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1.5 px-2.5 py-1 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-red-50' : 'opacity-40'}`}>
            <span className={`text-xl transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
            <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'text-red-700' : 'text-gray-500'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
