/**
 * Script de compilación de assets
 * Convierte imágenes a WebP, genera atlas de texturas y metadata JSON
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { MaxRectsPacker, Rectangle } from 'maxrects-packer';

interface SpriteFrame {
  filename: string;
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

interface AtlasData {
  frames: { [key: string]: SpriteFrame };
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
  };
}

const INPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'terrain');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'generated');
const ATLAS_NAME = 'terrain-atlas';
const MAX_SIZE = 4096; // Tamaño máximo del atlas

/**
 * Obtener todos los archivos de imagen de un directorio
 */
async function getImageFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const subFiles = await getImageFiles(fullPath);
      files.push(...subFiles);
    } else if (item.name.match(/\.(png|jpg|jpeg)$/i)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Procesar una imagen: convertir a WebP y obtener metadata
 */
async function processImage(filePath: string): Promise<{ buffer: Buffer; width: number; height: number; name: string } | null> {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      console.warn(`⚠️  Imagen sin dimensiones válidas: ${filePath}`);
      return null;
    }

    const buffer = await image.webp({ quality: 85 }).toBuffer();

    // Obtener nombre relativo (sin extensión)
    const relativePath = path.relative(INPUT_DIR, filePath);
    const name = relativePath.replace(/\.[^.]+$/, '').replace(/\\/g, '/');

    return {
      buffer,
      width: metadata.width,
      height: metadata.height,
      name
    };
  } catch (error: any) {
    console.warn(`⚠️  Error procesando ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Empaquetar sprites en un atlas usando un algoritmo simple (Row Packing)
 * Nota: Esto es una implementación simplificada. Para producción, usar maxrects-packer correctamente.
 */
function packSprites(sprites: Array<{ name: string; width: number; height: number; buffer: Buffer }>) {
  // Ordenar sprites por altura (algoritmo simple de filas)
  const sorted = [...sprites].sort((a, b) => b.height - a.height);
  
  const padding = 2;
  let currentX = padding;
  let currentY = padding;
  let rowHeight = 0;
  let maxWidth = 0;
  
  const rects: Array<{ name: string; x: number; y: number; width: number; height: number }> = [];
  
  for (const sprite of sorted) {
    // Si el sprite no cabe en la fila actual, pasa a la siguiente
    if (currentX + sprite.width + padding > MAX_SIZE) {
      currentX = padding;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }
    
    // Si supera el límite de altura, error (o deberíamos manejar múltiples bins)
    if (currentY + sprite.height + padding > MAX_SIZE) {
      console.warn(`⚠️  Sprite ${sprite.name} excede el límite del atlas. Se ignorará.`);
      continue;
    }
    
    rects.push({
      name: sprite.name,
      x: currentX,
      y: currentY,
      width: sprite.width,
      height: sprite.height
    });
    
    maxWidth = Math.max(maxWidth, currentX + sprite.width);
    rowHeight = Math.max(rowHeight, sprite.height);
    currentX += sprite.width + padding;
  }
  
  return {
    width: Math.min(maxWidth + padding, MAX_SIZE),
    height: Math.min(currentY + rowHeight + padding, MAX_SIZE),
    rects
  };
}

/**
 * Crear el atlas de texturas y metadata
 */
async function createAtlas(sprites: Array<{ name: string; width: number; height: number; buffer: Buffer }>) {
  console.log('📦 Empaquetando sprites en atlas...');
  
  const packer = packSprites(sprites);
  const canvasWidth = packer.width;
  const canvasHeight = packer.height;

  // Crear un canvas vacío en memoria
  const composite = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  // Componer cada sprite en su posición
  const frames: { [key: string]: SpriteFrame } = {};
  
  for (const sprite of sprites) {
    // Encontrar la posición del sprite en el packer
    const rect = packer.rects.find(r => r.name === sprite.name);
    if (!rect) continue;

    composite.composite([
      {
        input: sprite.buffer,
        left: rect.x,
        top: rect.y
      }
    ]);

    // Guardar metadata del frame
    frames[sprite.name] = {
      filename: sprite.name,
      frame: { x: rect.x, y: rect.y, w: sprite.width, h: sprite.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: sprite.width, h: sprite.height },
      sourceSize: { w: sprite.width, h: sprite.height }
    };
  }

  // Guardar atlas final
  const atlasPath = path.join(OUTPUT_DIR, `${ATLAS_NAME}.webp`);
  await composite.webp({ quality: 90 }).toFile(atlasPath);

  // Crear metadata JSON
  const atlasData: AtlasData = {
    frames,
    meta: {
      app: 'Epic Terrain Engine',
      version: '1.0.0',
      image: `${ATLAS_NAME}.webp`,
      format: 'RGBA8888',
      size: { w: canvasWidth, h: canvasHeight },
      scale: '1'
    }
  };

  const jsonPath = path.join(OUTPUT_DIR, `${ATLAS_NAME}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(atlasData, null, 2));

  console.log(`✅ Atlas creado: ${atlasPath}`);
  console.log(`✅ Metadata guardada: ${jsonPath}`);
  console.log(`📐 Tamaño del atlas: ${canvasWidth}x${canvasHeight}`);
  console.log(`🖼️  Sprites empaquetados: ${sprites.length}`);

  return atlasData;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Iniciando compilación de assets...\n');

  // Crear directorio de salida
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Obtener archivos de imagen
  console.log(`🔍 Buscando imágenes en: ${INPUT_DIR}`);
  const imageFiles = await getImageFiles(INPUT_DIR);
  console.log(`📁 Encontradas ${imageFiles.length} imágenes\n`);

  // Procesar cada imagen
  console.log('🔄 Procesando imágenes...');
  const spritesResults = await Promise.all(
    imageFiles.map(file => processImage(file))
  );
  
  // Filtrar imágenes fallidas
  const sprites = spritesResults.filter(sprite => sprite !== null) as Array<{ buffer: Buffer; width: number; height: number; name: string }>;

  // Crear atlas
  await createAtlas(sprites);

  console.log('\n✅ Compilación completada exitosamente!');
}

main().catch(error => {
  console.error('❌ Error en la compilación:', error);
  process.exit(1);
});
