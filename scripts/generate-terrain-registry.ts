/**
 * Script para generar el TerrainRegistry automáticamente
 * basado en los archivos descargados de Wesnoth
 */

import * as fs from 'fs';
import * as path from 'path';

const TERRAIN_DIR = path.join(__dirname, '..', 'public', 'assets', 'terrain');

/**
 * Analiza los archivos de una categoría de terreno
 */
function analyzeTerrainCategory(categoryName: string): any {
  const categoryDir = path.join(TERRAIN_DIR, categoryName);
  
  if (!fs.existsSync(categoryDir)) {
    console.warn(`⚠️  Directorio no encontrado: ${categoryName}`);
    return null;
  }

  const files = fs.readdirSync(categoryDir);
  const result = {
    base: [] as string[],
    tile: [] as string[],
    transitions: [] as string[],
    clusters: [] as string[],
    variants: [] as string[]
  };

  for (const file of files) {
    const filePath = path.join(categoryDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) continue;
    if (!file.endsWith('.png')) continue;

    const url = `/assets/terrain/${categoryName}/${file}`;

    // Clasificar archivos
    if (file.includes('-n') || file.includes('-ne') || file.includes('-se') || 
        file.includes('-s') || file.includes('-sw') || file.includes('-nw')) {
      result.transitions.push(url);
    } else if (file.includes('-tile')) {
      result.tile.push(url);
    } else if (file.includes('range') || file.includes('5_') || file.includes('6_')) {
      result.clusters.push(url);
    } else if (file.match(/\d+\.png$/)) {
      result.variants.push(url);
    } else {
      result.base.push(url);
    }
  }

  // Ordenar arrays
  result.base.sort();
  result.transitions.sort();
  result.clusters.sort();
  result.variants.sort();

  return result;
}

/**
 * Genera el TerrainRegistry TypeScript
 */
