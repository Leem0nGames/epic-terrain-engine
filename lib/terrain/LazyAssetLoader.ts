/**
 * Sistema de Lazy Loading para assets según viewport
 * Carga solo los assets necesarios basados en la cámara
 */

import { TextureCache } from './TextureCache';

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface AssetLoadRequest {
  url: string;
  priority: number;
  timestamp: number;
}

export class LazyAssetLoader {
  private static loadedAssets: Set<string> = new Set();
  private static loadingQueue: AssetLoadRequest[] = [];
  private static viewport: ViewportBounds = { left: 0, right: 0, top: 0, bottom: 0 };
  private static maxConcurrentLoads: number = 5;
  private static currentLoads: number = 0;

  /**
   * Actualizar viewport actual
   */
  static updateViewport(bounds: ViewportBounds): void {
    this.viewport = bounds;
    this.processQueue();
  }

  /**
   * Solicitar carga de un asset
   */
  static requestAsset(url: string, priority: number = 1): void {
    // Si ya está cargado, no hacer nada
    if (this.loadedAssets.has(url)) {
      return;
    }

    // Si ya está en la cola, actualizar prioridad
    const existing = this.loadingQueue.find(req => req.url === url);
    if (existing) {
      existing.priority = Math.max(existing.priority, priority);
      return;
    }

    // Agregar a la cola
    this.loadingQueue.push({
      url,
      priority,
      timestamp: Date.now()
    });

    // Ordenar por prioridad (más alta primero) y timestamp (más reciente primero)
    this.loadingQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.timestamp - a.timestamp;
    });

    this.processQueue();
  }

  /**
   * Procesar la cola de carga
   */
  private static processQueue(): void {
    while (this.currentLoads < this.maxConcurrentLoads && this.loadingQueue.length > 0) {
      const request = this.loadingQueue.shift();
      if (request) {
        this.loadAsset(request);
      }
    }
  }

  /**
   * Cargar un asset individual
   */
  private static async loadAsset(request: AssetLoadRequest): Promise<void> {
    this.currentLoads++;

    try {
      // Simular carga (en producción, aquí iría la lógica real de carga)
      await new Promise(resolve => setTimeout(resolve, 10));
      
      this.loadedAssets.add(request.url);
      console.log(`✅ Asset cargado: ${request.url}`);
    } catch (error) {
      console.error(`❌ Error cargando asset: ${request.url}`, error);
    } finally {
      this.currentLoads--;
      this.processQueue();
    }
  }

  /**
   * Verificar si un asset está cargado
   */
  static isLoaded(url: string): boolean {
    return this.loadedAssets.has(url);
  }

  /**
   * Obtener lista de assets cargados
   */
  static getLoadedAssets(): string[] {
    return Array.from(this.loadedAssets);
  }

  /**
   * Limpiar assets no usados
   */
  static cleanupUnused(keepUrls: string[]): void {
    const keepSet = new Set(keepUrls);
    for (const url of this.loadedAssets) {
      if (!keepSet.has(url)) {
        this.loadedAssets.delete(url);
      }
    }
  }

  /**
   * Precargar assets para un área específica
   */
  static preloadArea(bounds: ViewportBounds, assets: string[]): void {
    // Calcular qué assets son necesarios para el área
    const neededAssets = this.filterAssetsForViewport(assets, bounds);
    
    // Solicitar carga con alta prioridad
    neededAssets.forEach(url => this.requestAsset(url, 10));
  }

  /**
   * Filtrar assets basados en el viewport
   */
  private static filterAssetsForViewport(assets: string[], bounds: ViewportBounds): string[] {
    // En una implementación real, aquí se filtrarían los assets
    // basados en su posición en el mundo del juego
    return assets.slice(0, 10); // Temporal: cargar primeros 10
  }

  /**
   * Obtener estadísticas
   */
  static getStats(): { loaded: number; queue: number; concurrent: number } {
    return {
      loaded: this.loadedAssets.size,
      queue: this.loadingQueue.length,
      concurrent: this.currentLoads
    };
  }
}
