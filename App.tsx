
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addWeeks, addDays } from 'date-fns';
import { X, Plus, ChevronLeft, ChevronRight, Moon, Sun, StickyNote, CloudCheck, RefreshCw } from 'lucide-react';
import { WeeklyData, InspirationEntry } from './types';
import { getWeekId, getWeekRangeDisplay, getDayKey, getRandomDecor, getRandomRotation, fileToBase64 } from './utils';
import { analyzeDailyInspirations } from './services/geminiService';
import { PolaroidCard } from './components/PolaroidCard';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001/api';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weeklyEntries, setWeeklyEntries] = useState<{ [weekId: string]: WeeklyData }>({});
  const [weeklyNotes, setWeeklyNotes] = useState<{ [weekId: string]: string }>({});
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('designMuseDarkMode') === 'true');
  const [noteHeight, setNoteHeight] = useState(300);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const weekId = getWeekId(currentDate);
  const currentWeekData = weeklyEntries[weekId] || {};
  const currentNotes = weeklyNotes[weekId] || "";

  // 1. 数据同步逻辑
  const fetchWeeklyData = useCallback(async (wid: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/weekly/${wid}`);
      const data = await res.json();
      
      const structuredEntries: WeeklyData = {};
      data.entries.forEach((e: any) => {
        if (!structuredEntries[e.dayKey]) structuredEntries[e.dayKey] = { entries: [] };
        structuredEntries[e.dayKey].entries.push(e);
      });
      
      setWeeklyEntries(prev => ({ ...prev, [wid]: structuredEntries }));
      setWeeklyNotes(prev => ({ ...prev, [wid]: data.notes }));
    } catch (err) {
      console.warn("API fallback to local", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { fetchWeeklyData(weekId); }, [weekId, fetchWeeklyData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('designMuseDarkMode', String(isDarkMode));
    window.dispatchEvent(new Event('resize'));
  }, [isDarkMode]);

  // 2. 修复自动退出：文件上传
  const handleFileUpload = async (dayKey: string, file: File) => {
    const base64 = await fileToBase64(file);
    const tempId = Math.random().toString(36).substring(7);
    
    const entryData = {
      weekId,
      dayKey,
      imageUrl: base64,
      decorType: getRandomDecor(),
      rotation: Math.floor(getRandomRotation()),
      tags: [],
      caption: "Analyzing...",
      orientation: 'square'
    };

    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/entries`, {
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

      // AI 分析
      const currentDayEntries = [...(weeklyEntries[weekId]?.[dayKey]?.entries || []), savedEntry];
      const analysis = await analyzeDailyInspirations(currentDayEntries.map(e => e.imageUrl), dayKey);
      
      const aiResult = analysis.images_analysis.find(ai => ai.image_index === currentDayEntries.length - 1);
      if (aiResult) {
        await fetch(`${API_BASE}/entries/${savedEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tags: aiResult.tags, 
            orientation: aiResult.orientation,
            caption: analysis.day_summary.title_zh
          })
        });
        fetchWeeklyData(weekId); // 重新拉取以更新分析结果
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNoteChange = async (val: string) => {
    setWeeklyNotes(prev => ({ ...prev, [weekId]: val }));
    // 防抖保存
    setTimeout(async () => {
      await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, content: val })
      });
    }, 1000);
  };

  const start = startOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="min-h-screen paper-texture selection:bg-amber-200 selection:text-amber-900 transition-colors duration-500 bg-amber-50 dark:bg-[#1a1410]">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col min-h-screen">
        
        <header className="flex items-center justify-between mb-8 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md p-4 rounded-3xl border border-amber-100/50 dark:border-amber-900/30 sticky top-4 z-40">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-handwriting text-amber-900 dark:text-amber-400 rotate-[-2deg]">DesignMuse</h1>
            <div className="flex items-center gap-3 bg-white/80 dark:bg-stone-800/80 px-4 py-1.5 rounded-full shadow-sm border border-amber-100 dark:border-stone-700">
              <button onClick={() => setCurrentDate(addWeeks(currentDate, -1))} className="p-1 hover:bg-amber-50 rounded-full text-amber-800 dark:text-amber-300"><ChevronLeft size={20} /></button>
              <span className="text-sm font-bold min-w-[150px] text-center dark:text-amber-100">{getWeekRangeDisplay(currentDate)}</span>
              <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-amber-50 rounded-full text-amber-800 dark:text-amber-300"><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-amber-600 dark:text-amber-500 transition-opacity duration-300">
              {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <CloudCheck size={18} />}
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-amber-100 dark:bg-stone-800 rounded-xl text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-stone-700">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* 3-Row Grid */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
            {[0, 1, 2].map(i => <DayCard key={i} day={addDays(start, i)} data={currentWeekData[getDayKey(addDays(start, i))]} onClick={() => setSelectedDayKey(getDayKey(addDays(start, i)))} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
            {[3, 4].map(i => <DayCard key={i} day={addDays(start, i)} data={currentWeekData[getDayKey(addDays(start, i))]} onClick={() => setSelectedDayKey(getDayKey(addDays(start, i)))} />)}
            <DayCard day={addDays(start, 5)} isWeekend data={currentWeekData[getDayKey(addDays(start, 5))]} onClick={() => setSelectedDayKey(getDayKey(addDays(start, 5)))} />
          </div>
          <div className="relative group bg-white dark:bg-stone-800/90 rounded-3xl shadow-lg border border-amber-100 dark:border-amber-900/30 p-8 grid-paper overflow-hidden">
             <div className="flex items-center gap-3 mb-4 text-amber-900/30 dark:text-amber-100/10"><StickyNote size={24} /><h2 className="text-2xl font-handwriting">Weekly Reflection</h2></div>
             <textarea value={currentNotes} onChange={(e) => handleNoteChange(e.target.value)} placeholder="Write down your thoughts..." className="w-full bg-transparent border-none focus:ring-0 resize-none font-handwriting text-2xl text-stone-700 dark:text-stone-300" style={{ height: noteHeight }} />
          </div>
        </div>

        <AnimatePresence>
          {selectedDayKey && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDayKey(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]" />
              <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 md:p-8 pointer-events-none">
                <motion.div layoutId={`card-${selectedDayKey}`} className="w-full h-full max-w-5xl bg-white dark:bg-[#2a211a] rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative border border-amber-100 dark:border-amber-900/40">
                  <div className="p-8 border-b border-amber-100/50 dark:border-amber-900/30 flex justify-between items-center bg-white/20 dark:bg-stone-800/20 backdrop-blur-md">
                    <h3 className="text-4xl font-handwriting text-amber-900 dark:text-amber-100">{format(new Date(selectedDayKey), 'EEEE, MMM dd')}</h3>
                    <button onClick={() => setSelectedDayKey(null)} className="p-3 bg-white/80 dark:bg-stone-800 rounded-full text-amber-800 dark:text-amber-200"><X size={24} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 grid-paper no-scrollbar">
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
                      {currentWeekData[selectedDayKey]?.entries.map(entry => (
                        <PolaroidCard key={entry.id} entry={entry} onDeleteTag={() => {}} />
                      ))}
                      <label 
                        onClick={(e) => e.stopPropagation()} 
                        className="inline-flex w-full aspect-square border-2 border-dashed border-amber-200 dark:border-amber-900/30 rounded-3xl flex-col items-center justify-center text-amber-300 dark:text-amber-900/40 hover:bg-white/50 dark:hover:bg-stone-800/30 transition-all cursor-pointer group mb-12"
                      >
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(selectedDayKey, file);
                        }}/>
                        <Plus size={32} />
                        <span className="text-sm font-bold uppercase tracking-widest mt-4">Add Inspiration</span>
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
  <motion.div layoutId={`card-${getDayKey(day)}`} onClick={onClick} className={`p-5 bg-white dark:bg-stone-800/90 rounded-2xl shadow-sm border border-amber-200/50 dark:border-amber-900/30 cursor-pointer hover:shadow-lg transition-all flex flex-col ${isWeekend ? 'bg-amber-50/20' : ''}`}>
    <h3 className="text-2xl font-handwriting text-amber-900 dark:text-amber-100">{isWeekend ? "Weekend" : format(day, 'EEEE')}</h3>
    <p className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest mb-4">{format(day, 'MMM dd')}</p>
    <div className="flex-1 flex items-center justify-center text-amber-200">
      {data?.entries.length ? <span className="text-4xl font-handwriting">({data.entries.length})</span> : <Plus size={32} />}
    </div>
  </motion.div>
);

export default App;
