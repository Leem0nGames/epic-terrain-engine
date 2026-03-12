# Sistemas Avanzados de Epic Terrain Engine

## Resumen

Se han implementado 3 sistemas avanzados para mejorar el rendimiento y la flexibilidad del engine:

1. **Sistema Macro WML**: Reglas de transición basadas en el sistema de Wesnoth
2. **Caché de Texturas**: Almacenamiento en memoria de texturas renderizadas
3. **Lazy Loading**: Carga de assets según el viewport

## 1. Sistema Macro WML (MacroWML)

### Concepto
Simula el sistema de macros de Wesnoth para generación procedural de terrenos.

### Estructura

```typescript
interface WMLElement {
  [key: string]: any; // Elemento flexible para reglas WML
}

interface WMLRule {
  id: string;
  conditions: WMLElement[]; // Condiciones para aplicar la regla
  actions: WMLElement[];    // Acciones a ejecutar
  priority: number;         // Prioridad (más alta = más específico)
}
```

### Reglas Predefinidas

El sistema genera automáticamente reglas para:
- **Terrenos base**: Montañas, hierba, agua, bosques
- **Transiciones individuales**: N, NE, SE, S, SW, NW
- **Transiciones combinadas**: N-NE, NE-SE, etc.
- **Máscaras de bits**: 0-63 combinaciones posibles

### Uso

```typescript
import { MacroWML } from '@/lib/terrain/MacroWML';

// Evaluar reglas para un terreno
const neighbors = new Map<string, string>();
neighbors.set('n', 'Gg');
neighbors.set('ne', 'Gg');

const images = MacroWML.evaluate('Mm', neighbors);
// Retorna: ['mountains/basic-n-ne.png']
```

### Ejemplo de Regla

```typescript
{
  id: 'mountains_to_grass_n_ne',
  conditions: [
    { type: 'terrain', id: 'Mm' },
    { type: 'has_neighbor', terrain: 'Gg', direction: 'n' },
    { type: 'has_neighbor', terrain: 'Gg', direction: 'ne' }
  ],
  actions: [
    { type: 'image', filename: 'mountains/basic-n-ne.png' }
  ],
  priority: 200
}
```

## 2. Caché de Texturas (TextureCache)

### Concepto
Almacena texturas ya renderizadas en memoria para evitar recálculos.

### Características

- **Almacenamiento en memoria**: Texturas en formato Canvas
- **Evicción LRU**: Elimina texturas menos usadas cuando se excede el límite
- **Estadísticas**: Seguimiento de hits/misses
- **Generación de claves**: Claves únicas para cada textura

### Límites

- **Máximo**: 100 texturas en caché
- **Evicción**: Elimina el 10% menos usado cuando se excede el límite

### Uso

```typescript
import { TextureCache } from '@/lib/terrain/TextureCache';

// Generar clave para textura
const key = TextureCache.generateKey('Mm', 0, 0b000011);

// Verificar si existe en caché
if (TextureCache.has(key)) {
  const texture = TextureCache.get(key);
  // Usar textura cacheada
} else {
  // Generar nueva textura
  const canvas = renderTexture('Mm', 0, 0b000011);
  TextureCache.set(key, canvas);
}

// Obtener estadísticas
const stats = TextureCache.getStats();
console.log(`Caché: ${stats.size}, Ratio: ${(stats.ratio * 100).toFixed(1)}%`);
```

### Clave de Textura

La clave sigue el formato: `{terrainCode}_{variation}_{mask}`
Ejemplo: `Mm_0_3` (Montaña, variación 0, máscara 3)

## 3. Lazy Asset Loader (LazyAssetLoader)

### Concepto
Carga assets solo cuando son necesarios basados en el viewport.

### Características

- **Viewport-based**: Carga solo assets visibles
- **Prioridad**: Assets importantes se cargan primero
- **Límite concurrente**: Máximo 5 cargas simultáneas
- **Precarga**: Precarga assets para áreas específicas

### Uso

```typescript
import { LazyAssetLoader } from '@/lib/terrain/LazyAssetLoader';

// Actualizar viewport
LazyAssetLoader.updateViewport({
  left: 0,
  right: 1000,
  top: 0,
  bottom: 800
});

// Solicitar carga de asset
LazyAssetLoader.requestAsset('/assets/terrain/mountains/basic-n.png', 1);

// Verificar si está cargado
if (LazyAssetLoader.isLoaded(url)) {
  // Usar asset
}

// Precargar área
LazyAssetLoader.preloadArea(bounds, assets);
```

### Estadísticas

```typescript
const stats = LazyAssetLoader.getStats();
// { loaded: 50, queue: 10, concurrent: 2 }
```

## 4. Integración en HexGridRenderer

Los 3 sistemas se integran en el flujo de renderizado:

1. **LazyAssetLoader** solicita assets necesarios para el viewport
2. **TextureCache** verifica si la textura ya está en memoria
3. **MacroWML** determina qué imagen usar basado en reglas
4. **HexGridRenderer** renderiza usando texturas cacheadas

### Flujo de Renderizado

```
Viewport actual → LazyAssetLoader → Assets necesarios
                                      ↓
                               TextureCache → ¿Existe?
                                      ↓
                               MacroWML → ¿Qué imagen usar?
                                      ↓
                               HexGridRenderer → Renderizar
```

## 5. Mejoras de Rendimiento

### Antes
- Todos los assets se cargaban al iniciar
- Texturas se recalculaban cada frame
- Transiciones se buscaban en cada render

### Después
- Assets se cargan según necesidad
- Texturas se cachean en memoria
- Transiciones se evalúan con reglas WML

### Resultados Esperados
- **Reducción de memoria**: ~40% menos de uso
- **Mejora de rendimiento**: ~30% más rápido
- **Carga inicial**: ~60% más rápida

## 6. Próximos Pasos

### Sistema Macro WML
- [ ] Agregar más reglas para terrenos específicos
- [ ] Implementar sistema de herencia de reglas
- [ ] Soporte para macros anidadas

### Caché de Texturas
- [ ] Implementar caché a nivel de GPU (WebGL)
- [ ] Agregar compresión de texturas
- [ ] Sistema de prefetching automático

### Lazy Loading
- [ ] Implementar carga progresiva por chunks
- [ ] Agregar sistema de priorización dinámica
- [ ] Soporte para múltiples resoluciones

## 7. Referencias

- [Wesnoth WML Reference](https://wiki.wesnoth.org/WML)
- [WebGL Texture Caching](https://webglfundamentals.org/webgl/lessons/webgl-caching-textures.html)
- [Lazy Loading Patterns](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
