'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { HexGrid, HexCell } from '../lib/hex/HexGrid';
import { AtlasLoader } from '../lib/terrain/AtlasLoader';
import { TERRAIN_REGISTRY } from '../lib/terrain/TerrainRegistry';

interface PixiHexGridRendererProps {
  grid: HexGrid;
  debug?: boolean;
}

interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

const CHUNK_SIZE = 32; // Tamaño de los chunks en hexágonos

export function PixiHexGridRenderer({ grid, debug = false }: PixiHexGridRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const worldRef = useRef<PIXI.Container | null>(null);
  const chunksRef = useRef<Map<string, PIXI.Container>>(new Map());
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Función para crear un sprite de hexágono (definida antes de generateChunks)
  const createHexSprite = (hex: HexCell): PIXI.Sprite | null => {
    // Obtener definición del terreno
    const terrainDef = TERRAIN_REGISTRY[hex.terrainCode];
    if (!terrainDef || terrainDef.base.length === 0) {
      console.warn(`No terrain definition for: ${hex.terrainCode}`);
      return null;
    }

    // Usar la primera variación por ahora
    const spriteName = terrainDef.base[0].replace('/assets/terrain/', '').replace('.png', '');

    let texture = AtlasLoader.getTexture(spriteName);

    // Fallback: cargar directamente del URL si no se encuentra en el atlas
    if (!texture) {
      const fallbackUrl = terrainDef.base[0];
      console.warn(`Atlas texture missing for '${spriteName}', cargando desde URL: ${fallbackUrl}`);
      try {
        texture = PIXI.Texture.from(fallbackUrl);
      } catch (e) {
        console.error(`Error cargando textura desde URL ${fallbackUrl}:`, e);
        return null;
      }
    }

    if (!texture || !texture.baseTexture) {
      console.warn(`Textura inválida para sprite: ${spriteName}`);
      return null;
    }

    const sprite = new PIXI.Sprite(texture);

    // Posicionar el sprite usando coordenadas de hexágono plano
    const { x, y } = HexGrid.hexToPixel(hex.q, hex.r);
    sprite.x = x;
    sprite.y = y;

    // Ajustar tamaño y pivot para centrar (tiles son 72x72)
    sprite.anchor.set(0.5);
    const scale = HexGrid.HEX_WIDTH / Math.max(sprite.texture.width, sprite.texture.height) * 1.8;
    sprite.scale.set(scale);

    return sprite;
  };

  // Función para generar chunks (definida antes de initPixi)
  const generateChunks = (world: PIXI.Container, grid: HexGrid) => {
    console.log('Generando chunks...');
    
    // Limpiar chunks anteriores
    chunksRef.current.forEach(chunk => chunk.destroy());
    chunksRef.current.clear();

    const chunks = new Map<string, PIXI.Container>();
    
    let hexCount = 0;
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
      const sprite = createHexSprite(hex);
      if (sprite) {
        chunk.addChild(sprite);
        hexCount += 1;
      }
    });

    chunksRef.current = chunks;
    console.log(`Generados ${chunks.size} chunks con ${hexCount} sprites`);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let app: PIXI.Application | null = null;
    let cleanupFunction: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Esperar a que el contenedor tenga dimensiones
    const initPixi = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      console.log('Pixi init attempt:', width, height);
      
      if (width === 0 || height === 0) {
        timeoutId = setTimeout(initPixi, 100);
        return;
      }

      // Inicializar Pixi.js Application
      app = new PIXI.Application({
        width,
        height,
        backgroundColor: 0x1a1a2e, // Color de fondo oscuro
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Append canvas to container
      // En Pixi.js v7, app.view es un ICanvas, necesitamos acceder al canvas real
      const canvasElement = app.view as unknown as HTMLCanvasElement;
      if (canvasElement && containerRef.current) {
        containerRef.current.appendChild(canvasElement);
      }
      appRef.current = app;
      
      console.log('Pixi initialized:', width, height);

      // Contenedor principal para el mundo
      const world = new PIXI.Container();
      app.stage.addChild(world);
      worldRef.current = world;
      
      // Calcular los límites de píxeles del mapa según el grid actual
      const getGridPixelBounds = (grid: HexGrid) => {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const cell of grid.values()) {
          const { x, y } = HexGrid.hexToPixel(cell.q, cell.r);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }

        return { minX, maxX, minY, maxY };
      };

      const bounds = getGridPixelBounds(grid);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      // Centrar el mundo en el centro de la pantalla
      world.x = width / 2 - centerX;
      world.y = height / 2 - centerY;

      // Mantener la cámara en (0,0) para que el mundo sea el que se mueve
      app.stage.x = 0;
      app.stage.y = 0;
      app.stage.scale.set(0.5); // Zoom inicial para ver más del mapa

      console.log('Camera centered:', { 
        stageX: app.stage.x, 
        stageY: app.stage.y, 
        stageScale: app.stage.scale.x,
        worldPos: { x: world.x, y: world.y },
        mapCenter: { x: centerX, y: centerY }
      });

      // Cargar atlas si no está cargado
      async function loadAtlas() {
        try {
          if (!AtlasLoader.isLoaded()) {
            await AtlasLoader.load();
          }
          
          console.log('Atlas loaded, generating chunks...');
      // Generar chunks una vez cargado el atlas
      generateChunks(world, grid);
      setIsLoading(false);
      
      // Log de sprites disponibles para debug
      const sprites = AtlasLoader.getSpriteList();
      console.log(`Sprites disponibles: ${sprites.length}`);
      console.log('Primeros 10 sprites:', sprites.slice(0, 10));
      
      // DEBUG: Dibujar un círculo rojo para verificar renderizado
      if (app) {
        const debugGraphics = new PIXI.Graphics();
        debugGraphics.beginFill(0xFF0000);
        debugGraphics.drawCircle(0, 0, 20);
        debugGraphics.endFill();
        debugGraphics.x = width / 2;
        debugGraphics.y = height / 2;
        app.stage.addChild(debugGraphics);
        console.log('Debug circle added at stage center');
      }
      
      // DEBUG: Dibujar un cuadrado azul en el mundo para verificar
      if (world) {
        const debugSquare = new PIXI.Graphics();
        debugSquare.beginFill(0x0000FF);
        debugSquare.drawRect(-25, -25, 50, 50);
        debugSquare.endFill();
        debugSquare.x = 0;
        debugSquare.y = 0;
        world.addChild(debugSquare);
        console.log('Debug square added at world origin');
      }
        } catch (err) {
          console.error('Error cargando atlas:', err);
          setError('Error loading terrain assets');
          setIsLoading(false);
        }
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
        if (!containerRef.current || !app) return;
        app.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      };

      window.addEventListener('resize', handleResize);

      // Función de cleanup
      cleanupFunction = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        window.removeEventListener('resize', handleResize);
        containerRef.current?.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        containerRef.current?.removeEventListener('wheel', handleWheel);
        
        if (worldRef.current) {
          worldRef.current.destroy();
        }
        if (app) {
          app.destroy(true, { children: true, texture: true, baseTexture: true });
        }
      };
    };

    // Inicializar Pixi
    initPixi();
    
    // Retornar cleanup function
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [grid]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] min-w-[400px]"
      style={{ 
        overflow: 'hidden',
        borderRadius: '1rem',
        cursor: 'grab',
        backgroundColor: '#0f172a', // Fondo visible para debug
        position: 'relative'
      }} 
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-slate-400">Loading terrain...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-red-400">{error}</div>
        </div>
      )}
    </div>
  );
}
