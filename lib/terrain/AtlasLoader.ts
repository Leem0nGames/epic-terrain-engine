/**
 * Sistema de carga de atlas de texturas para Pixi.js
 */

import * as PIXI from 'pixi.js';
import { ATLAS_PATH, ATLAS_METADATA_PATH } from './TerrainRegistry';

export interface AtlasFrame {
  filename: string;
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

export interface AtlasData {
  frames: { [key: string]: AtlasFrame };
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
  };
}

export class AtlasLoader {
  private static atlasTexture: PIXI.Texture | null = null;
  private static atlasData: AtlasData | null = null;
  private static loaded = false;

  /**
   * Cargar el atlas y su metadata
   */
  static async load(): Promise<void> {
    if (this.loaded) return;

    try {
      // Cargar metadata
      const response = await fetch(ATLAS_METADATA_PATH);
      this.atlasData = await response.json();

      // Cargar textura del atlas
      const texture = await PIXI.Assets.load(ATLAS_PATH);
      this.atlasTexture = texture;

      this.loaded = true;
      if (this.atlasData) {
        console.log(`✅ Atlas cargado: ${this.atlasData.meta.size.w}x${this.atlasData.meta.size.h}`);
      }
    } catch (error) {
      console.error('❌ Error cargando atlas:', error);
      throw error;
    }
  }

  /**
   * Obtener textura para un sprite específico
   */
  static getTexture(spriteName: string): PIXI.Texture | null {
    const atlasTexture = this.atlasTexture;
    const atlasData = this.atlasData;
    
    if (!atlasTexture || !atlasData) {
      return null;
    }

    const frame = atlasData.frames[spriteName];
    if (!frame) {
      console.warn(`⚠️  Sprite no encontrado en atlas: ${spriteName}`);
      return null;
    }

    // En Pixi.js 7, se usa PIXI.Texture.from() con el marco del atlas
    // La textura del atlas ya está cargada, solo necesitamos referenciar la región
    const region = new PIXI.Rectangle(frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h);
    return new PIXI.Texture(atlasTexture.baseTexture!, region);
  }

  /**
   * Obtener frame info para un sprite
   */
  static getFrame(spriteName: string): AtlasFrame | null {
    if (!this.atlasData) {
      return null;
    }
    return this.atlasData.frames[spriteName] || null;
  }

  /**
   * Verificar si un sprite existe en el atlas
   */
  static hasSprite(spriteName: string): boolean {
    return this.atlasData?.frames[spriteName] !== undefined;
  }

  /**
   * Obtener lista de todos los sprites disponibles
   */
  static getSpriteList(): string[] {
    return this.atlasData ? Object.keys(this.atlasData.frames) : [];
  }

  /**
   * Verificar si el atlas está cargado
   */
  static isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Limpiar recursos
   */
  static destroy(): void {
    if (this.atlasTexture) {
      this.atlasTexture.destroy(true);
      this.atlasTexture = null;
    }
    this.atlasData = null;
    this.loaded = false;
  }
}
