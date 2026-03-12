# Guía de Assets de Wesnoth para Epic Terrain Engine

## Resumen

El proyecto ahora incluye assets de terreno y unidades descargados desde el repositorio oficial de Wesnoth, utilizando la nomenclatura y estructura de directorios correcta.

## Estructura de Directorios

```
public/assets/
├── terrain/
│   ├── mountains/     # Montañas (basic, dry, snow, peak, volcano)
│   ├── grass/         # Hierba (green, green2, green3, green4, dry, light)
│   ├── water/         # Agua (deep, wave)
│   ├── forest/        # Bosques (pine, mixed, tropical)
│   ├── sand/          # Arena (beach, desert, dune)
│   ├── frozen/        # Hielo/nieve (snow, ice)
│   ├── castle/        # Castillos (keep, ruin, village)
│   └── village/       # Aldeas (human, orc, elven)
└── units/
    ├── elves-wood/    # Unidades élficas
    └── orcs/          # Unidades orcas
```

## Nomenclatura de Wesnoth

### Tiles Base
- `basic.png`, `basic2.png`, `basic3.png` - Variaciones visuales
- `basic-tile.png` - Tile completo para relleno

### Transiciones Hexagonales
- `basic-n.png` - Transición al norte
- `basic-ne.png` - Transición al noreste
- `basic-n-ne.png` - Transición a múltiples direcciones

### Clusters (Formaciones)
- `basic_range1_1.png` - Cluster de montañas (rangos 1-4)
- `basic5_1.png` - Formación de 5 hexágonos
- `basic6_1.png` - Formación de 6 hexágonos

## Uso en el Engine

### TerrainRegistry
El `TerrainRegistry` ahora usa los assets descargados:

```typescript
import { TERRAIN_REGISTRY } from '@/lib/terrain/TerrainRegistry';

// Acceder a las definiciones de terreno
const grassDef = TERRAIN_REGISTRY['Gg'];
const waterDef = TERRAIN_REGISTRY['Ww'];
```

### Generación de Transiciones
El sistema automáticamente genera transiciones basadas en:
1. Dirección de los vecinos (bits 0-5: n, ne, se, s, sw, nw)
2. Z-index de los terrenos (para determinar qué terreno se dibuja encima)

### Carga de Imágenes
El componente `HexGridRenderer` carga automáticamente:
1. Tiles base de cada terreno
2. Transiciones entre terrenos adyacentes
3. Unidades y decoraciones

## Scripts de Descarga

### Descargar Terrenos
```bash
npx tsx scripts/download-wesnoth-assets.ts
```

### Descargar Unidades
```bash
npx tsx scripts/download-units.ts
```

### Generar Registry Automático
```bash
npx tsx scripts/generate-terrain-registry.ts
```

## Configuración Actual

### Terrenos Habilitados con Transiciones
- Hierba (Gg)
- Agua (Ww)
- Arena (Ds)
- Desierto (Dd)
- Nieve (Aa)
- Colinas (Hh)
- Montañas (Mm)
- Bosques (Ff)
- Río (Rr)
- Tierra (Re)
- Camino (Rd)

### Terrenos sin Transiciones (Overlay)
- Aldeas (Vi)
- Castillo (Ca)
- Selva (Jg)

## Notas Importantes

1. **Nomenclatura Correcta**: Wesnoth usa "mountains" (plural), no "mountain"
2. **Transiciones Dinámicas**: Los archivos de transición se generan dinámicamente basados en la máscara de vecinos
3. **Fallback Automático**: Si un archivo no existe, se usa una imagen de fallback
4. **CDN Oficial**: Los assets se descargan de `https://cdn.jsdelivr.net/gh/wesnoth/wesnoth@master/`

## Problemas Comunes Solucionados

### Antes
- ❌ Rutas incorrectas: `terrain/mountain/basic.png` (debería ser `mountains`)
- ❌ Transiciones faltantes: Intentaba cargar `grass-to-water-n.png` (no existe)
- ❌ Nombres de archivos incorrectos: `green1.png` en lugar de `green.png`

### Después
- ✅ Rutas correctas: `terrain/mountains/basic.png`
- ✅ Transiciones funcionando: Usa `green-n.png` (formato Wesnoth)
- ✅ Nombres correctos: `green.png`, `green2.png`, etc.

## Próximos Pasos

1. Implementar sistema de carga de sprites WML para transiciones complejas
2. Agregar más terrenos (swamp, cave, chasm, etc.)
3. Implementar sistema de decoradores dinámicos
4. Optimizar carga de assets con lazy loading
