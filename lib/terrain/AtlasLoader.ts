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
      console.log('Cargando metadata del atlas...');
      // Cargar metadata
      const response = await fetch(ATLAS_METADATA_PATH);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const atlasData = await response.json();
      this.atlasData = atlasData;
      console.log(`✅ Metadata cargada: ${Object.keys(atlasData.frames).length} frames`);

      console.log('Cargando textura del atlas...');
      // Cargar textura del atlas usando PIXI.Assets
      const texture = await PIXI.Assets.load(ATLAS_PATH);
      if (!texture) {
        throw new Error('Failed to load atlas texture');
      }
      this.atlasTexture = texture;
      console.log(`✅ Textura cargada: ${texture.width}x${texture.height}`);

      this.loaded = true;
      if (atlasData && this.atlasTexture) {
        console.log(`✅ Atlas completo cargado: ${atlasData.meta.size.w}x${atlasData.meta.size.h}`);
        console.log('Primeros 5 sprites:', Object.keys(atlasData.frames).slice(0, 5));
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
      console.warn(`⚠️  Atlas no cargado cuando se solicita: ${spriteName}`);
      return null;
    }

    const frame = atlasData.frames[spriteName];
    if (!frame) {
      console.warn(`⚠️  Sprite no encontrado en atlas: ${spriteName}`);
      console.log('Sprites disponibles:', Object.keys(atlasData.frames).slice(0, 10));
      return null;
    }

    // Crear textura a partir de la región del atlas
    try {
      const region = new PIXI.Rectangle(frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h);
      const texture = new PIXI.Texture(atlasTexture.baseTexture!, region);
      
      if (!texture.baseTexture) {
        console.warn(`⚠️  Textura creada sin baseTexture: ${spriteName}`);
        return null;
      }
      
      return texture;
    } catch (error) {
      console.error(`❌ Error creando textura para ${spriteName}:`, error);
      return null;
    }
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
