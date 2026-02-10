
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InspirationEntry } from '../types';
import { Tape, Pin, Clip, Washi } from './Decorations';
import { X, Copy } from 'lucide-react';

interface PolaroidCardProps {
  entry: InspirationEntry;
  onDeleteTag: (entryId: string, tag: string) => void;
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({ entry, onDeleteTag }) => {
  const [isHovered, setIsHovered] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderDecor = () => {
    switch (entry.decorType) {
      case 'tape': return <Tape />;
      case 'pin': return <Pin />;
      case 'clip': return <Clip />;
      case 'washi': return <Washi />;
      default: return null;
    }
  };

  return (
    <div 
      className="relative w-full group mb-12 inline-block break-inside-avoid overflow-visible" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      style={{ backfaceVisibility: 'hidden' }}
    >
      {renderDecor()}
      
      <motion.div
        layout="position" // Crucial: prevents pixel blurring by animating position only
        style={{ 
          rotate: entry.rotation,
          willChange: 'transform'
        }}
        className="bg-white dark:bg-stone-800 p-3 pb-4 shadow-xl border border-stone-200 dark:border-stone-700 w-full transition-shadow hover:shadow-2xl hover:z-20 cursor-default"
      >
        <div className="w-full bg-stone-100 dark:bg-stone-900 overflow-hidden mb-3 border border-stone-200 dark:border-stone-700 relative group/img">
          <img 
            src={entry.imageUrl} 
            alt="Inspiration" 
            className="w-full h-auto block object-contain transition-transform duration-700 group-hover/img:scale-105" 
          />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors" />
        </div>
        
        <div className="min-h-[40px] flex flex-col justify-center px-1">
          <div className="text-[14px] font-handwriting text-stone-600 dark:text-stone-400 leading-tight mb-2 line-clamp-2">
            {entry.caption || "Awaiting AI curation..."}
          </div>
          
          <div className="h-6">
            {!isHovered && entry.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-stone-700 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
                  {entry.tags[0]}
                </span>
                {entry.tags.length > 1 && (
                  <span className="text-[8px] font-bold text-stone-400 uppercase">
                    +{entry.tags.length - 1} More
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isHovered && entry.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-1/2 -translate-x-1/2 top-[90%] z-40 w-[110%] flex flex-wrap gap-1.5 justify-center"
          >
            {entry.tags.map((tag, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group/tag relative flex items-center px-2 py-1 bg-white/95 dark:bg-stone-900/95 border border-amber-200 dark:border-stone-700 rounded-md text-[10px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 shadow-xl backdrop-blur-md cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/50"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(tag);
                }}
              >
                {tag}
                <div className="ml-1.5 flex gap-1 items-center opacity-0 group-hover/tag:opacity-100 transition-opacity">
                  <Copy size={10} className="text-amber-400" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTag(entry.id, tag);
                    }}
                    className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-stone-300 hover:text-red-500"
                  >
                    <X size={10} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
