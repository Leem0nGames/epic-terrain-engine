'use client';

import React from 'react';
import { UnitInstance, UNIT_REGISTRY } from '../lib/units/UnitRegistry';

interface UnitPanelProps {
  unit: UnitInstance | null;
}

export function UnitPanel({ unit }: UnitPanelProps) {
  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">No Unit Selected</h3>
        <p className="text-sm text-slate-500">Click on a unit to view details</p>
      </div>
    );
  }

  const unitDef = UNIT_REGISTRY[unit.typeId];

  return (
    <div className="space-y-4">
      {/* Unit Header */}
      <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="relative">
          <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-600">
            <img 
              src={unitDef.sprite} 
              alt={unitDef.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
            unit.faction === 0 ? 'bg-blue-500' : 'bg-red-500'
          }`}>
            {unit.faction + 1}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{unitDef.name}</h2>
          <p className="text-xs text-slate-400 capitalize">{unitDef.alignment}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Health</span>
            <span className="font-mono text-white">{unit.hp} / {unitDef.maxHp}</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                unit.hp / unitDef.maxHp > 0.5 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                  : 'bg-gradient-to-r from-red-500 to-orange-400'
              }`}
              style={{ width: `${(unit.hp / unitDef.maxHp) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Movement</span>
            <span className="font-mono text-white">{unit.movementLeft} / {unitDef.maxMovement}</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
              style={{ width: `${(unit.movementLeft / unitDef.maxMovement) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Attacks */}
      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Attacks</h3>
        <div className="space-y-2">
          {unitDef.attacks.map((attack, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm text-slate-200 capitalize">{attack.name}</span>
              </div>
              <span className="font-mono text-sm">
                <span className="text-red-400">{attack.damage}</span>
                <span className="text-slate-500">x</span>
                <span className="text-slate-300">{attack.strikes}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Unit Info */}
      <div className="pt-4 border-t border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Unit Info</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-800/30 rounded">
            <span className="text-slate-500">ID:</span>
            <span className="text-slate-300 ml-1">{unitDef.id}</span>
          </div>
          <div className="p-2 bg-slate-800/30 rounded">
            <span className="text-slate-500">Alignment:</span>
            <span className="text-slate-300 ml-1 capitalize">{unitDef.alignment}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
