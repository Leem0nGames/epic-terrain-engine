# AGENTS.md - Guidelines for Epic Terrain Engine

This file provides essential information for agentic coding agents working on the Epic Terrain Engine project.

## Project Overview
Epic Terrain Engine is a Next.js-based terrain generation system using hexagonal grids, with TypeScript for type safety and Vitest for testing. The engine supports both noise-based and tectonic plate-based map generation.

## Directory Structure
```
/app                  - Next.js app router
/components           - React components
/lib                  - Core library code (terrain, hex, units, wml, math)
/tests                - Vitest test files
/public               - Static assets
```

## Development Commands

### Package Manager
This project uses npm (inferred from package-lock.json).

### Scripts (from package.json)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint on all files
- `npm run clean` - Clean Next.js cache
- `npm run test` - Run all Vitest tests

### Running Tests
- Run all tests: `npm test` or `vitest run`
- Run tests in watch mode: `vitest`
- Run a single test file: `vitest run tests/HexGrid.test.ts`
- Run tests matching a pattern: `vitest run -t "hex grid"` or `vitest run --testNamePattern="hex grid"`
- Run tests with coverage: `vitest run --coverage`

### Linting
- Run ESLint: `npm run lint`
- ESLint configuration extends `next` (see .eslintrc.json)

## Code Style Guidelines

### TypeScript
- Strict type checking enabled (tsconfig.json: "strict": true)
- No emission during development (tsconfig.json: "noEmit": true) - relies on Next.js compilation
- Path alias: `@/*` maps to project root (allows imports like `@/lib/terrain/MapGenerator`)
- JSX preservation: `"jsx": "preserve"` for Next.js compatibility

### Import Conventions
1. Relative imports for local files: `import { HexGrid } from '../lib/hex/HexGrid'`
2. Absolute imports using path alias: `import { MapGenerator } from '@/lib/terrain/MapGenerator'`
3. External libraries: `import { describe, it, expect } from 'vitest'`
4. Order: external libraries → internal absolute → internal relative

### Naming Conventions
- Types/Interfaces: PascalCase (e.g., `HexCoord`, `HexCell`, `Plate`)
- Classes: PascalCase (e.g., `HexGrid`, `MapGenerator`, `TectonicMapGenerator`)
- Functions/variables: camelCase (e.g., `getKey`, `hexToPixel`, `generatePlates`)
- Constants: UPPER_SNAKE_CASE (e.g., `PLATE_COUNT`, `RIVER_THRESHOLD`)
- Files: kebab-case for config, PascalCase for components/lib (observed: `HexGrid.test.ts`, `next.config.ts`)

### Formatting
- Primary formatter: None explicitly configured at root (relies on IDE/editor settings)
- ESLint handles some formatting via Next.js defaults
- Consider adding Prettier for consistent formatting if not present

### Documentation
- JSDoc comments are used in new tectonic plate files; follow existing patterns
- Complex functions should have inline comments explaining non-obvious logic
- Export comments for public APIs
- Tectonic plate implementation includes detailed comments explaining geological processes

### Error Handling
- Functions return `undefined` for missing values (e.g., `HexGrid.get()`)
- Boolean return for success/failure operations (e.g., `HexGrid.delete()`)
- Validate inputs in library functions and return sensible defaults or throw descriptive errors
- Height values are clamped to reasonable ranges (0-1) with allowances for mountain buildup

### Testing Practices (from test files)
- Use Vitest's `describe`, `it`, `expect`
- Tests are colocated in `/tests` directory with same naming as source (`*.test.ts`)
- Focus on unit testing individual functions/classes
- Mock external dependencies when necessary
- Test both positive and negative cases
- Test edge cases and boundary conditions

### Git Practices
- Commit messages should be concise and descriptive
- Branch naming: feature/, bugfix/, hotfix/, etc.
- Pull requests require review before merging

## Map Generation Systems

### Original Noise-Based System
Located in `/lib/terrain/MapGenerator.ts`:
- Uses multi-scale noise (continent and detail scales)
- Generates height, temperature, and moisture maps
- Applies biome classification rules
- Includes terrain smoothing, river generation, and decorations

### Tectonic Plate System
Located in `/lib/terrain/TectonicMapGenerator.ts` and `/lib/terrain/TectonicPlate.ts`:
- Simulates plate tectonics for realistic geological features
- Generates plates with random positions, velocities, and types (oceanic/continental)
- Calculates plate interactions (convergent, divergent, transform boundaries)
- Applies erosion and noise detail for realism
- Converts height maps to terrain types with biome classification
- Includes river generation and visual variants

## When to Use Each System
- **Noise-based**: Faster generation, good for quick prototypes or when geological accuracy isn't critical
- **Tectonic plate**: Slower but produces more realistic continents, mountain ranges, and geological features

## When in Doubt
1. Examine existing files in the same directory for patterns
2. Check tsconfig.json and .eslintrc.json for compiler/linter rules
3. Look at test files to understand expected behavior
4. Run `npm run lint` to catch style issues before committing
5. For map generation, compare outputs of both systems to understand trade-offs