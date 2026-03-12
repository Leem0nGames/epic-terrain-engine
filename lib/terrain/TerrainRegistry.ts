export const USE_WESNOTH_CDN_ASSETS = false;
export const WESNOTH_ASSET_BASE = "https://cdn.jsdelivr.net/gh/wesnoth/wesnoth@1.18.0/data/core/images/terrain/";
export const LOCAL_ASSET_BASE = "/assets/terrain/";

export const getAssetBase = () => USE_WESNOTH_CDN_ASSETS ? WESNOTH_ASSET_BASE : LOCAL_ASSET_BASE;

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

export function getTransitionUrl(fromCode: string, toCode: string, mask: number, variation: number = 0): string | null {
  const fromDef = TERRAIN_REGISTRY[fromCode];
  const toDef = TERRAIN_REGISTRY[toCode];
  if (!fromDef || !toDef || !fromDef.base || fromDef.base.length === 0) return null;
  
  // Check if transitions are enabled for both terrains
  if (!fromDef.transitions || !toDef.transitions) return null;

  const baseUrl = fromDef.base[variation % fromDef.base.length];
  const assetBase = getAssetBase();
  
  if (!baseUrl.startsWith(assetBase)) return null;
  
  const relativePath = baseUrl.substring(assetBase.length);
  const parts = relativePath.split('/');
  const fileName = parts.pop()?.replace('.png', '') || '';
  const folderName = parts.length > 0 ? parts.join('/') + '/' : '';
  
  // Map direction bits to Wesnoth suffixes
  // bit 0: n, bit 1: ne, bit 2: se, bit 3: s, bit 4: sw, bit 5: nw
  const directionSuffixes = ['-n', '-ne', '-se', '-s', '-sw', '-nw'];
  const directionNames = ['n', 'ne', 'se', 's', 'sw', 'nw'];
  
  // Find which bits are set in the mask
  const setBits: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (mask & (1 << i)) {
      setBits.push(i);
    }
  }
  
  // If no bits set, return null
  if (setBits.length === 0) return null;
  
  // For single direction transitions, use the suffix
  if (setBits.length === 1) {
    const suffix = directionSuffixes[setBits[0]];
    return `${assetBase}${folderName}${fileName}${suffix}.png`;
  }
  
  // For multiple directions, build the suffix
  // Sort bits to ensure consistent ordering
  setBits.sort((a, b) => a - b);
  
  // Build suffix from direction names
  const suffix = setBits.map(i => directionNames[i]).join('-');
  
  // Try different patterns based on Wesnoth naming convention
  const patterns = [
    `${assetBase}${folderName}${fileName}-${suffix}.png`, // basic-n-ne.png
    `${assetBase}${folderName}${fileName}${directionSuffixes[setBits[0]]}.png`, // fallback to first direction
  ];
  
  // Return the first pattern (most specific)
  return patterns[0];
}

export const DECORATION_REGISTRY: Record<string, { base: string[], offsetY?: number }> = {
  "flowers": {
    base: [
      `${getAssetBase()}embellishments/flower1.png`,
      `${getAssetBase()}embellishments/flower2.png`,
      `${getAssetBase()}embellishments/flower3.png`
    ]
  },
  "rocks": {
    base: [
      `${getAssetBase()}embellishments/pebbles1.png`,
      `${getAssetBase()}embellishments/pebbles2.png`
    ]
  },
  "water-lilies": {
    base: [
      `${getAssetBase()}embellishments/water-lilies.png`
    ]
  },
  "mushrooms": {
    base: [
      `${getAssetBase()}embellishments/mushroom1.png`,
      `${getAssetBase()}embellishments/mushroom2.png`
    ]
  },
  // Additional decoration types
  "crystals": {
    base: [
      `${getAssetBase()}embellishments/crystal1.png`,
      `${getAssetBase()}embellishments/crystal2.png`
    ]
  },
  "ancient-ruins": {
    base: [
      `${getAssetBase()}embellishments/ruins1.png`,
      `${getAssetBase()}embellishments/ruins2.png`
    ]
  },
  "dead-tree": {
    base: [
      `${getAssetBase()}embellishments/deadtree1.png`,
      `${getAssetBase()}embellishments/deadtree2.png`
    ]
  },
  "spring": {
    base: [
      `${getAssetBase()}embellishments/spring1.png`,
      `${getAssetBase()}embellishments/spring2.png`
    ]
  }
};

