'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { HexGrid, HexCell } from '../lib/hex/HexGrid';
import { AtlasLoader } from '../lib/terrain/AtlasLoader';
import { TERRAIN_REGISTRY } from '../lib/terrain/TerrainRegistry';

interface PixiHexGridRendererProps {
  grid: HexGrid;
  size: number;
  debug?: boolean;
}

interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

const CHUNK_SIZE = 32; // Tamaño de los chunks en hexágonos

export function PixiHexGridRenderer({ grid, size, debug = false }: PixiHexGridRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const worldRef = useRef<PIXI.Container | null>(null);
  const chunksRef = useRef<Map<string, PIXI.Container>>(new Map());
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 1 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Esperar a que el contenedor tenga dimensiones
    const initPixi = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      if (width === 0 || height === 0) {
        setTimeout(initPixi, 50);
        return;
      }

      // Inicializar Pixi.js Application
      const app = new PIXI.Application({
        width,
        height,
        backgroundColor: 0x1a1a2e, // Color de fondo oscuro
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Append canvas to container
      const canvas = app.view as unknown as Node;
      containerRef.current.appendChild(canvas);
      appRef.current = app;

      // Contenedor principal para el mundo
      const world = new PIXI.Container();
      app.stage.addChild(world);
      worldRef.current = world;

      // Cargar atlas si no está cargado
      async function loadAtlas() {
        if (!AtlasLoader.isLoaded()) {
          try {
            await AtlasLoader.load();
          } catch (error) {
            console.error('Error cargando atlas:', error);
          }
        }
        
        // Generar chunks una vez cargado el atlas
        generateChunks(world, grid, size);
      }

      loadAtlas();

      // Manejar eventos de mouse para cámara
      const handleMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !worldRef.current) return;
        
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        
        worldRef.current.x += dx;
        worldRef.current.y += dy;
        
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
      };

      const handleWheel = (e: WheelEvent) => {
        if (!worldRef.current) return;
        
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, worldRef.current.scale.x * zoomFactor));
        
        worldRef.current.scale.set(newZoom);
        setCamera(prev => ({ ...prev, zoom: newZoom }));
      };

      containerRef.current.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false });

      // Manejar resize
      const handleResize = () => {
        if (!containerRef.current || !appRef.current) return;
        appRef.current.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      };

      window.addEventListener('resize', handleResize);

      // Limpiar al desmontar
      return () => {
        window.removeEventListener('resize', handleResize);
        containerRef.current?.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        containerRef.current?.removeEventListener('wheel', handleWheel);
        
        if (worldRef.current) {
          worldRef.current.destroy();
        }
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      };
    };

    // Inicializar Pixi
    const cleanup = initPixi();
    
    return cleanup;
  }, [grid, size]);

  /**
   * Generar chunks para el mapa
   */
  const generateChunks = (world: PIXI.Container, grid: HexGrid, hexSize: number) => {
    console.log('Generando chunks...');
    
    // Limpiar chunks anteriores
    chunksRef.current.forEach(chunk => chunk.destroy());
    chunksRef.current.clear();

    const chunks = new Map<string, PIXI.Container>();
    
    grid.values().forEach(hex => {
      const cq = Math.floor(hex.q / CHUNK_SIZE);
      const cr = Math.floor(hex.r / CHUNK_SIZE);
      const key = `${cq},${cr}`;
      
      if (!chunks.has(key)) {
        const chunkContainer = new PIXI.Container();
        chunks.set(key, chunkContainer);
        world.addChild(chunkContainer);
      }
      
      const chunk = chunks.get(key)!;
      
      // Crear sprite para el hexágono
      const sprite = createHexSprite(hex, hexSize);
      if (sprite) {
        chunk.addChild(sprite);
      }
    });

    chunksRef.current = chunks;
    console.log(`Generados ${chunks.size} chunks`);
  };

  /**
   * Crear un sprite para un hexágono usando el atlas
   */
  const createHexSprite = (hex: HexCell, hexSize: number): PIXI.Sprite | null => {
    // Obtener nombre del sprite basado en el terreno
    // Nota: Esto es simplificado. En producción, usaríamos las reglas WML para determinar el sprite
    const terrainDef = TERRAIN_REGISTRY[hex.terrainCode];
    if (!terrainDef || terrainDef.base.length === 0) return null;

    // Usar la primera variación para ahora (mejorar con reglas WML)
    const spriteName = terrainDef.base[0].replace('/assets/terrain/', '').replace('.png', '');
    
    const texture = AtlasLoader.getTexture(spriteName);
    if (!texture) return null;

    const sprite = new PIXI.Sprite(texture);
    
    // Posicionar el sprite
    const { x, y } = HexGrid.hexToPixel(hex.q, hex.r, hexSize);
    sprite.x = x;
    sprite.y = y;
    
    // Ajustar tamaño y pivot para centrar
    sprite.anchor.set(0.5);
    const scale = hexSize / Math.max(sprite.texture.width, sprite.texture.height) * 1.8;
    sprite.scale.set(scale);
    
    return sprite;
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden',
        borderRadius: '1rem',
        cursor: 'grab'
      }} 
    />
  );
}
