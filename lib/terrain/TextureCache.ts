/**
 * Sistema de caché de texturas renderizadas en memoria
 * Almacena texturas ya renderizadas para evitar recálculos
 */

export interface CachedTexture {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  lastAccess: number;
  accessCount: number;
}

export class TextureCache {
  private static cache: Map<string, CachedTexture> = new Map();
  private static maxSize: number = 100; // Máximo de texturas en caché
  private static hitCount: number = 0;
  private static missCount: number = 0;

  /**
   * Obtener una textura de la caché
   */
  static get(key: string): CachedTexture | null {
    const texture = this.cache.get(key);
    if (texture) {
      texture.lastAccess = Date.now();
      texture.accessCount++;
      this.hitCount++;
      return texture;
    }
    this.missCount++;
    return null;
  }

  /**
   * Guardar una textura en la caché
   */
  static set(key: string, canvas: HTMLCanvasElement): void {
    const texture: CachedTexture = {
      canvas,
      width: canvas.width,
      height: canvas.height,
      lastAccess: Date.now(),
      accessCount: 1
    };

    this.cache.set(key, texture);

    // Si excedemos el límite, eliminar las menos usadas
    if (this.cache.size > this.maxSize) {
      this.evictLeastUsed();
    }
  }

  /**
   * Verificar si una textura existe en caché
   */
  static has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Eliminar una textura de la caché
   */
  static delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpiar toda la caché
   */
  static clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Eliminar las texturas menos usadas
   */
  private static evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por número de accesos (menos accesos primero)
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    // Eliminar las primeras (menos usadas)
    const toRemove = Math.ceil(this.maxSize * 0.1); // Eliminar 10%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Obtener estadísticas de la caché
   */
  static getStats(): { size: number; hits: number; misses: number; ratio: number } {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hits: this.hitCount,
      misses: this.missCount,
      ratio: total > 0 ? this.hitCount / total : 0
    };
  }

  /**
   * Generar clave para textura de terreno
   */
  static generateKey(terrainCode: string, variation: number, mask: number): string {
    return `${terrainCode}_${variation}_${mask}`;
  }

  /**
   * Precalcular texturas para un terreno específico
   */
  static precalculate(terrainCode: string, variations: number, masks: number[]): void {
    for (let v = 0; v < variations; v++) {
      for (const mask of masks) {
        const key = this.generateKey(terrainCode, v, mask);
        if (!this.has(key)) {
          // La textura se generará cuando sea necesaria
          // Esto es solo para reservar la entrada
        }
      }
    }
  }
}
