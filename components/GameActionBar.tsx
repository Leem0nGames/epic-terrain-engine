'use client';

import React from 'react';

interface GameActionBarProps {
  onEndTurn: () => void;
  onNewMap: () => void;
  onToggleTectonic: () => void;
  useTectonic: boolean;
  onToggleDebug: () => void;
  debug: boolean;
}

interface GameActionBarProps {
  onEndTurn: () => void;
  onNewMap: () => void;
  onToggleTectonic: () => void;
  useTectonic: boolean;
  onToggleDebug: () => void;
  debug: boolean;
  onResetCamera: () => void;
}

export function GameActionBar({ 
  onEndTurn, 
  onNewMap, 
  onToggleTectonic, 
  useTectonic,
  onToggleDebug,
  debug,
  onResetCamera
}: GameActionBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md rounded-full px-6 py-3 border border-slate-700 shadow-2xl">
      {/* Movement Actions */}
      <div className="flex items-center gap-1 pr-4 border-r border-slate-700">
        <button className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
        <button className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Combat Actions */}
      <div className="flex items-center gap-1 px-4 border-r border-slate-700">
        <button className="w-10 h-10 bg-red-600/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
        <button className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>

      {/* Special Actions */}
      <div className="flex items-center gap-1 px-4 border-r border-slate-700">
        <button 
          onClick={onResetCamera}
          className="w-10 h-10 bg-purple-600/80 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all hover:scale-105"
          title="Reset Camera"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l-4 4m0 0l-4-4m4 4V3m0 18a9 9 0 110-18 9 9 0 010 18z" />
          </svg>
        </button>
        <button className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
      </div>

      {/* Main Action Button */}
      <button 
        onClick={onEndTurn}
        className="px-8 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
      >
        <span className="text-sm font-bold tracking-wide">END TURN</span>
      </button>
    </div>
  );
}
