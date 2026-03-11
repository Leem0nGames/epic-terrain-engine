import { MacroTerrainRule } from './MacroRuleEngine';

export const MACRO_RULES: MacroTerrainRule[] = [
  // Sand island in grass (single sand cell completely surrounded by grass)
  {
    id: 'sand-island-in-grass',
    pattern: [
      ['Gg', 'Gg', '*'],
      ['Gg', 'Ds', 'Gg'],
      ['Gg', 'Gg', '*']
    ],
    center: [1, 1],
    sprite: 'sand/beach.png', // Use regular sand sprite
    layer: 2,
    rotatable: false, // Sand island doesn't need rotation
    priority: 10, // High priority for small features
    probability: 0.8 // 80% chance when conditions are met
  },
  // Lake formation (flat area surrounded by higher terrain)
  {
    id: 'lake-basin',
    pattern: [
      ['Hh', 'Hh', 'Hh', 'Hh', 'Hh'],
      ['Hh', 'Mm', 'Mm', 'Mm', 'Hh'],
      ['Hh', 'Mm', 'Gg', 'Mm', 'Hh'], // Grass lake bed
      ['Hh', 'Mm', 'Mm', 'Mm', 'Hh'],
      ['Hh', 'Hh', 'Hh', 'Hh', 'Hh']
    ],
    center: [2, 2],
    sprite: 'water/ocean01.png', // Use shallow water variant
    layer: 1,
    rotatable: false,
    priority: 8, // High priority for lakes
    probability: 0.6 // 60% chance when conditions are met
  },
  // Mountain pass
  {
    id: 'mountain-pass',
    pattern: [
      ['Mm', 'Mm', 'Mm', 'Mm', 'Mm'],
      ['Mm', 'Hh', 'Hh', 'Hh', 'Mm'],
      ['Mm', 'Hh', 'Gg', 'Hh', 'Mm'], // Grass corridor
      ['Mm', 'Hh', 'Hh', 'Hh', 'Mm'],
      ['Mm', 'Mm', 'Mm', 'Mm', 'Mm']
    ],
    center: [2, 2],
    sprite: 'hills/regular.png',
    layer: 2,
    rotatable: false,
    priority: 7, // Medium-high priority
    probability: 0.4 // 40% chance when conditions are met
  },
  // Peninsula formation
  {
    id: 'peninsula',
    pattern: [
      ['Ww', 'Ww', 'Ww', '*', '*'],
      ['Ww', 'Ww', 'Gg', 'Gg', '*'],
      ['Ww', 'Ww', 'Ww', 'Ww', '*'],
      ['*', '*', '*', '*', '*'],
      ['*', '*', '*', '*', '*']
    ],
    center: [1, 2],
    sprite: 'sand/beach.png',
    layer: 1,
    rotatable: true,
    priority: 6, // Medium priority
    probability: 0.3 // 30% chance when conditions are met
  },
  // River delta (where river meets ocean/wide water)
  {
    id: 'river-delta',
    pattern: [
      ['*', 'Ww', 'Ww', 'Ww', '*'],
      ['*', 'Ww', 'Rr', 'Ww', '*'],
      ['*', 'Ww', 'Ww', 'Ww', '*'],
      ['*', '*', '*', '*', '*'],
      ['*', '*', '*', '*', '*']
    ],
    center: [1, 2],
    sprite: 'water/ocean02.png', // Slightly different water for delta
    layer: 1,
    rotatable: true,
    priority: 9, // High priority for deltas
    probability: 0.5 // 50% chance when conditions are met
  },
  // Oasis (water spot in desert)
  {
    id: 'oasis',
    pattern: [
      ['Dd', 'Dd', 'Dd', 'Dd', 'Dd'],
      ['Dd', 'Dd', 'Ww', 'Dd', 'Dd'],
      ['Dd', 'Dd', 'Gg', 'Dd', 'Dd'], // Vegetation around water
      ['Dd', 'Dd', 'Ww', 'Dd', 'Dd'],
      ['Dd', 'Dd', 'Dd', 'Dd', 'Dd']
    ],
    center: [2, 2],
    sprite: 'water/ocean01.png',
    layer: 1,
    rotatable: false,
    priority: 8, // High priority for oasis
    probability: 0.2 // 20% chance when conditions are met (rare)
  },
  // River cross intersection
  {
    id: 'river-cross',
    pattern: [
      ['*', 'Rr', '*'],
      ['Rr', 'Rr', 'Rr'],
      ['*', 'Rr', '*']
    ],
    center: [1, 1],
    sprite: 'water/ford.png', // Placeholder
    layer: 2,
    rotatable: true,
    priority: 5, // Medium priority
    probability: 0.7 // 70% chance when conditions are met
  },
  // River straight (W to E)
  {
    id: 'river-straight',
    pattern: [
      ['*', '*', '*'],
      ['Rr', 'Rr', 'Rr'],
      ['*', '*', '*']
    ],
    center: [1, 1],
    sprite: 'water/ford.png', // Placeholder
    layer: 2,
    rotatable: true,
    priority: 4, // Lower priority for straight rivers
    probability: 0.9 // 90% chance when conditions are met (common)
  },
  // River corner (NW to W)
  {
    id: 'river-corner',
    pattern: [
      ['Rr', '*', '*'],
      ['Rr', 'Rr', '*'],
      ['*', '*', '*']
    ],
    center: [1, 1],
    sprite: 'water/ford.png', // Placeholder
    layer: 2,
    rotatable: true,
    priority: 5, // Medium priority
    probability: 0.6 // 60% chance when conditions are met
  },
  // Road cross intersection
  {
    id: 'road-cross',
    pattern: [
      ['*', 'Rd', '*'],
      ['Rd', 'Rd', 'Rd'],
      ['*', 'Rd', '*']
    ],
    center: [1, 1],
    sprite: 'flat/road.png', // Placeholder
    layer: 2,
    rotatable: true,
    priority: 3, // Lower priority for roads
    probability: 0.4 // 40% chance when conditions are met
  },
  // Road straight (W to E)
  {
    id: 'road-straight',
    pattern: [
      ['*', '*', '*'],
      ['Rd', 'Rd', 'Rd'],
      ['*', '*', '*']
    ],
    center: [1, 1],
    sprite: 'flat/road.png', // Placeholder
    layer: 2,
    rotatable: true,
    priority: 2, // Lowest priority for straight roads
    probability: 0.5 // 50% chance when conditions are met
  },
  // Road corner (NW to W)
  {
    id: 'road-corner',
    pattern: [
      ['Rd', '*', '*'],
      ['Rd', 'Rd', '*'],
      ['*', '*', '*']
    ],
    center: [1, 1],
    sprite: 'flat/road.png', // Placeholder
    layer: 2,
    rotatable: true,
    priority: 3, // Lower priority for roads
    probability: 0.3 // 30% chance when conditions are met
  }
];
