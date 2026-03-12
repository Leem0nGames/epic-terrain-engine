/**
 * Sistema de caché para assets de terreno
 * Evita descargar archivos que no existen o ya están cacheados
 */

import * as fs from 'fs';
import * as path from 'path';

const CACHE_DIR = path.join(__dirname, '..', '..', 'public', 'assets', 'terrain');
const CACHE_INDEX_FILE = path.join(__dirname, '..', '..', 'data', 'terrain-cache.json');

export interface TerrainCacheIndex {
  [url: string]: {
    exists: boolean;
    lastChecked: number;
    etag?: string;
  };
}

export class TerrainCache {
  private static cacheIndex: TerrainCacheIndex = {};
  private static loaded = false;

  /**
   * Cargar el índice de caché desde disco
   */
  static loadIndex(): void {
    if (this.loaded) return;

    try {
      if (fs.existsSync(CACHE_INDEX_FILE)) {
        const data = fs.readFileSync(CACHE_INDEX_FILE, 'utf-8');
        this.cacheIndex = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load terrain cache index:', error);
      this.cacheIndex = {};
    }

    this.loaded = true;
  }

  /**
   * Guardar el índice de caché en disco
   */
  static saveIndex(): void {
    try {
      const dir = path.dirname(CACHE_INDEX_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CACHE_INDEX_FILE, JSON.stringify(this.cacheIndex, null, 2));
    } catch (error) {
      console.warn('Could not save terrain cache index:', error);
    }
  }

  /**
   * Verificar si un archivo existe localmente
   */
  static exists(url: string): boolean {
    this.loadIndex();

    // Normalizar URL
    const normalizedUrl = url.replace(/^\//, '');

    // Verificar caché primero
    const cached = this.cacheIndex[normalizedUrl];
    if (cached && cached.exists) {
      // Verificar si el archivo sigue existiendo
      const filePath = path.join(CACHE_DIR, normalizedUrl);
      if (fs.existsSync(filePath)) {
        return true;
      } else {
        // Archivo eliminado, actualizar caché
        cached.exists = false;
        this.saveIndex();
        return false;
      }
    }

    // Verificar si el archivo existe
    const filePath = path.join(CACHE_DIR, normalizedUrl);
    const exists = fs.existsSync(filePath);

    // Actualizar caché
    this.cacheIndex[normalizedUrl] = {
      exists,
      lastChecked: Date.now(),
    };

    if (exists) {
      this.saveIndex();
    }

    return exists;
  }

  /**
   * Marcar un archivo como existente o no existente
   */
  static setExists(url: string, exists: boolean): void {
    this.loadIndex();

    const normalizedUrl = url.replace(/^\//, '');
    this.cacheIndex[normalizedUrl] = {
      exists,
      lastChecked: Date.now(),
    };

    this.saveIndex();
  }

  /**
   * Limpiar caché antigua (más de 7 días)
   */
  static cleanOldCache(): void {
    this.loadIndex();

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    for (const url in this.cacheIndex) {
      if (now - this.cacheIndex[url].lastChecked > sevenDays) {
        delete this.cacheIndex[url];
      }
    }

    this.saveIndex();
  }

  /**
   * Obtener URLs de transición probables para un terreno
   */
  static getTransitionUrls(terrainCode: string, mask: number): string[] {
    const urls: string[] = [];
    
    // Mapa de códigos de terreno a nombres de archivo
    const terrainNames: Record<string, string> = {
      'Gg': 'green',
      'Ww': 'deep',
      'Ds': 'beach',
      'Dd': 'desert',
      'Aa': 'snow',
      'Hh': 'basic',
      'Mm': 'basic',
      'Ff': 'pine',
      'Rr': 'deep',
    };

    const terrainName = terrainNames[terrainCode] || terrainCode.toLowerCase();
    
    // Direcciones hexagonales
    const directions = ['n', 'ne', 'se', 's', 'sw', 'nw'];
    
    // Construir sufijo basado en la máscara
    const suffixBits: string[] = [];
    for (let i = 0; i < 6; i++) {
      if (mask & (1 << i)) {
        suffixBits.push(directions[i]);
      }
    }

    if (suffixBits.length === 0) {
      return urls;
    }

    // Para cada combinación de bits, generar URLs probables
    const suffix = suffixBits.join('-');
    urls.push(`/assets/terrain/${terrainName}/${terrainName}-${suffix}.png`);
    
    // También intentar con el nombre del terreno base
    if (terrainName !== terrainCode.toLowerCase()) {
      urls.push(`/assets/terrain/${terrainCode.toLowerCase()}/${terrainCode.toLowerCase()}-${suffix}.png`);
    }

    return urls;
  }
}
