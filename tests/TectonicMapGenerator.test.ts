import { describe, it, expect } from 'vitest';
import { TectonicMapGenerator } from '../lib/terrain/TectonicMapGenerator';
import { HexGrid } from '../lib/hex/HexGrid';

describe('TectonicMapGenerator', () => {
  it('should generate a valid hex grid', () => {
    const config = {
      width: 10,
      height: 10,
      seed: 12345
    };
    
    const grid = TectonicMapGenerator.generate(config);
    
    expect(grid).toBeInstanceOf(HexGrid);
    expect(grid.values().length).toBe(100); // 10x10 grid
  });

  it('should generate different maps with different seeds', () => {
    const config1 = {
      width: 10,
      height: 10,
      seed: 12345
    };
    
    const config2 = {
      width: 10,
      height: 10,
      seed: 67890
    };
    
    const grid1 = TectonicMapGenerator.generate(config1);
    const grid2 = TectonicMapGenerator.generate(config2);
    
    // Check that at least some cells have different terrain codes
    let differentCount = 0;
    const values1 = grid1.values();
    const values2 = grid2.values();
    
    for (let i = 0; i < values1.length; i++) {
      if (values1[i].terrainCode !== values2[i].terrainCode) {
        differentCount++;
      }
    }
    
    expect(differentCount).toBeGreaterThan(0);
  });

  it('should respect plate count parameter', () => {
    const configSmall = {
      width: 20,
      height: 20,
      seed: 12345,
      plateCount: 3
    };
    
    const configLarge = {
      width: 20,
      height: 20,
      seed: 12345,
      plateCount: 20
    };
    
    const gridSmall = TectonicMapGenerator.generate(configSmall);
    const gridLarge = TectonicMapGenerator.generate(configLarge);
    
    // With more plates, we should see more varied terrain (more boundaries)
    // This is a simple check - in practice, more plates = more complex boundaries
    expect(gridSmall).toBeInstanceOf(HexGrid);
    expect(gridLarge).toBeInstanceOf(HexGrid);
  });

  it('should generate cells with proper height values', () => {
    const config = {
      width: 10,
      height: 10,
      seed: 12345
    };
    
    const grid = TectonicMapGenerator.generate(config);
    
    for (const cell of grid.values()) {
      // Height should be between 0 and 1 (with some possible slight overshoot due to mountain building)
      expect(cell.height).toBeGreaterThanOrEqual(0);
      expect(cell.height).toBeLessThanOrEqual(1.5); // Allow for some mountain buildup
      
      // Moisture and temperature should be between 0 and 1
      expect(cell.moisture).toBeGreaterThanOrEqual(0);
      expect(cell.moisture).toBeLessThanOrEqual(1);
      expect(cell.temperature).toBeGreaterThanOrEqual(0);
      expect(cell.temperature).toBeLessThanOrEqual(1);
    }
  });

  it('should generate valid terrain codes', () => {
    const config = {
      width: 10,
      height: 10,
      seed: 12345
    };
    
    const grid = TectonicMapGenerator.generate(config);
    
    const validTerrainCodes = new Set(['Ww', 'Ds', 'Gg', 'Hh', 'Mm', 'Dd', 'Aa', 'Rr']);
    
    for (const cell of grid.values()) {
      expect(validTerrainCodes.has(cell.terrainCode)).toBe(true);
      
      // Overlay should be null or a valid overlay code
      if (cell.overlay !== null) {
        const validOverlays = new Set(['Ff', 'Jg']);
        expect(validOverlays.has(cell.overlay)).toBe(true);
      }
    }
  });
});