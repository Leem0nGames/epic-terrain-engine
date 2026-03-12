/**
 * Sistema Macro WML para Epic Terrain Engine
 * Simula el sistema de macros de Wesnoth para generación procedural
 */

export interface WMLElement {
  [key: string]: any;
}

export interface WMLMacro {
  id: string;
  params: string[];
  body: WMLElement[];
}

export interface WMLRule {
  id: string;
  conditions: WMLElement[];
  actions: WMLElement[];
  priority: number;
}

export class MacroWML {
  private static macros: Map<string, WMLMacro> = new Map();
  private static rules: WMLRule[] = [];
  private static terrainGraphics: Map<string, string[]> = new Map();

  /**
   * Inicializar macros predefinidas
   */
  static initialize(): void {
    // Macro para transiciones básicas
    this.registerMacro({
      id: 'terrain_transition',
      params: ['source', 'target', 'image', 'priority'],
      body: [
        { type: 'image', layer: 0, filename: '$image' },
        { type: 'mask', source: '$source', target: '$target' }
      ]
    });

    // Macro para transiciones de múltiples direcciones
    this.registerMacro({
      id: 'terrain_transition_multi',
      params: ['source', 'target', 'images', 'priority'],
      body: [
        { type: 'image_layer', images: '$images' },
        { type: 'mask_multi', source: '$source', target: '$target' }
      ]
    });

    // Macro para decoradores
    this.registerMacro({
      id: 'terrain_decorator',
      params: ['terrain', 'image', 'probability'],
      body: [
        { type: 'decorator', terrain: '$terrain', image: '$image', probability: '$probability' }
      ]
    });

    // Registrar reglas predefinidas
    this.registerRules();
  }

  /**
   * Registrar una macro
   */
  static registerMacro(macro: WMLMacro): void {
    this.macros.set(macro.id, macro);
  }

  /**
   * Registrar reglas predefinidas
   */
  static registerRules(): void {
    // Reglas para montañas
    this.addRule({
      id: 'mountains_basic',
      conditions: [
        { type: 'terrain', id: 'Mm' }
      ],
      actions: [
        { type: 'image', filename: 'mountains/basic.png' }
      ],
      priority: 100
    });

    // Reglas para transiciones de montaña a hierba
    this.addRule({
      id: 'mountains_to_grass_n',
      conditions: [
        { type: 'terrain', id: 'Mm' },
        { type: 'has_neighbor', terrain: 'Gg', direction: 'n' } as WMLElement
      ],
      actions: [
        { type: 'image', filename: 'mountains/basic-n.png' }
      ],
      priority: 150
    });

    this.addRule({
      id: 'mountains_to_grass_n_ne',
      conditions: [
        { type: 'terrain', id: 'Mm' },
        { type: 'has_neighbor', terrain: 'Gg', direction: 'n' } as WMLElement,
        { type: 'has_neighbor', terrain: 'Gg', direction: 'ne' } as WMLElement
      ],
      actions: [
        { type: 'image', filename: 'mountains/basic-n-ne.png' }
      ],
      priority: 200
    });

    // Reglas para hierba
    this.addRule({
      id: 'grass_basic',
      conditions: [
        { type: 'terrain', id: 'Gg' }
      ],
      actions: [
        { type: 'image', filename: 'grass/green.png' }
      ],
      priority: 100
    });

    // Reglas para agua
    this.addRule({
      id: 'water_basic',
      conditions: [
        { type: 'terrain', id: 'Ww' }
      ],
      actions: [
        { type: 'image', filename: 'water/deep.png' }
      ],
      priority: 100
    });

    // Reglas para bosques
    this.addRule({
      id: 'forest_basic',
      conditions: [
        { type: 'terrain', id: 'Ff' }
      ],
      actions: [
        { type: 'image', filename: 'forest/pine.png' }
      ],
      priority: 100
    });

    // Reglas para transiciones complejas
    this.addComplexRules();
  }

  /**
   * Agregar reglas complejas para diferentes combinaciones
   */
  static addComplexRules(): void {
    const directions = ['n', 'ne', 'se', 's', 'sw', 'nw'];
    const terrains = [
      { source: 'Mm', target: 'Gg', base: 'mountains/basic' },
      { source: 'Gg', target: 'Ww', base: 'grass/green' },
      { source: 'Ww', target: 'Gg', base: 'water/deep' },
      { source: 'Ff', target: 'Gg', base: 'forest/pine' }
    ];

    // Generar reglas para cada combinación de direcciones
    for (const terrain of terrains) {
      for (let mask = 1; mask < 64; mask++) {
        const setBits: number[] = [];
        for (let i = 0; i < 6; i++) {
          if (mask & (1 << i)) {
            setBits.push(i);
          }
        }

        if (setBits.length > 0) {
          const suffix = setBits.map(i => directions[i]).join('-');
          const conditions: WMLElement[] = [
            { type: 'terrain', id: terrain.source }
          ];

          for (const bit of setBits) {
            const dir = directions[bit];
            if (dir) {
              conditions.push({
                type: 'has_neighbor',
                terrain: terrain.target,
                direction: dir
              });
            }
          }

          this.addRule({
            id: `${terrain.source}_to_${terrain.target}_${suffix}`,
            conditions,
            actions: [
              { type: 'image', filename: `${terrain.base}-${suffix}.png` }
            ],
            priority: 100 + setBits.length * 10
          });
        }
      }
    }
  }

  /**
   * Agregar una regla
   */
  static addRule(rule: WMLRule): void {
    this.rules.push(rule);
    // Ordenar por prioridad descendente
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluar reglas para un terreno específico
   */
  static evaluate(terrainId: string, neighbors: Map<string, string>): string[] {
    const images: string[] = [];

    for (const rule of this.rules) {
      let matches = true;

      // Verificar condiciones
      for (const condition of rule.conditions) {
        if (condition.type === 'terrain') {
          if (condition.id !== terrainId) {
            matches = false;
            break;
          }
        } else if (condition.type === 'has_neighbor') {
          const neighborTerrain = neighbors.get(condition.direction || '');
          if (neighborTerrain !== condition.terrain) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        // Aplicar acciones
        for (const action of rule.actions) {
          if (action.type === 'image' && action.filename) {
            images.push(action.filename);
          }
        }
        // Solo aplicamos la primera regla que coincida (prioridad más alta)
        break;
      }
    }

    return images;
  }

  /**
   * Obtener macro por ID
   */
  static getMacro(id: string): WMLMacro | undefined {
    return this.macros.get(id);
  }

  /**
   * Obtener todas las reglas
   */
  static getRules(): WMLRule[] {
    return this.rules;
  }
}

// Inicializar al cargar el módulo
MacroWML.initialize();
