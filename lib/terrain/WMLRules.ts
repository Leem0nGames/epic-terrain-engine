/**
 * Sistema WML (Wesnoth Markup Language) para transiciones complejas
 * Implementa reglas de transición basadas en el sistema de Wesnoth
 */

export interface WMLTransitionRule {
  id: string;
  source: string;
  target: string;
  mask: number; // Máscara de bits para direcciones
  priority: number;
  image: string;
}

export interface WMLTerrainType {
  id: string;
  name: string;
  editor_group: string;
  transitions: WMLTransitionRule[];
}

export class WMLRules {
  private static rules: Map<string, WMLTransitionRule[]> = new Map();
  private static terrainTypes: Map<string, WMLTerrainType> = new Map();

  /**
   * Inicializar reglas WML predefinidas
   */
  static initialize(): void {
    // Reglas de transición para montañas
    this.addRule({
      id: 'mountains-to-grass',
      source: 'Mm', // Montaña
      target: 'Gg', // Hierba
      mask: 0b111111, // Todas las direcciones
      priority: 100,
      image: 'mountains/basic.png'
    });

    this.addRule({
      id: 'mountains-to-water',
      source: 'Mm',
      target: 'Ww',
      mask: 0b111111,
      priority: 90,
      image: 'mountains/basic.png'
    });

    // Reglas para transiciones específicas de dirección
    const directions = [
      { bit: 0, name: 'n', mask: 0b000001 },
      { bit: 1, name: 'ne', mask: 0b000010 },
      { bit: 2, name: 'se', mask: 0b000100 },
      { bit: 3, name: 's', mask: 0b001000 },
      { bit: 4, name: 'sw', mask: 0b010000 },
      { bit: 5, name: 'nw', mask: 0b100000 },
    ];

    // Generar reglas para cada combinación de direcciones
    for (let mask = 1; mask < 64; mask++) {
      const setBits: number[] = [];
      for (let i = 0; i < 6; i++) {
        if (mask & (1 << i)) {
          setBits.push(i);
        }
      }

      if (setBits.length > 0) {
        const suffix = setBits.map(i => directions[i].name).join('-');
        
        // Regla para montañas
        this.addRule({
          id: `mountains-${suffix}`,
          source: 'Mm',
          target: 'Gg',
          mask: mask,
          priority: 100 + setBits.length,
          image: `mountains/basic-${suffix}.png`
        });

        // Regla para hierba
        this.addRule({
          id: `grass-${suffix}`,
          source: 'Gg',
          target: 'Ww',
          mask: mask,
          priority: 100 + setBits.length,
          image: `grass/green-${suffix}.png`
        });

        // Regla para agua
        this.addRule({
          id: `water-${suffix}`,
          source: 'Ww',
          target: 'Gg',
          mask: mask,
          priority: 100 + setBits.length,
          image: `water/deep-${suffix}.png`
        });
      }
    }
  }

  /**
   * Agregar una regla de transición
   */
  static addRule(rule: WMLTransitionRule): void {
    const key = `${rule.source}-${rule.target}`;
    if (!this.rules.has(key)) {
      this.rules.set(key, []);
    }
    this.rules.get(key)!.push(rule);
  }

  /**
   * Obtener la regla más apropiada para una máscara dada
   */
  static getRule(source: string, target: string, mask: number): WMLTransitionRule | null {
    const key = `${source}-${target}`;
    const rules = this.rules.get(key);
    
    if (!rules) return null;

    // Filtrar reglas que coincidan con la máscara
    const matchingRules = rules.filter(rule => (rule.mask & mask) === mask);
    
    if (matchingRules.length === 0) return null;

    // Ordenar por prioridad (más bits = más específico = mayor prioridad)
    matchingRules.sort((a, b) => b.priority - a.priority);

    return matchingRules[0];
  }

  /**
   * Obtener imagen para una transición
   */
  static getImage(source: string, target: string, mask: number): string | null {
    const rule = this.getRule(source, target, mask);
    return rule ? rule.image : null;
  }

  /**
   * Registrar un tipo de terreno
   */
  static registerTerrainType(type: WMLTerrainType): void {
    this.terrainTypes.set(type.id, type);
  }

  /**
   * Obtener tipo de terreno por ID
   */
  static getTerrainType(id: string): WMLTerrainType | undefined {
    return this.terrainTypes.get(id);
  }
}

// Inicializar reglas al cargar el módulo
WMLRules.initialize();