function generateTerrainRegistry(categories: Record<string, any>) {
  let registry = `import { getAssetBase } from './TerrainRegistry';\n\n`;
  registry += `export interface TerrainDef {\n`;
  registry += `  id: string;\n`;
  registry += `  name: string;\n`;
  registry += `  color: string;\n`;
  registry += `  zIndex: number;\n`;
  registry += `  layer?: number;\n`;
  registry += `  offsetY?: number;\n`;
  registry += `  isOverlay?: boolean;\n`;
  registry += `  variations: number;\n`;
  registry += `  transitions: boolean;\n`;
  registry += `  base: string[];\n`;
  registry += `  movementCost?: number;\n`;
  registry += `}\n\n`;

  registry += `export const TERRAIN_REGISTRY: Record<string, TerrainDef> = {\n`;

  // Definiciones de terrenos
  const terrainDefinitions: Record<string, any> = {
    Gg: {
      id: 'grass',
      name: 'Grass',
      color: '#22c55e',
      category: 'grass',
      zIndex: 1,
      movementCost: 1
    },
    Ww: {
      id: 'water',
      name: 'Water',
      color: '#3b82f6',
      category: 'water',
      zIndex: 0,
      movementCost: 99
    },
    Ds: {
      id: 'sand',
      name: 'Sand',
      color: '#fde047',
      category: 'sand',
      zIndex: 1,
      movementCost: 2
    },
    Dd: {
      id: 'desert',
      name: 'Desert',
      color: '#fcd34d',
      category: 'sand',
      zIndex: 1,
      movementCost: 2
    },
    Aa: {
      id: 'snow',
      name: 'Snow',
      color: '#f8fafc',
      category: 'frozen',
      zIndex: 1,
      movementCost: 2
    },
    Hh: {
      id: 'hills',
      name: 'Hills',
      color: '#a1a1aa',
      category: 'mountains',
      zIndex: 2,
      layer: 3,
      offsetY: -5,
      movementCost: 2
    },
    Mm: {
      id: 'mountain',
      name: 'Mountain',
      color: '#71717a',
      category: 'mountains',
      zIndex: 3,
      layer: 3,
      offsetY: -15,
      movementCost: 3
    },
    Ff: {
      id: 'forest',
      name: 'Forest',
      color: '#166534',
      category: 'forest',
      zIndex: 2,
      layer: 3,
      offsetY: -10,
      movementCost: 2
    },
    Jg: {
      id: 'jungle',
      name: 'Jungle',
      color: '#064e3b',
      category: 'forest',
      zIndex: 2,
      layer: 3,
      offsetY: -10,
      movementCost: 2,
      isOverlay: true
    },
    Rr: {
      id: 'river',
      name: 'River',
      color: '#0ea5e9',
      category: 'water',
      zIndex: 1,
      movementCost: 2
    },
    Vi: {
      id: 'village',
      name: 'Village',
      color: '#ef4444',
      category: 'village',
      zIndex: 10,
      layer: 4,
      offsetY: -15,
      movementCost: 1,
      isOverlay: true,
      transitions: false
    },
    Ca: {
      id: 'castle',
      name: 'Castle',
      color: '#52525b',
      category: 'castle',
      zIndex: 10,
      layer: 4,
      offsetY: -15,
      movementCost: 1,
      isOverlay: true,
      transitions: false
    }
  };

  for (const [code, def] of Object.entries(terrainDefinitions)) {
    const category = def.category;
    const categoryData = categories[category];
    
    if (!categoryData) {
      console.warn(`⚠️  Categoría no encontrada: ${category} para terreno ${code}`);
      continue;
    }

    // Determinar si tiene transiciones
    const hasTransitions = categoryData.transitions && categoryData.transitions.length > 0;
    const transitions = def.transitions !== undefined ? def.transitions : hasTransitions;

    registry += `  ${code}: {\n`;
    registry += `    id: '${def.id}',\n`;
    registry += `    name: '${def.name}',\n`;
    registry += `    color: '${def.color}',\n`;
    registry += `    base: [\n`;
    
    // Usar variantes si existen, sino base
    const baseFiles = categoryData.variants.length > 0 ? categoryData.variants : categoryData.base;
    for (const file of baseFiles.slice(0, 4)) { // Máximo 4 variantes
      registry += `      '${file}',\n`;
    }
    
    registry += `    ],\n`;
    registry += `    variations: ${Math.min(baseFiles.length, 4)},\n`;
    registry += `    transitions: ${transitions},\n`;
    registry += `    zIndex: ${def.zIndex},\n`;
    
    if (def.layer) registry += `    layer: ${def.layer},\n`;
    if (def.offsetY) registry += `    offsetY: ${def.offsetY},\n`;
    if (def.isOverlay) registry += `    isOverlay: true,\n`;
    if (def.movementCost) registry += `    movementCost: ${def.movementCost},\n`;
    
    registry += `  },\n`;
  }

  registry += `};\n`;

  return registry;
}

/**
 * Main function
 */
function main() {
  console.log('🌍 Generando TerrainRegistry automático...\n');

  const categories: Record<string, any> = {};
  const categoryNames = ['mountains', 'grass', 'water', 'forest', 'sand', 'frozen', 'castle', 'village'];

  for (const categoryName of categoryNames) {
    const data = analyzeTerrainCategory(categoryName);
    if (data) {
      categories[categoryName] = data;
      console.log(`✅ ${categoryName}: ${data.base.length} base, ${data.transitions.length} transiciones, ${data.variants.length} variantes`);
    }
  }

  // Generar el archivo TypeScript
  const registryCode = generateTerrainRegistry(categories);
  const outputPath = path.join(__dirname, '..', 'lib', 'terrain', 'TerrainRegistry.auto.ts');
  
  fs.writeFileSync(outputPath, registryCode);
  console.log(`\n✅ TerrainRegistry generado: ${outputPath}`);

  // Generar JSON con estructura completa
  const jsonPath = path.join(__dirname, '..', 'data', 'terrain-structure.json');
  fs.writeFileSync(jsonPath, JSON.stringify(categories, null, 2));
  console.log(`✅ Estructura JSON generada: ${jsonPath}`);
}

// Ejecutar
main();