export const TERRAIN_REGISTRY: Record<string, TerrainDef> = {
  Gg: {
    id: "grass",
    name: "Grass",
    color: "#22c55e",
    base: [
      `${getAssetBase()}grass/green.png`,
      `${getAssetBase()}grass/green2.png`,
      `${getAssetBase()}grass/green3.png`,
      `${getAssetBase()}grass/green4.png`
    ],
    variations: 4,
    transitions: true,
    zIndex: 1,
    movementCost: 1
  },
  Ww: {
    id: "water",
    name: "Water",
    color: "#3b82f6",
    base: [
      `${getAssetBase()}water/deep.png`,
      `${getAssetBase()}water/deep2.png`,
      `${getAssetBase()}water/wave.png`,
      `${getAssetBase()}water/wave2.png`
    ],
    variations: 4,
    transitions: true,
    zIndex: 0,
    movementCost: 99
  },
  Ds: {
    id: "sand",
    name: "Sand",
    color: "#fde047",
    base: [
      `${getAssetBase()}sand/beach.png`
    ],
    variations: 1,
    transitions: true,
    zIndex: 1,
    movementCost: 2
  },
  Dd: {
    id: "desert",
    name: "Desert",
    color: "#fcd34d",
    base: [
      `${getAssetBase()}sand/desert.png`,
      `${getAssetBase()}sand/dune.png`
    ],
    variations: 2,
    transitions: true,
    zIndex: 1,
    movementCost: 2
  },
  Aa: {
    id: "snow",
    name: "Snow",
    color: "#f8fafc",
    base: [
      `${getAssetBase()}frozen/snow.png`,
      `${getAssetBase()}frozen/ice.png`
    ],
    variations: 2,
    transitions: true,
    zIndex: 1,
    movementCost: 2
  },
  Hh: {
    id: "hills",
    name: "Hills",
    color: "#a1a1aa",
    base: [
      `${getAssetBase()}mountains/basic.png`,
      `${getAssetBase()}mountains/basic2.png`,
      `${getAssetBase()}mountains/basic3.png`
    ],
    variations: 3,
    transitions: true,
    zIndex: 2,
    layer: 3,
    offsetY: -5,
    movementCost: 2
  },
  Jg: {
    id: "jungle",
    name: "Jungle",
    color: "#064e3b",
    base: [
      `${getAssetBase()}forest/tropical.png`
    ],
    variations: 1,
    transitions: false,
    isOverlay: true,
    zIndex: 2,
    layer: 3,
    offsetY: -10,
    movementCost: 2
  },
  Re: {
    id: "dirt",
    name: "Dirt",
    color: "#a16207",
    base: [
      `${getAssetBase()}flat/dirt.png`
    ],
    variations: 1,
    transitions: true,
    zIndex: 1,
    movementCost: 1
  },
  Rd: {
    id: "road",
    name: "Road",
    color: "#d97706",
    base: [
      `${getAssetBase()}flat/road.png`
    ],
    variations: 1,
    transitions: true,
    zIndex: 2,
    movementCost: 1
  },
  Rr: {
    id: "river",
    name: "River",
    color: "#0ea5e9",
    base: [
      `${getAssetBase()}water/deep.png`,
      `${getAssetBase()}water/wave.png`
    ],
    variations: 2,
    transitions: true,
    zIndex: 1,
    movementCost: 2
  },
  Mm: {
    id: "mountain",
    name: "Mountain",
    color: "#71717a",
    base: [
      `${getAssetBase()}mountains/basic.png`,
      `${getAssetBase()}mountains/basic2.png`,
      `${getAssetBase()}mountains/basic3.png`,
      `${getAssetBase()}mountains/peak.png`
    ],
    variations: 4,
    transitions: true,
    zIndex: 3,
    layer: 3,
    offsetY: -15,
    movementCost: 3
  },
  Ff: {
    id: "forest",
    name: "Forest",
    color: "#166534",
    base: [
      `${getAssetBase()}forest/pine.png`,
      `${getAssetBase()}forest/mixed.png`,
      `${getAssetBase()}forest/tropical.png`
    ],
    variations: 3,
    transitions: true,
    zIndex: 2,
    layer: 3,
    offsetY: -10,
    movementCost: 2
  },
  Vi: {
    id: "village",
    name: "Village",
    color: "#ef4444",
    base: [
      `${getAssetBase()}village/human.png`
    ],
    variations: 1,
    transitions: false,
    isOverlay: true,
    zIndex: 10,
    layer: 4,
    offsetY: -15,
    movementCost: 1
  },
  Ca: {
    id: "castle",
    name: "Castle",
    color: "#52525b",
    base: [
      `${getAssetBase()}castle/encampment/regular-keep.png`
    ],
    variations: 1,
    transitions: false,
    isOverlay: true,
    zIndex: 10,
    layer: 4,
    offsetY: -15,
    movementCost: 1
  }
};
