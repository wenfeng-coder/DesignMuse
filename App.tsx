
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addWeeks, addDays } from 'date-fns';
import { 
  X, Plus, ChevronLeft, ChevronRight, Moon, Sun, 
  StickyNote, CloudCheck, RefreshCw, AlertCircle, 
  Terminal, ExternalLink, Settings, Bug, ShieldAlert, 
  Rocket, Database, Save, Globe
} from 'lucide-react';
import { WeeklyData } from './types';
import { getWeekId, getWeekRangeDisplay, getDayKey, getRandomDecor, getRandomRotation, fileToBase64 } from './utils';
import { analyzeDailyInspirations } from './services/geminiService';
import { PolaroidCard } from './components/PolaroidCard';
import { CONFIG } from './config';
// --- 强制调试：看看变量到底在不在 ---
console.log("检查变量:", import.meta.env.VITE_API_URL);
if (!import.meta.env.VITE_API_URL) {
  alert("❌ 错误：在当前的预览环境中，VITE_API_URL 依然是 undefined！");
} else {
  alert("✅ 变量读取成功，地址为: " + import.meta.env.VITE_API_URL);
}
const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weeklyEntries, setWeeklyEntries] = useState<{ [weekId: string]: WeeklyData }>({});
  const [weeklyNotes, setWeeklyNotes] = useState<{ [weekId: string]: string }>({});
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('designMuseDarkMode') === 'true');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Debug UI State
  const [manualUrlInput, setManualUrlInput] = useState(localStorage.getItem('DEBUG_VITE_API_URL') || '');
  const [isConfigMissing, setIsConfigMissing] = useState(!CONFIG.API_BASE);
  const [showDebug, setShowDebug] = useState(!CONFIG.API_BASE);
  const [error, setError] = useState<{ type: 'config' | 'network' | 'server' | 'mixed'; message: string; details?: string } | null>(null);
  
  const weekId = getWeekId(currentDate);
  const currentWeekData = weeklyEntries[weekId] || {};
  const currentNotes = weeklyNotes[weekId] || "";

  const fetchWeeklyData = useCallback(async (wid: string) => {
    const apiBase = CONFIG.API_BASE;
    if (!apiBase) {
      setIsConfigMissing(true);
      return;
    }
    
    setIsSyncing(true);
    try {
      const res = await fetch(`${apiBase}/weekly/${wid}`);
      if (!res.ok) throw new Error(`SERVER_ERROR:${res.status}`);
      const data = await res.json();
      
      const structuredEntries: WeeklyData = {};
      data.entries.forEach((e: any) => {
        if (!structuredEntries[e.dayKey]) structuredEntries[e.dayKey] = { entries: [] };
        structuredEntries[e.dayKey].entries.push(e);
      });
      
      setWeeklyEntries(prev => ({ ...prev, [wid]: structuredEntries }));
      setWeeklyNotes(prev => ({ ...prev, [wid]: data.notes }));
      setError(null);
    } catch (err: any) {
      console.error("Fetch failed:", err);
      setError({ 
        type: 'network', 
        message: "后端连接失败", 
        details: `无法访问 ${apiBase}。请确认后端服务已启动并正确配置 CORS。` 
      });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { 
    fetchWeeklyData(weekId); 
  }, [weekId, fetchWeeklyData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('designMuseDarkMode', String(isDarkMode));
    window.dispatchEvent(new Event('resize'));
  }, [isDarkMode]);

  const handleManualUrlSave = () => {
    if (manualUrlInput) {
      localStorage.setItem('DEBUG_VITE_API_URL', manualUrlInput);
      window.location.reload(); // Reload to apply the new debug URL
    }
  };

  const handleFileUpload = async (dayKey: string, file: File) => {
    const apiBase = CONFIG.API_BASE;
    if (!apiBase) return;

    const base64 = await fileToBase64(file);
    const entryData = {
      weekId,
      dayKey,
      imageUrl: base64,
      decorType: getRandomDecor(),
      rotation: Math.floor(getRandomRotation()),
      tags: [],
      caption: "AI 正在分析中...",
      orientation: 'square'
    };

    setIsSyncing(true);
    try {
      const res = await fetch(`${apiBase}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });
      const savedEntry = await res.json();

      setWeeklyEntries(prev => {
        const week = prev[weekId] || {};
        const day = week[dayKey] || { entries: [] };
        return {
          ...prev,
          [weekId]: { ...week, [dayKey]: { ...day, entries: [...day.entries, savedEntry] } }
        };
      });

      // Analyze with Gemini
      const currentDayEntries = [...(weeklyEntries[weekId]?.[dayKey]?.entries || []), savedEntry];
      const analysis = await analyzeDailyInspirations(currentDayEntries.map(e => e.imageUrl), dayKey);
      
      const aiResult = analysis.images_analysis.find(ai => ai.image_index === currentDayEntries.length - 1);
      if (aiResult) {
        await fetch(`${apiBase}/entries/${savedEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tags: aiResult.tags, 
            orientation: aiResult.orientation,
            caption: analysis.day_summary.title_zh
          })
        });
        fetchWeeklyData(weekId);
      }
    } catch (err) {
      console.error("Upload failed", err);
      setError({ type: 'network', message: "上传同步失败" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNoteChange = useCallback(async (content: string) => {
    setWeeklyNotes(prev => ({ ...prev, [weekId]: content }));
    const apiBase = CONFIG.API_BASE;
    if (!apiBase) return;
    
    // Simple debounce would be better here, but using direct call for now
    try {
      await fetch(`${apiBase}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, content }),
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  }, [weekId]);

  const start = startOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="min-h-screen paper-texture transition-colors duration-500 bg-amber-50 dark:bg-[#1a1410] font-body">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col min-h-screen">
        
        {/* Diagnostic / Debug Overlay */}
        <AnimatePresence>
          {showDebug && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-white dark:bg-stone-900 w-full max-w-xl p-10 rounded-[3rem] shadow-2xl border-8 border-amber-200 dark:border-amber-900/50 overflow-hidden grid-paper"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-amber-600 p-3 rounded-2xl shadow-lg">
                    <Settings className="text-white" size={32} />
                  </div>
                  <h2 className="text-3xl font-handwriting text-amber-900 dark:text-amber-100">环境变量诊断中心</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-stone-50 dark:bg-stone-950/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 font-mono text-xs space-y-2">
                    <div className="flex justify-between border-b border-stone-100 dark:border-stone-900 pb-1">
                      <span className="text-stone-400">VITE_API_URL:</span>
                      <span className={CONFIG.DIAGNOSTICS.rawViteEnv === 'MISSING' ? 'text-red-500 font-bold' : 'text-green-600'}>
                        {CONFIG.DIAGNOSTICS.rawViteEnv}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 dark:border-stone-900 pb-1">
                      <span className="text-stone-400">BUILD DEFINE:</span>
                      <span className="text-amber-600">{CONFIG.DIAGNOSTICS.definedVal}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 dark:border-stone-900 pb-1">
                      <span className="text-stone-400">CURRENT PROTOCOL:</span>
                      <span className="text-blue-500 font-bold">{CONFIG.DIAGNOSTICS.protocol}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border-2 border-dashed border-amber-200">
                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Database size={14} /> 紧急手动覆盖 (Local Storage Override)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={manualUrlInput} 
                        onChange={(e) => setManualUrlInput(e.target.value)}
                        placeholder="https://your-backend.vercel.app" 
                        className="flex-1 bg-white dark:bg-stone-800 border-2 border-amber-100 dark:border-stone-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <button 
                        onClick={handleManualUrlSave}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg"
                      >
                        <Save size={18} /> 应用
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] text-stone-500 italic">保存后页面将自动刷新。该设置仅在当前浏览器生效。</p>
                  </div>

                  <button 
                    onClick={() => setShowDebug(false)}
                    className="w-full py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-[0.3em] text-xs transition-colors"
                  >
                    暂时关闭诊断窗口
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex items-center justify-between mb-8 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md p-4 rounded-3xl border border-amber-100/50 dark:border-amber-900/30 sticky top-4 z-40">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-handwriting text-amber-900 dark:text-amber-400 rotate-[-2deg]">DesignMuse</h1>
            <div className="flex items-center gap-3 bg-white/80 dark:bg-stone-800/80 px-4 py-1.5 rounded-full shadow-sm border border-amber-100 dark:border-stone-700">
              <button onClick={() => setCurrentDate(addWeeks(currentDate, -1))} className="p-1 hover:bg-amber-50 rounded-full text-amber-800 transition-colors"><ChevronLeft size={20} /></button>
              <span className="text-sm font-bold min-w-[150px] text-center dark:text-amber-100">{getWeekRangeDisplay(currentDate)}</span>
              <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-amber-50 rounded-full text-amber-800 transition-colors"><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowDebug(true)} className="p-2 bg-amber-100 dark:bg-stone-800 text-amber-600 rounded-xl hover:bg-amber-200 transition-colors"><Bug size={20} /></button>
            <div className="text-amber-600 dark:text-amber-500">{isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <CloudCheck size={18} />}</div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-amber-100 dark:bg-stone-800 rounded-xl text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-stone-700 hover:scale-105 transition-transform">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map(i => <DayCard key={i} day={addDays(start, i)} data={currentWeekData[getDayKey(addDays(start, i))]} onClick={() => setSelectedDayKey(getDayKey(addDays(start, i)))} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[3, 4].map(i => <DayCard key={i} day={addDays(start, i)} data={currentWeekData[getDayKey(addDays(start, i))]} onClick={() => setSelectedDayKey(getDayKey(addDays(start, i)))} />)}
            <DayCard day={addDays(start, 5)} isWeekend data={currentWeekData[getDayKey(addDays(start, 5))]} onClick={() => setSelectedDayKey(getDayKey(addDays(start, 5)))} />
          </div>
          <div className="relative group bg-white dark:bg-stone-800/90 rounded-[2.5rem] shadow-lg border border-amber-100 dark:border-amber-900/30 p-10 grid-paper overflow-hidden min-h-[400px]">
             <div className="flex items-center gap-3 mb-6 text-amber-900/30 dark:text-amber-100/10"><StickyNote size={32} /><h2 className="text-3xl font-handwriting">Weekly Reflection</h2></div>
             <textarea value={currentNotes} onChange={(e) => handleNoteChange(e.target.value)} placeholder="记录本周的设计感悟..." className="w-full h-full bg-transparent border-none focus:ring-0 resize-none font-handwriting text-3xl text-stone-700 dark:text-stone-300 placeholder:text-stone-300" />
          </div>
        </main>

        <AnimatePresence>
          {selectedDayKey && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDayKey(null)} className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-[50]" />
              <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 md:p-8 pointer-events-none">
                <motion.div layoutId={`card-${selectedDayKey}`} className="w-full h-full max-w-5xl bg-white dark:bg-[#2a211a] rounded-[3rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative border-4 border-amber-100 dark:border-amber-900/40">
                  <div className="p-10 border-b border-amber-100/50 dark:border-amber-900/30 flex justify-between items-center bg-white/20 dark:bg-stone-800/20 backdrop-blur-md">
                    <h3 className="text-5xl font-handwriting text-amber-900 dark:text-amber-100">{format(new Date(selectedDayKey), 'EEEE, MMM dd')}</h3>
                    <button onClick={() => setSelectedDayKey(null)} className="p-4 bg-white/80 dark:bg-stone-800 rounded-full text-amber-800 transition-all hover:scale-110"><X size={32} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-12 grid-paper no-scrollbar">
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-10">
                      {currentWeekData[selectedDayKey]?.entries.map(entry => (
                        <PolaroidCard key={entry.id} entry={entry} onDeleteTag={() => {}} />
                      ))}
                      <label className="inline-flex w-full aspect-square border-4 border-dashed border-amber-200 dark:border-amber-900/30 rounded-[2rem] flex-col items-center justify-center text-amber-300 dark:text-amber-900/40 hover:bg-amber-50 transition-all cursor-pointer group mb-12">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(selectedDayKey, file);
                        }}/>
                        <Plus size={48} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold uppercase tracking-[0.2em] mt-6">添加灵感</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DayCard = ({ day, isWeekend, data, onClick }: any) => (
  <motion.div layoutId={`card-${getDayKey(day)}`} onClick={onClick} className={`p-6 bg-white dark:bg-stone-800/90 rounded-[2rem] shadow-sm border border-amber-200/50 dark:border-amber-900/30 cursor-pointer hover:shadow-2xl transition-all flex flex-col min-h-[200px] ${isWeekend ? 'bg-amber-50/20' : ''}`}>
    <h3 className="text-3xl font-handwriting text-amber-900 dark:text-amber-100">{isWeekend ? "Weekend" : format(day, 'EEEE')}</h3>
    <p className="text-[12px] font-bold text-amber-700/50 uppercase tracking-widest mb-6">{format(day, 'MMM dd')}</p>
    <div className="flex-1 flex items-center justify-center text-amber-200/30">
      {data?.entries.length ? <span className="text-5xl font-handwriting text-amber-600">({data.entries.length})</span> : <Plus size={32} className="opacity-20" />}
    </div>
  </motion.div>
);

export default App;
