/**
 * Gestor central de assets del juego
 * Coordina la carga, gestión y ensamblaje de terrenos y gráficos para el mapa hexagonal
 */

import { AtlasLoader } from './AtlasLoader';
import { LazyAssetLoader, ViewportBounds } from './LazyAssetLoader';
import { TextureCache } from './TextureCache';
import { TERRAIN_REGISTRY } from './TerrainRegistry';
import { HexGrid } from '../hex/HexGrid';

export interface AssetManagerConfig {
  maxConcurrentLoads?: number;
  textureCacheSize?: number;
  enableLazyLoading?: boolean;
}

export interface TerrainAssemblyRequest {
  hexGrid: HexGrid;
  viewport?: ViewportBounds;
  terrainType?: 'noise' | 'tectonic';
}

export class AssetsManager {
  private static initialized = false;
  private static config: AssetManagerConfig = {
    maxConcurrentLoads: 5,
    textureCacheSize: 100,
    enableLazyLoading: true
  };

  /**
   * Inicializar el gestor de assets
   */
  static async initialize(config?: Partial<AssetManagerConfig>): Promise<void> {
    if (this.initialized) return;

    // Aplicar configuración personalizada
    this.config = { ...this.config, ...config };

    try {
      console.log('🚀 Inicializando AssetsManager...');

      // Configurar LazyAssetLoader
      if (this.config.enableLazyLoading) {
        console.log('Configurando lazy loading de assets...');
        // LazyAssetLoader se configura automáticamente
      }

      // Configurar TextureCache
      console.log('Configurando caché de texturas...');
      // TextureCache usa configuración interna por ahora

      // Cargar atlas de texturas
      console.log('Cargando atlas de texturas...');
      await AtlasLoader.load();

      // Inicializar registro de terrenos
      console.log('Inicializando registro de terrenos...');
      // TerrainRegistry se inicializa automáticamente al importar

      this.initialized = true;
      console.log('✅ AssetsManager inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando AssetsManager:', error);
      throw error;
    }
  }

  /**
   * Ensamblar terrenos para un mapa hexagonal
   */
  static async assembleTerrain(request: TerrainAssemblyRequest): Promise<void> {
    if (!this.initialized) {
      throw new Error('AssetsManager no ha sido inicializado. Llama a initialize() primero.');
    }

    const { hexGrid, viewport, terrainType = 'noise' } = request;

    console.log(`🏗️  Ensamblando terreno para mapa hexagonal (${terrainType})...`);

    try {
      // Obtener dimensiones del grid
      const bounds = this.getGridBounds(hexGrid);
      const width = bounds.maxQ - bounds.minQ + 1;
      const height = bounds.maxR - bounds.minR + 1;

      // Generar mapa de alturas usando el generador apropiado
      let heightMap: number[][];
      if (terrainType === 'tectonic') {
        // Usar generador tectónico (si está disponible)
        console.log('Generando mapa tectónico...');
        // Por ahora usar noise como fallback
        heightMap = this.generateNoiseMap(width, height);
      } else {
        console.log('Generando mapa de ruido...');
        heightMap = this.generateNoiseMap(width, height);
      }

      // Aplicar alturas al grid hexagonal
      let index = 0;
      for (let q = bounds.minQ; q <= bounds.maxQ; q++) {
        for (let r = bounds.minR; r <= bounds.maxR; r++) {
          const height = heightMap[index % width]?.[Math.floor(index / width)] || 0;
          const terrainCode = this.getTerrainTypeFromHeight(height);

          // Crear celda hexagonal
          const cell = {
            terrainCode,
            q,
            r,
            neighbors: [], // Se calcularán después
            overlay: null,
            transitionMasks: new Map(),
            variation: Math.floor(Math.random() * 4), // Variación aleatoria
            height
          };

          hexGrid.set(q, r, cell);
          index++;
        }
      }

      // Si hay viewport, activar lazy loading
      if (viewport && this.config.enableLazyLoading) {
        LazyAssetLoader.updateViewport(viewport);
        console.log('Viewport actualizado para lazy loading');
      }

      console.log('✅ Terreno ensamblado correctamente');
    } catch (error) {
      console.error('❌ Error ensamblando terreno:', error);
      throw error;
    }
  }

  /**
   * Obtener textura para un terreno específico
   */
  static getTerrainTexture(terrainType: string): any {
    if (!this.initialized) {
      console.warn('AssetsManager no inicializado');
      return null;
    }

    // Intentar obtener del atlas
    const texture = AtlasLoader.getTexture(terrainType);
    if (texture) {
      return texture;
    }

    // Fallback a registro de terrenos
    const terrainData = TERRAIN_REGISTRY[terrainType];
    if (terrainData && terrainData.base?.length) {
      const url = terrainData.base[0];
      console.log(`Cargando textura desde registro: ${url}`);
      // Retornamos el URL por ahora (el consumidor puede cargarlo como quiera)
      return url;
    }

    console.warn(`Textura no encontrada para terreno: ${terrainType}`);
    return null;
  }

  /**
   * Limpiar caché de texturas
   */
  static clearTextureCache(): void {
    TextureCache.clear();
    console.log('🧹 Caché de texturas limpiado');
  }

  /**
   * Obtener estadísticas de rendimiento
   */
  static getStats(): {
    atlasLoaded: boolean;
    cacheSize: number;
    cacheHits: number;
    cacheMisses: number;
    lazyLoaderQueueSize: number;
  } {
    return {
      atlasLoaded: AtlasLoader.isLoaded(),
      cacheSize: TextureCache.size(),
      cacheHits: TextureCache.getHitCount(),
      cacheMisses: TextureCache.getMissCount(),
      lazyLoaderQueueSize: LazyAssetLoader.getQueueSize()
    };
  }

  /**
   * Generar mapa de alturas usando ruido (método auxiliar)
   */
  private static generateNoiseMap(width: number, height: number): number[][] {
    const map: number[][] = [];
    for (let x = 0; x < width; x++) {
      map[x] = [];
      for (let y = 0; y < height; y++) {
        // Ruido simple basado en coordenadas
        const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
        map[x][y] = Math.max(0, Math.min(1, noise));
      }
    }
    return map;
  }

  /**
   * Determinar tipo de terreno basado en altura (método auxiliar)
   */
  private static getTerrainTypeFromHeight(height: number): string {
    if (height < 0.3) return 'water';
    if (height < 0.5) return 'sand';
    if (height < 0.7) return 'grass';
    if (height < 0.9) return 'forest';
    return 'mountains';
  }

  /**
   * Obtener límites del grid hexagonal (método auxiliar)
   */
  private static getGridBounds(hexGrid: HexGrid): { minQ: number; maxQ: number; minR: number; maxR: number } {
    const cells = hexGrid.values();
    if (cells.length === 0) {
      return { minQ: 0, maxQ: 10, minR: 0, maxR: 10 }; // Default bounds
    }

    let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
    for (const cell of cells) {
      minQ = Math.min(minQ, cell.q);
      maxQ = Math.max(maxQ, cell.q);
      minR = Math.min(minR, cell.r);
      maxR = Math.max(maxR, cell.r);
    }

    return { minQ, maxQ, minR, maxR };
  }
}