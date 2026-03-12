import { getAssetBase } from './TerrainRegistry';

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
  Gg: {
    id: 'grass',
    name: 'Grass',
    color: '#22c55e',
    base: [
      '/assets/terrain/grass/green1.png',
      '/assets/terrain/grass/green2.png',
      '/assets/terrain/grass/green3.png',
      '/assets/terrain/grass/green4.png',
    ],
    variations: 4,
    transitions: true,
    zIndex: 1,
    movementCost: 1,
  },
  Ww: {
    id: 'water',
    name: 'Water',
    color: '#3b82f6',
    base: [
      '/assets/terrain/water/deep2.png',
      '/assets/terrain/water/ocean01.png',
      '/assets/terrain/water/ocean02.png',
      '/assets/terrain/water/ocean03.png',
    ],
    variations: 4,
    transitions: true,
    zIndex: 0,
    movementCost: 99,
  },
  Ds: {
    id: 'sand',
    name: 'Sand',
    color: '#fde047',
    base: [
      '/assets/terrain/sand/beach.png',
      '/assets/terrain/sand/desert.png',
      '/assets/terrain/sand/dune.png',
    ],
    variations: 3,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },
  Dd: {
    id: 'desert',
    name: 'Desert',
    color: '#fcd34d',
    base: [
      '/assets/terrain/sand/beach.png',
      '/assets/terrain/sand/desert.png',
      '/assets/terrain/sand/dune.png',
    ],
    variations: 3,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },
  Aa: {
    id: 'snow',
    name: 'Snow',
    color: '#f8fafc',
    base: [
      '/assets/terrain/frozen/ice.png',
      '/assets/terrain/frozen/snow.png',
    ],
    variations: 2,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },
  Hh: {
    id: 'hills',
    name: 'Hills',
    color: '#a1a1aa',
    base: [
      '/assets/terrain/mountains/basic2.png',
      '/assets/terrain/mountains/basic3.png',
    ],
    variations: 2,
    transitions: true,
    zIndex: 2,
    layer: 3,
    offsetY: -5,
    movementCost: 2,
  },
  Mm: {
    id: 'mountain',
    name: 'Mountain',
    color: '#71717a',
    base: [
      '/assets/terrain/mountains/basic2.png',
      '/assets/terrain/mountains/basic3.png',
    ],
    variations: 2,
    transitions: true,
    zIndex: 3,
    layer: 3,
    offsetY: -15,
    movementCost: 3,
  },
  Ff: {
    id: 'forest',
    name: 'Forest',
    color: '#166534',
    base: [
      '/assets/terrain/forest/mixed.png',
      '/assets/terrain/forest/pine.png',
      '/assets/terrain/forest/tropical.png',
    ],
    variations: 3,
    transitions: true,
    zIndex: 2,
    layer: 3,
    offsetY: -10,
    movementCost: 2,
  },
  Jg: {
    id: 'jungle',
    name: 'Jungle',
    color: '#064e3b',
    base: [
      '/assets/terrain/forest/mixed.png',
      '/assets/terrain/forest/pine.png',
      '/assets/terrain/forest/tropical.png',
    ],
    variations: 3,
    transitions: true,
    zIndex: 2,
    layer: 3,
    offsetY: -10,
    isOverlay: true,
    movementCost: 2,
  },
  Rr: {
    id: 'river',
    name: 'River',
    color: '#0ea5e9',
    base: [
      '/assets/terrain/water/deep2.png',
      '/assets/terrain/water/ocean01.png',
      '/assets/terrain/water/ocean02.png',
      '/assets/terrain/water/ocean03.png',
    ],
    variations: 4,
    transitions: true,
    zIndex: 1,
    movementCost: 2,
  },
  Vi: {
    id: 'village',
    name: 'Village',
    color: '#ef4444',
    base: [
      '/assets/terrain/village/elven.png',
      '/assets/terrain/village/human.png',
      '/assets/terrain/village/orc.png',
    ],
    variations: 3,
    transitions: false,
    zIndex: 10,
    layer: 4,
    offsetY: -15,
    isOverlay: true,
    movementCost: 1,
  },
  Ca: {
    id: 'castle',
    name: 'Castle',
    color: '#52525b',
    base: [
      '/assets/terrain/castle/keep.png',
      '/assets/terrain/castle/ruin.png',
      '/assets/terrain/castle/village.png',
    ],
    variations: 3,
    transitions: false,
    zIndex: 10,
    layer: 4,
    offsetY: -15,
    isOverlay: true,
    movementCost: 1,
  },
};
