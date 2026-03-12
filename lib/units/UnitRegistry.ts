export interface UnitType {
  id: string;
  name: string;
  sprite: string;
  maxHp: number;
  maxMovement: number;
  alignment: 'lawful' | 'neutral' | 'chaotic';
  attacks: { name: string; damage: number; strikes: number; type: 'melee' | 'ranged' }[];
}

export interface UnitInstance {
  id: string;
  typeId: string;
  q: number;
  r: number;
  hp: number;
  movementLeft: number;
  faction: number; // 0 for player, 1 for enemy
}

// Using local asset paths for unit sprites
export const UNIT_REGISTRY: Record<string, UnitType> = {
  'elvish-fighter': {
    id: 'elvish-fighter',
    name: 'Elvish Fighter',
    sprite: '/assets/units/elves-wood/fighter.png',
    maxHp: 33,
    maxMovement: 5,
    alignment: 'neutral',
    attacks: [
      { name: 'sword', damage: 5, strikes: 4, type: 'melee' },
      { name: 'bow', damage: 3, strikes: 3, type: 'ranged' }
    ]
  },
  'orcish-grunt': {
    id: 'orcish-grunt',
    name: 'Orcish Grunt',
    sprite: '/assets/units/orcs/grunt.png',
    maxHp: 38,
    maxMovement: 5,
    alignment: 'chaotic',
    attacks: [
      { name: 'sword', damage: 9, strikes: 2, type: 'melee' }
    ]
  }
};
