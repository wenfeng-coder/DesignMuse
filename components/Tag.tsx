
import React from 'react';
import { motion } from 'framer-motion';

interface TagProps {
  en: string;
  zh: string;
  onDelete: () => void;
  onClick: () => void;
}

export const Tag: React.FC<TagProps> = ({ en, zh, onDelete, onClick }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, x: 5 }}
      className="group relative inline-flex items-center px-3 py-1.5 bg-white/90 dark:bg-stone-800/90 border border-amber-200/50 dark:border-stone-700 rounded-sm text-[11px] font-medium cursor-pointer shadow-sm hover:shadow-md transition-all whitespace-nowrap gap-2 backdrop-blur-sm"
      onClick={onClick}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-stone-800 dark:text-stone-100 font-bold uppercase tracking-wide">{en}</span>
        <span className="text-stone-400 dark:text-stone-500 text-[9px]">{zh}</span>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};
