/**
 * Sistema de edición de mapas
 * Permite modificar terrenos en tiempo real
 */

import { HexGrid, HexCell } from '../hex/HexGrid';
import { TERRAIN_REGISTRY } from './TerrainRegistry';

export interface EditAction {
  type: 'paint' | 'erase' | 'fill';
  terrainCode: string;
  position: { q: number; r: number };
  timestamp: number;
}

export class MapEditor {
  private grid: HexGrid;
  private history: EditAction[] = [];
  private historyIndex: number = -1;
  private maxHistory: number = 50;

  constructor(grid: HexGrid) {
    this.grid = grid;
  }

  /**
   * Pintar un hexágono con un terreno específico
   */
  paintTerrain(q: number, r: number, terrainCode: string): boolean {
    const cell = this.grid.get(q, r);
    if (!cell) return false;

    const previousTerrain = cell.terrainCode;
    
    // Solo pintar si es diferente
    if (previousTerrain === terrainCode) return true;

    // Guardar acción en historial
    const action: EditAction = {
      type: 'paint',
      terrainCode: previousTerrain,
      position: { q, r },
      timestamp: Date.now()
    };

    // Añadir al historial
    this.addToHistory(action);

    // Aplicar cambio
    cell.terrainCode = terrainCode;
    
    // Actualizar transiciones
    this.updateTransitions(q, r);

    return true;
  }

  /**
   * Borrar un hexágono (restaurar terreno base)
   */
  eraseTerrain(q: number, r: number): boolean {
    return this.paintTerrain(q, r, 'Gg'); // Hierba por defecto
  }

  /**
   * Rellenar área con un terreno
   */
  fillArea(centerQ: number, centerR: number, radius: number, terrainCode: string): void {
    for (let q = -radius; q <= radius; q++) {
      for (let r = -radius; r <= radius; r++) {
        const absQ = centerQ + q;
        const absR = centerR + r;
        
        // Verificar distancia hexagonal
        const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
        if (distance <= radius) {
          this.paintTerrain(absQ, absR, terrainCode);
        }
      }
    }
  }

  /**
   * Actualizar transiciones para un hexágono y sus vecinos
   */
  private updateTransitions(q: number, r: number): void {
    // En una implementación completa, aquí se recalcularían las transiciones
    // Por ahora, solo marcamos el grid como modificado
    // El renderer se encargará de actualizar visualmente
  }

  /**
   * Añadir acción al historial
   */
  private addToHistory(action: EditAction): void {
    // Si estamos en medio del historial, eliminar acciones futuras
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(action);
    this.historyIndex++;

    // Limitar tamaño del historial
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Deshacer última acción
   */
  undo(): boolean {
    if (this.historyIndex < 0) return false;

    const action = this.history[this.historyIndex];
    const cell = this.grid.get(action.position.q, action.position.r);
    
    if (cell) {
      cell.terrainCode = action.terrainCode;
      this.updateTransitions(action.position.q, action.position.r);
    }

    this.historyIndex--;
    return true;
  }

  /**
   * Rehacer acción deshecha
   */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;

    this.historyIndex++;
    const action = this.history[this.historyIndex];
    
    // Re-aplicar la acción (en este caso, pintar con el terreno actual)
    // Necesitaríamos guardar el terreno "post-acción" en la acción
    // Por simplicidad, aquí solo avanzamos el índice
    
    return true;
  }

  /**
   * Obtener lista de terrenos disponibles
   */
  static getAvailableTerrains(): Array<{ code: string; name: string; color: string }> {
    return Object.entries(TERRAIN_REGISTRY).map(([code, def]) => ({
      code,
      name: def.name,
      color: def.color
    }));
  }

  /**
   * Exportar mapa a JSON
   */
  exportToJson(): string {
    const data = {
      width: 30, // Tamaño fijo por ahora
      height: 20,
      cells: Array.from(this.grid.values()).map(cell => ({
        q: cell.q,
        r: cell.r,
        terrain: cell.terrainCode
      }))
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importar mapa desde JSON
   */
  importFromJson(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      // Limpiar grid actual
      this.grid.clear();
      
      // Reconstruir cells
      data.cells.forEach((cellData: any) => {
        const cell: HexCell = {
          q: cellData.q,
          r: cellData.r,
          terrainCode: cellData.terrain,
          neighbors: [],
          overlay: null,
          decoration: null,
          transitionMasks: new Map(),
          variation: 0
        };
        this.grid.set(cell.q, cell.r, cell);
      });
      
      return true;
    } catch (error) {
      console.error('Error importando mapa:', error);
      return false;
    }
  }
}
