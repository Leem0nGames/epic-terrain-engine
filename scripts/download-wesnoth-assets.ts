/**
 * Script para descargar assets de terreno de Wesnoth desde el CDN
 * Ejecutar con: npx tsx scripts/download-wesnoth-assets.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import https from 'https';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/wesnoth/wesnoth@master/data/core/images/terrain/';
const LOCAL_ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'terrain');

// Estructura de terrenos a descargar
const TERRAIN_CATEGORIES = {
  mountains: {
    base: ['basic.png', 'basic2.png', 'basic3.png', 'dry.png', 'snow.png', 'peak.png', 'volcano.png'],
    tile: ['basic-tile.png', 'dry-tile.png', 'snow-tile.png', 'volcano-tile.png'],
    transitions: [
      'basic-n.png', 'basic-ne.png', 'basic-se.png', 'basic-s.png', 'basic-sw.png', 'basic-nw.png',
      'basic-n-ne.png', 'basic-ne-se.png', 'basic-se-s.png', 'basic-s-sw.png', 'basic-sw-nw.png', 'basic-nw-n.png',
      'dry-n.png', 'dry-ne.png', 'dry-se.png', 'dry-s.png', 'dry-sw.png', 'dry-nw.png',
      'snow-n.png', 'snow-ne.png', 'snow-se.png', 'snow-s.png', 'snow-sw.png', 'snow-nw.png'
    ],
    clusters: [
      'basic_range1_1.png', 'basic_range1_2.png', 'basic_range1_3.png',
      'basic_range2_1.png', 'basic_range2_2.png',
      'basic5_1.png', 'basic5_2.png', 'basic5_3.png',
      'basic6_1.png', 'basic6_2.png', 'basic6_3.png'
    ]
  },
  grass: {
    base: ['green.png', 'green2.png', 'green3.png', 'green4.png', 'dry.png', 'light.png', 'light2.png'],
    transitions: [
      'green-n.png', 'green-ne.png', 'green-se.png', 'green-s.png', 'green-sw.png', 'green-nw.png'
    ]
  },
  water: {
    base: ['deep.png', 'deep2.png', 'wave.png', 'wave2.png', 'wave3.png'],
    transitions: [
      'deep-n.png', 'deep-ne.png', 'deep-se.png', 'deep-s.png', 'deep-sw.png', 'deep-nw.png'
    ]
  },
  forest: {
    base: ['pine.png', 'tropical.png', 'mixed.png'],
    transitions: [
      'pine-n.png', 'pine-ne.png', 'pine-se.png', 'pine-s.png', 'pine-sw.png', 'pine-nw.png'
    ]
  },
  sand: {
    base: ['beach.png', 'desert.png', 'dune.png'],
    transitions: [
      'beach-n.png', 'beach-ne.png', 'beach-se.png', 'beach-s.png', 'beach-sw.png', 'beach-nw.png'
    ]
  },
  frozen: {
    base: ['snow.png', 'ice.png'],
    transitions: [
      'snow-n.png', 'snow-ne.png', 'snow-se.png', 'snow-s.png', 'snow-sw.png', 'snow-nw.png'
    ]
  },
  castle: {
    base: ['keep.png', 'ruin.png', 'village.png'],
    transitions: [
      'keep-n.png', 'keep-ne.png', 'keep-se.png', 'keep-s.png', 'keep-sw.png', 'keep-nw.png'
    ]
  },
  village: {
    base: ['human.png', 'orc.png', 'elven.png'],
    transitions: []
  }
};

/**
 * Descarga un archivo desde una URL
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Crear directorio si no existe
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 404) {
        console.warn(`⚠️  Archivo no encontrado (404): ${url}`);
        file.close();
        resolve();
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Descargado: ${path.basename(destPath)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Eliminar archivo incompleto
      console.error(`❌ Error descargando ${url}:`, err.message);
      resolve(); // Continuar con el siguiente archivo
    });
  });
}

/**
 * Descarga todos los assets de una categoría
 */
async function downloadCategory(categoryName: string, categoryData: any) {
  console.log(`\n📥 Descargando categoría: ${categoryName}`);
  
  const categoryDir = path.join(LOCAL_ASSETS_DIR, categoryName);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const downloads: Promise<void>[] = [];

  // Descargar base tiles
  if (categoryData.base) {
    for (const file of categoryData.base) {
      const url = `${CDN_BASE}${categoryName}/${file}`;
      const dest = path.join(categoryDir, file);
      downloads.push(downloadFile(url, dest));
    }
  }

  // Descargar tile completo
  if (categoryData.tile) {
    for (const file of categoryData.tile) {
      const url = `${CDN_BASE}${categoryName}/${file}`;
      const dest = path.join(categoryDir, file);
      downloads.push(downloadFile(url, dest));
    }
  }

  // Descargar transiciones
  if (categoryData.transitions) {
    for (const file of categoryData.transitions) {
      const url = `${CDN_BASE}${categoryName}/${file}`;
      const dest = path.join(categoryDir, file);
      downloads.push(downloadFile(url, dest));
    }
  }

  // Descargar clusters
  if (categoryData.clusters) {
    for (const file of categoryData.clusters) {
      const url = `${CDN_BASE}${categoryName}/${file}`;
      const dest = path.join(categoryDir, file);
      downloads.push(downloadFile(url, dest));
    }
  }

  await Promise.all(downloads);
  console.log(`✅ Categoría ${categoryName} completada`);
}

/**
 * Generar JSON con la estructura de assets
 */
function generateAssetsJSON() {
  const assetsJSON: any = {};

  for (const [categoryName, categoryData] of Object.entries(TERRAIN_CATEGORIES)) {
    assetsJSON[categoryName] = {
      base: (categoryData as any).base?.map((f: string) => `/assets/terrain/${categoryName}/${f}`) || [],
      tile: (categoryData as any).tile?.map((f: string) => `/assets/terrain/${categoryName}/${f}`) || [],
      transitions: (categoryData as any).transitions?.map((f: string) => `/assets/terrain/${categoryName}/${f}`) || [],
      clusters: (categoryData as any).clusters?.map((f: string) => `/assets/terrain/${categoryName}/${f}`) || []
    };
  }

  const jsonPath = path.join(__dirname, '..', 'data', 'terrain-assets.json');
  const jsonDir = path.dirname(jsonPath);
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  fs.writeFileSync(jsonPath, JSON.stringify(assetsJSON, null, 2));
  console.log(`\n✅ JSON generado: ${jsonPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🌍 Iniciando descarga de assets de Wesnoth...\n');
  console.log(`CDN Base: ${CDN_BASE}`);
  console.log(`Directorio local: ${LOCAL_ASSETS_DIR}\n`);

  // Descargar cada categoría
  for (const [categoryName, categoryData] of Object.entries(TERRAIN_CATEGORIES)) {
    await downloadCategory(categoryName, categoryData);
  }

  // Generar JSON con la estructura
  generateAssetsJSON();

  console.log('\n🎉 ¡Descarga completada!');
  console.log('\nNota: Algunos archivos pueden no existir en el repo de Wesnoth.');
  console.log('Esto es normal ya que Wesnoth usa un sistema WML dinámico.');
}

// Ejecutar
main().catch(console.error);
