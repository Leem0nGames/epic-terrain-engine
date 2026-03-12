'use client';

import React, { useState, useMemo } from 'react';
import { TERRAIN_REGISTRY } from '../lib/terrain/TerrainRegistry';
import { PixiHexGridRenderer } from '../components/PixiHexGridRenderer';
import { GameActionBar } from '../components/GameActionBar';
import { UnitPanel } from '../components/UnitPanel';
import { MapGenerator } from '../lib/terrain/MapGenerator';
import { TectonicMapGenerator } from '../lib/terrain/TectonicMapGenerator';
import { TerrainResolver } from '../lib/terrain/TerrainResolver';
import { TransitionResolver } from '../lib/terrain/TransitionResolver';
import { OverlayResolver } from '../lib/terrain/OverlayResolver';
import { HexGrid, HexCell } from '../lib/hex/HexGrid';
import { UnitInstance, UNIT_REGISTRY } from '../lib/units/UnitRegistry';

export default function Page() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10000));
  const [debug, setDebug] = useState(false);
  const [useTectonic, setUseTectonic] = useState(false);
  const [units, setUnits] = useState<UnitInstance[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const selectedUnit = units.find(u => u.id === selectedUnitId) || null;

  const mapData = useMemo(() => {
    let grid: HexGrid;
    if (useTectonic) {
      grid = TectonicMapGenerator.generate({ 
        width: 30, 
        height: 20, 
        seed,
        plateCount: 12
      });
    } else {
      grid = MapGenerator.generate({ width: 30, height: 20, seed });
    }
    TerrainResolver.resolve(grid);
    TransitionResolver.resolve(grid);
    OverlayResolver.resolve(grid);
    
    return { grid };
  }, [seed, useTectonic]);

  // Generate units separately from the map
  React.useEffect(() => {
    const grid = mapData.grid;
    const initialUnits: UnitInstance[] = [];
    let playerSpawned = false;
    let enemySpawned = false;

    // Simple spawn logic: find valid grass hexes
    for (const cell of grid.values()) {
      if (cell.terrainCode === 'Gg' && !cell.overlay) {
        if (!playerSpawned && cell.q < 10) {
          initialUnits.push({
            id: 'unit-1',
            typeId: 'elvish-fighter',
            q: cell.q,
            r: cell.r,
            hp: UNIT_REGISTRY['elvish-fighter'].maxHp,
            movementLeft: UNIT_REGISTRY['elvish-fighter'].maxMovement,
            faction: 0
          });
          playerSpawned = true;
        } else if (!enemySpawned && cell.q > 20) {
          initialUnits.push({
            id: 'unit-2',
            typeId: 'orcish-grunt',
            q: cell.q,
            r: cell.r,
            hp: UNIT_REGISTRY['orcish-grunt'].maxHp,
            movementLeft: UNIT_REGISTRY['orcish-grunt'].maxMovement,
            faction: 1
          });
          enemySpawned = true;
        }
      }
      if (playerSpawned && enemySpawned) break;
    }

    setUnits(initialUnits);
  }, [mapData]);

  const { grid } = mapData;

  const handleUnitMove = (unitId: string, path: HexCell[], cost: number) => {
    if (path.length === 0) return;
    
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        const target = path[path.length - 1];
        return {
          ...u,
          q: target.q,
          r: target.r,
          movementLeft: Math.max(0, u.movementLeft - cost)
        };
      }
      return u;
    }));
  };

  const handleUnitAttack = (attackerId: string, defenderId: string) => {
    setUnits(prev => {
      const attacker = prev.find(u => u.id === attackerId);
      const defender = prev.find(u => u.id === defenderId);
      if (!attacker || !defender) return prev;

      const attackerDef = UNIT_REGISTRY[attacker.typeId];
      // Simplified combat: just use the first attack and deal its damage
      const attack = attackerDef.attacks[0]; 
      const damage = attack ? attack.damage * attack.strikes : 5; // Simple math for now

      return prev.map(u => {
        if (u.id === defenderId) {
          return { ...u, hp: Math.max(0, u.hp - damage) };
        }
        if (u.id === attackerId) {
          return { ...u, movementLeft: 0 }; // Attacking ends turn
        }
        return u;
      }).filter(u => u.hp > 0); // Remove dead units
    });
  };

  const endTurn = () => {
    setUnits(prev => prev.map(u => ({
      ...u,
      movementLeft: UNIT_REGISTRY[u.typeId].maxMovement
    })));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Header Bar */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Epic Terrain Engine</h1>
            <p className="text-xs text-slate-400">Procedural Strategy Game</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-400">Turn:</span>
            <span className="text-sm font-mono text-white">1</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-400">Gold:</span>
            <span className="text-sm font-mono text-yellow-400">100</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSeed(Math.floor(Math.random() * 10000))}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Map
          </button>
          <button 
            onClick={() => setUseTectonic(!useTectonic)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              useTectonic 
                ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/25' 
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            {useTectonic ? 'Tectonic' : 'Noise'}
          </button>
          <button 
            onClick={() => setDebug(!debug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              debug 
                ? 'bg-red-600 hover:bg-red-500' 
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            Debug
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-61px)]">
        {/* Left Sidebar - Unit Info */}
        <aside className="w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-800 p-4 overflow-y-auto">
          <UnitPanel unit={selectedUnit} />
        </aside>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-slate-950 z-0">
            <PixiHexGridRenderer 
              grid={grid} 
              size={30} 
              debug={debug} 
            />
          </div>
          
          {/* Mini-map overlay */}
          <div className="absolute bottom-20 left-4 w-36 h-28 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden shadow-xl">
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="text-xs text-slate-500">Mini-map</span>
            </div>
          </div>

          {/* Action Bar */}
          <GameActionBar 
            onEndTurn={endTurn}
            onNewMap={() => setSeed(Math.floor(Math.random() * 10000))}
            onToggleTectonic={() => setUseTectonic(!useTectonic)}
            useTectonic={useTectonic}
            onToggleDebug={() => setDebug(!debug)}
            debug={debug}
          />
        </div>

        {/* Right Sidebar - Minimap & Info */}
        <aside className="w-56 bg-slate-900/50 backdrop-blur-sm border-l border-slate-800 p-4 overflow-y-auto">
          {/* Minimap */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Minimap</h3>
            <div className="w-full aspect-video bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <span className="text-xs text-slate-500">Terrain Overview</span>
              </div>
            </div>
          </div>

          {/* Terrain Legend */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Terrain Types</h3>
            <div className="space-y-1.5">
              {Object.values(TERRAIN_REGISTRY).slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800/50 transition-colors">
                  <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: t.color }} />
                  <div className="flex-1">
                    <div className="text-xs text-slate-300">{t.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Stats */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Game Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-300">Player 1</span>
                </div>
                <span className="text-xs font-mono text-white">1 unit</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-slate-300">Player 2</span>
                </div>
                <span className="text-xs font-mono text-white">1 unit</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Controls</h3>
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Camera</span>
                <span className="font-mono text-slate-400">Drag / WASD</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zoom</span>
                <span className="font-mono text-slate-400">Scroll</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Select</span>
                <span className="font-mono text-slate-400">Click</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
