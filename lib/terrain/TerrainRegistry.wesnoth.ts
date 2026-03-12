/**
 * Terrain Registry generado automáticamente basado en assets de Wesnoth
 * Actualizado con los archivos descargados
 */

// Base URL para assets locales
const LOCAL_ASSET_BASE = "/assets/terrain/";

export interface TerrainDef {
  id: string;
  name: string;
  color: string;
  zIndex: number;
  layer?: number;
  offsetY?: number;
  isOverlay?: boolean;
  variations: number;
  transitions: boolean;
  base: string[];
  movementCost?: number;
}

export const TERRAIN_REGISTRY: Record<string, TerrainDef> = {
  // GRASS - Terreno base
  Gg: {
    id: "grass",
    name: "Grass",
    color: "#22c55e",
    base: [
      `${LOCAL_ASSET_BASE}grass/green.png`,
      `${LOCAL_ASSET_BASE}grass/green2.png`,
      `${LOCAL_ASSET_BASE}grass/green3.png`,
      `${LOCAL_ASSET_BASE}grass/green4.png`,
    ],
    variations: 4,
    transitions: true,
    zIndex: 1,
    movementCost: 1,
  },

  // WATER - Agua profunda
  Ww: {
    id: "water",
    name: "Water",
    color: "#3b82f6",
    base: [
      `${LOCAL_ASSET_BASE}water/deep.png`,
      `${LOCAL_ASSET_BASE}water/deep2.png`,
      `${LOCAL_ASSET_BASE}water/wave.png`,
      `${LOCAL_ASSET_BASE}water/wave2.png`,
    ],
    variations: 4,
    transitions: true,
    zIndex: 0,
    movementCost: 99,
  },

  // SAND - Playa
  Ds: {
    id: "sand",
    name: "Sand",
    color: "#fde047",
    base: [
      `${LOCAL_ASSET_BASE}sand/beach.png`,
    ],
    variations: 1,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },

  // DESERT - Desierto
  Dd: {
    id: "desert",
    name: "Desert",
    color: "#fcd34d",
    base: [
      `${LOCAL_ASSET_BASE}sand/desert.png`,
      `${LOCAL_ASSET_BASE}sand/dune.png`,
    ],
    variations: 2,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },

  // SNOW - Nieve
  Aa: {
    id: "snow",
    name: "Snow",
    color: "#f8fafc",
    base: [
      `${LOCAL_ASSET_BASE}frozen/snow.png`,
      `${LOCAL_ASSET_BASE}frozen/ice.png`,
    ],
    variations: 2,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },

  // HILLS - Colinas
  Hh: {
    id: "hills",
    name: "Hills",
    color: "#a1a1aa",
    base: [
      `${LOCAL_ASSET_BASE}mountains/basic.png`,
      `${LOCAL_ASSET_BASE}mountains/basic2.png`,
      `${LOCAL_ASSET_BASE}mountains/basic3.png`,
    ],
    variations: 3,
    transitions: true,
    zIndex: 2,
    layer: 3,
    offsetY: -5,
    movementCost: 2,
  },

  // MOUNTAIN - Montañas
  Mm: {
    id: "mountain",
    name: "Mountain",
    color: "#71717a",
    base: [
      `${LOCAL_ASSET_BASE}mountains/basic.png`,
      `${LOCAL_ASSET_BASE}mountains/basic2.png`,
      `${LOCAL_ASSET_BASE}mountains/basic3.png`,
      `${LOCAL_ASSET_BASE}mountains/peak.png`,
    ],
    variations: 4,
    transitions: true,
    zIndex: 3,
    layer: 3,
    offsetY: -15,
    movementCost: 3,
  },

  // FOREST - Bosque
  Ff: {
    id: "forest",
    name: "Forest",
    color: "#166534",
    base: [
      `${LOCAL_ASSET_BASE}forest/pine.png`,
      `${LOCAL_ASSET_BASE}forest/mixed.png`,
      `${LOCAL_ASSET_BASE}forest/tropical.png`,
    ],
    variations: 3,
    transitions: true,
    zIndex: 2,
    layer: 3,
    offsetY: -10,
    movementCost: 2,
  },

  // JUNGLE - Selva (overlay)
  Jg: {
    id: "jungle",
    name: "Jungle",
    color: "#064e3b",
    base: [
      `${LOCAL_ASSET_BASE}forest/tropical.png`,
    ],
    variations: 1,
    transitions: false,
    isOverlay: true,
    zIndex: 2,
    layer: 3,
    offsetY: -10,
    movementCost: 2,
  },

  // RIVER - Río
  Rr: {
    id: "river",
    name: "River",
    color: "#0ea5e9",
    base: [
      `${LOCAL_ASSET_BASE}water/deep.png`,
      `${LOCAL_ASSET_BASE}water/wave.png`,
    ],
    variations: 2,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },

  // VILLAGE - Aldea (overlay)
  Vi: {
    id: "village",
    name: "Village",
    color: "#ef4444",
    base: [
      `${LOCAL_ASSET_BASE}village/human.png`,
      `${LOCAL_ASSET_BASE}village/orc.png`,
      `${LOCAL_ASSET_BASE}village/elven.png`,
    ],
    variations: 3,
    transitions: false,
    isOverlay: true,
    zIndex: 10,
    layer: 4,
    offsetY: -15,
    movementCost: 1,
  },

  // CASTLE - Castillo (overlay)
  Ca: {
    id: "castle",
    name: "Castle",
    color: "#52525b",
    base: [
      `${LOCAL_ASSET_BASE}castle/keep.png`,
      `${LOCAL_ASSET_BASE}castle/ruin.png`,
      `${LOCAL_ASSET_BASE}castle/village.png`,
    ],
    variations: 3,
    transitions: false,
    isOverlay: true,
    zIndex: 10,
    layer: 4,
    offsetY: -15,
    movementCost: 1,
  },
};

// Función para obtener URL de transición
export function getTransitionUrl(fromCode: string, toCode: string, variation: number = 0): string | null {
  const fromDef = TERRAIN_REGISTRY[fromCode];
  const toDef = TERRAIN_REGISTRY[toCode];
  if (!fromDef || !toDef || !fromDef.base || fromDef.base.length === 0) return null;
  
  // Verificar si las transiciones están habilitadas
  if (!fromDef.transitions || !toDef.transitions) return null;

  // Obtener nombre de categoría
  const fromCategory = fromDef.id;
  const toCategory = toDef.id;
  
  // Mapeo de direcciones hexagonales a sufijos
  // 0: n, 1: ne, 2: se, 3: s, 4: sw, 5: nw
  const directionSuffixes = ['-n', '-ne', '-se', '-s', '-sw', '-nw'];
  
  // Para transiciones simples, usar sufijo de dirección
  // En una implementación completa, esto dependería de la máscara de vecinos
  const suffix = directionSuffixes[variation % directionSuffixes.length];
  
  // Intentar diferentes patrones de transición
  const patterns = [
    `${fromCategory}${suffix}.png`,
    `${fromCategory}-${toCategory}${suffix}.png`,
    `blend-from-${toCategory}${suffix}.png`
  ];
  
  for (const pattern of patterns) {
    const url = `${LOCAL_ASSET_BASE}${fromCategory}/${pattern}`;
    // En una implementación real, verificaríamos si el archivo existe
    // Por ahora, devolvemos el primer patrón
    return url;
  }
  
  return null;
}

// Exportar para uso en otros módulos
export default TERRAIN_REGISTRY;
