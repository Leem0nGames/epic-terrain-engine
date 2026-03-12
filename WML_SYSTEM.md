# Sistema WML y Caché de Assets para Epic Terrain Engine

## Resumen

Se ha implementado un sistema completo de manejo de assets inspirado en Wesnoth, que incluye:

1. **Sistema de Caché**: Evita descargar archivos que no existen o ya están localmente
2. **Sistema WML**: Reglas de transición basadas en el sistema de Wesnoth
3. **Transiciones Adicionales**: Descarga de combinaciones de direcciones

## 1. Sistema de Caché (TerrainCache)

### Características
- Verifica si un archivo existe localmente antes de descargarlo
- Guarda un índice de archivos conocidos (existentes y no existentes)
- Limpia automáticamente cachés antiguas (más de 7 días)
- Reduce tiempo de descarga y evita errores 404

### Archivos
- `lib/terrain/TerrainCache.ts`: Clase principal de caché
- `data/terrain-cache.json`: Índice de caché persistente

### Uso
```typescript
import { TerrainCache } from '@/lib/terrain/TerrainCache';

// Verificar si un archivo existe
if (TerrainCache.exists('mountains/basic-n.png')) {
  console.log('Archivo en caché');
}

// Marcar un archivo como existente/no existente
TerrainCache.setExists('mountains/basic-n.png', true);
```

## 2. Sistema WML (Wesnoth Markup Language)

### Características
- Define reglas de transición basadas en máscaras de bits
- Prioriza transiciones más específicas (más direcciones = mayor prioridad)
- Soporta múltiples terrenos y combinaciones de direcciones

### Estructura de Reglas
```typescript
interface WMLTransitionRule {
  id: string;
  source: string;      // Código de terreno origen (ej: 'Mm')
  target: string;      // Código de terreno destino (ej: 'Gg')
  mask: number;        // Máscara de bits (0-63)
  priority: number;    // Prioridad (más alta = más específica)
  image: string;       // Ruta de la imagen de transición
}
```

### Reglas Predefinidas
El sistema genera automáticamente reglas para:
- 6 direcciones individuales (N, NE, SE, S, SW, NW)
- 6 pares adyacentes (N-NE, NE-SE, SE-S, S-SW, SW-NW, NW-N)
- 6 triples de direcciones
- 6 pares opuestos (N-S, NE-SW, SE-NW)

### Uso
```typescript
import { WMLRules } from '@/lib/terrain/WMLRules';

// Obtener imagen para una transición
const image = WMLRules.getImage('Mm', 'Gg', 0b000011); // Máscara para N y NE
// Retorna: 'mountains/basic-n-ne.png'
```

## 3. Transiciones Adicionales

### Combinaciones Descargadas
El script de descarga ahora intenta descargar transiciones para:
- **Pares adyacentes**: n-ne, ne-se, se-s, s-sw, sw-nw, nw-n
- **Triples**: n-ne-se, ne-se-s, se-s-sw, s-sw-nw, sw-nw-n, nw-n-ne
- **Pares opuestos**: n-s, ne-sw, se-nw

### Archivos Descargados
```
mountains/
  basic-n-ne.png    ✅
  basic-ne-se.png   ✅
  basic-se-s.png    ✅
  ... (otros combinados)
```

## 4. Flujo de Transiciones

1. **Generación de Mapa**: Se calcula la máscara de transición para cada celda
2. **Búsqueda de Regla WML**: El sistema busca una regla que coincida con la máscara
3. **Generación de URL**: Si existe regla WML, se usa; si no, se genera URL base
4. **Caché**: Antes de descargar, se verifica si el archivo existe localmente
5. **Fallback**: Si no existe, se usa el sistema de fallback del renderizador

## 5. Scripts de Descarga

### Descarga de Assets
```bash
npx tsx scripts/download-wesnoth-assets.ts
```

Este script:
1. Limpia cachés antiguas
2. Descarga assets base y transiciones
3. Descarga transiciones adicionales (combinaciones)
4. Guarda el índice de caché

### Descarga de Unidades
```bash
npx tsx scripts/download-units.ts
```

## 6. Estructura de Directorios

```
lib/terrain/
  TerrainCache.ts      # Sistema de caché
  WMLRules.ts          # Reglas WML
  TerrainRegistry.ts   # Registro de terrenos
  TransitionResolver.ts # Resolución de transiciones

data/
  terrain-cache.json   # Índice de caché
  terrain-assets.json  # Estructura de assets

public/assets/terrain/
  mountains/           # Montañas (basic, dry, snow, peak, volcano)
  grass/               # Hierba (green, green2, green3, green4, dry, light)
  water/               # Agua (deep, wave)
  forest/              # Bosques (pine, mixed, tropical)
  sand/                # Arena (beach, desert, dune)
  frozen/              # Hielo/nieve (snow, ice)
  castle/              # Castillos (keep, ruin, village)
  village/             # Aldeas (human, orc, elven)
```

## 7. Próximos Pasos

1. **Optimización de WML**: Agregar más reglas para terrenos específicos
2. **Sistema de Macro**: Implementar macros WML para generación procedural
3. **Cache de Imágenes**: Cache de texturas renderizadas en memoria
4. **Lazy Loading**: Carga diferida de assets según viewport

## 8. Referencias

- [Wesnoth WML Reference](https://wiki.wesnoth.org/WML)
- [Wesnoth Terrain Graphics](https://wiki.wesnoth.org/TerrainGraphicsWML)
- [Wesnoth Image Path](https://wiki.wesnoth.org/ImagePathWML)
