
import React from 'react';

export const Tape: React.FC = () => (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-amber-200/40 backdrop-blur-sm rotate-2 z-10 border-l border-r border-amber-300/30"></div>
);

export const Pin: React.FC = () => (
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-md z-10 flex items-center justify-center">
    <div className="w-1 h-1 bg-white/50 rounded-full"></div>
  </div>
);

export const Clip: React.FC = () => (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-10 bg-zinc-400 rounded-t-lg border-2 border-zinc-500 z-10 shadow-sm">
    <div className="absolute top-2 left-1 right-1 h-1 bg-zinc-600 rounded"></div>
  </div>
);

export const Washi: React.FC = () => (
  <div className="absolute -top-3 left-4 w-12 h-6 bg-orange-300/50 -rotate-12 z-10 border-b border-orange-400/20"></div>
);
