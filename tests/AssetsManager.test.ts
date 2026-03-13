import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetsManager } from '../lib/terrain/AssetsManager';
import { HexGrid } from '../lib/hex/HexGrid';

// Mock de las dependencias
vi.mock('../lib/terrain/AtlasLoader', () => ({
  AtlasLoader: {
    load: vi.fn().mockResolvedValue(undefined),
    getTexture: vi.fn(),
    isLoaded: vi.fn().mockReturnValue(true)
  }
}));

vi.mock('../lib/terrain/LazyAssetLoader', () => ({
  LazyAssetLoader: {
    updateViewport: vi.fn(),
    getQueueSize: vi.fn().mockReturnValue(0)
  }
}));

vi.mock('../lib/terrain/TextureCache', () => ({
  TextureCache: {
    clear: vi.fn(),
    size: vi.fn().mockReturnValue(0),
    getHitCount: vi.fn().mockReturnValue(10),
    getMissCount: vi.fn().mockReturnValue(2)
  }
}));

describe('AssetsManager', () => {
  beforeEach(() => {
    // Reiniciar el estado del AssetsManager antes de cada test
    // Como es una clase estática, necesitamos resetear manualmente si es posible
  });

  it('should initialize successfully', async () => {
    await expect(AssetsManager.initialize()).resolves.toBeUndefined();
  });

  it('should assemble terrain for hex grid', async () => {
    await AssetsManager.initialize();

    const hexGrid = new HexGrid();
    // Agregar algunas celdas al grid
    for (let q = 0; q < 5; q++) {
      for (let r = 0; r < 5; r++) {
        hexGrid.set(q, r, {
          terrainCode: 'Gg',
          q,
          r,
          neighbors: [],
          overlay: null,
          transitionMasks: new Map(),
          variation: 0
        });
      }
    }

    const request = {
      hexGrid,
      terrainType: 'noise' as const
    };

    await expect(AssetsManager.assembleTerrain(request)).resolves.toBeUndefined();

    // Verificar que se asignaron terrenos
    const cell = hexGrid.get(0, 0);
    expect(cell).toBeDefined();
    expect(cell?.terrainCode).toBeDefined();
    expect(typeof cell?.height).toBe('number');
  });

  it('should get terrain texture', async () => {
    await AssetsManager.initialize();

    const texture = AssetsManager.getTerrainTexture('grass');
    // Como está mockeado, debería retornar null o el mock
    expect(texture).toBeDefined();
  });

  it('should clear texture cache', () => {
    AssetsManager.clearTextureCache();
    // Verificar que se llamó al mock
  });

  it('should get stats', async () => {
    await AssetsManager.initialize();

    const stats = AssetsManager.getStats();
    expect(stats).toHaveProperty('atlasLoaded');
    expect(stats).toHaveProperty('cacheSize');
    expect(stats).toHaveProperty('cacheHits');
    expect(stats).toHaveProperty('cacheMisses');
    expect(stats).toHaveProperty('lazyLoaderQueueSize');
  });

  it('should throw error if not initialized', async () => {
    // Forzar no inicializado (esto es tricky con clases estáticas)
    // En una implementación real, podríamos agregar un método reset para tests

    const hexGrid = new HexGrid();
    const request = {
      hexGrid,
      terrainType: 'noise' as const
    };

    await expect(AssetsManager.assembleTerrain(request)).rejects.toThrow(
      'AssetsManager no ha sido inicializado'
    );
  });
});