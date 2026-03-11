import { HexGrid, HexCell } from '../hex/HexGrid';
import { Noise } from '../math/Noise';
import {
  Plate,
  generatePlates,
  assignPlateToHex,
  calculatePlateEffects,
  applyErosion,
  addNoiseDetail,
  heightToTerrain
} from './TectonicPlate';

export interface TectonicMapGenConfig {
  width: number;
  height: number;
  seed: number;
  plateCount?: number;
  erosionIterations?: number;
  erosionFactor?: number;
  noiseScale?: number;
  noiseStrength?: number;
}

/**
 * Tectonic Plate Map Generator
 * Generates maps using plate tectonics for realistic geological features
 */
export class TectonicMapGenerator {
  static generate(config: TectonicMapGenConfig): HexGrid {
    const { 
      width, 
      height, 
      seed,
      plateCount = 12,
      erosionIterations = 3,
      erosionFactor = 0.1,
      noiseScale = 0.05,
      noiseStrength = 0.1
    } = config;

    // Step 1: Generate tectonic plates
    const plates = generatePlates(plateCount, width, height, seed);

    // Step 2: Calculate initial height map from plate effects
    let heightMap = calculatePlateEffects(plates, width, height);

    // Step 3: Apply erosion with hydraulic and thermal simulation
    heightMap = applyErosion(heightMap, erosionFactor, erosionIterations, 0.3, 0.5);

    // Step 4: Add noise detail for micro-variation
    heightMap = addNoiseDetail(heightMap, noiseScale, noiseStrength, seed + 1000);

    // Step 5: Generate temperature map (depends on latitude and noise)
    const temperatureMap: number[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(0));
    
    // Step 5.5: Generate moisture map with river influence
    const moistureMap: number[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(0));

    // Generate temperature map (depends on latitude and noise)
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        // Adjust q for axial coordinates to make a rectangular map
        const axialQ = q - Math.floor(r / 2);
        const axialR = r;

        // Temperature map (depends on latitude and noise)
        const lat = Math.abs((r / height) - 0.5) * 2; // 0 at equator, 1 at poles
        const tNoise = Noise.fbm(axialQ * 0.05, axialR * 0.05, 3, seed + 100);
        temperatureMap[r][q] = (1 - lat) * 0.6 + tNoise * 0.4;
      }
    }

    // Generate base moisture map (depends on latitude and noise)
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        // Adjust q for axial coordinates to make a rectangular map
        const axialQ = q - Math.floor(r / 2);
        const axialR = r;

        // Base moisture map
        moistureMap[r][q] = Noise.fbm(axialQ * 0.08, axialR * 0.08, 3, seed + 200);
      }
    }

    // Add moisture from rivers and nearby water
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        // Add moisture bonus based on proximity to water
        let waterBonus = 0;
        const checkRadius = 3;
        
        for (let dr = -checkRadius; dr <= checkRadius; dr++) {
          for (let dq = -checkRadius; dq <= checkRadius; dq++) {
            const checkQ = q + dq;
            const checkR = r + dr;
            
            // Skip if out of bounds
            if (checkQ < 0 || checkQ >= width || checkR < 0 || checkR >= height) continue;
            
            // Skip the center cell
            if (dq === 0 && dr === 0) continue;
            
            // Calculate distance
            const distance = Math.sqrt(dq * dq + dr * dr);
            if (distance > checkRadius) continue;
            
            // Check if this neighbor is water
            const neighborHeight = heightMap[checkR][checkQ];
            if (neighborHeight < 0.3) { // Water threshold
              // Closer water = more moisture bonus
              waterBonus += (0.2 / (distance + 0.5));
            }
          }
        }
        
        // Apply moisture bonus (capped)
        moistureMap[r][q] = Math.min(1.0, moistureMap[r][q] + waterBonus);
      }
    }

    // Step 6: Create HexGrid and populate cells
    const grid = new HexGrid();

    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        // Adjust q for axial coordinates to make a rectangular map
        const axialQ = q - Math.floor(r / 2);
        const axialR = r;

        const height = heightMap[r][q];
        const temperature = temperatureMap[r][q];
        const moisture = moistureMap[r][q];

        // Determine terrain type from height, moisture, and temperature
        const { terrainCode, overlay } = heightToTerrain(height, moisture, temperature);

        const cell: HexCell = {
          q: axialQ,
          r: axialR,
          terrainCode: terrainCode,
          overlay: overlay,
          decoration: null,
          neighbors: [],
          transitionMasks: new Map(),
          variation: 0,
          height: height,
          moisture: moisture,
          temperature: temperature
        };

        grid.set(axialQ, axialR, cell);
      }
    }

    // Populate neighbors before smoothing
    for (const cell of grid.values()) {
      cell.neighbors = grid.getNeighbors(cell);
    }

    // Apply terrain smoothing (similar to original MapGenerator)
    for (let i = 0; i < 3; i++) {
      TectonicMapGenerator.smoothTerrain(grid);
    }

    // Generate rivers and flow map
    TectonicMapGenerator.generateRivers(grid);

    // Add visual variants and decorations
    TectonicMapGenerator.addVariantsAndDecorations(grid, seed);

    return grid;
  }

  private static smoothTerrain(grid: HexGrid): void {
    const changes = new Map<string, { terrainCode: string, overlay: string | null }>();

    for (const cell of grid.values()) {
      const neighbors = cell.neighbors.filter(n => n !== null) as HexCell[];
      
      // Count terrain types
      const counts = new Map<string, number>();
      const overlayCounts = new Map<string, number>();
      
      for (const n of neighbors) {
        counts.set(n.terrainCode, (counts.get(n.terrainCode) || 0) + 1);
        if (n.overlay) {
          overlayCounts.set(n.overlay, (overlayCounts.get(n.overlay) || 0) + 1);
        }
      }

      let dominantTerrain = cell.terrainCode;
      let maxCount = 0;
      for (const [t, c] of counts.entries()) {
        if (c > maxCount) {
          maxCount = c;
          dominantTerrain = t;
        }
      }

      let newTerrain = cell.terrainCode;
      let newOverlay = cell.overlay;

      // Special rule for water expansion
      if ((counts.get('Ww') || 0) >= 3) {
        newTerrain = 'Ww';
        newOverlay = null;
      } 
      // Special rule for mountains
      else if (cell.height! > 0.8 && (counts.get('Mm') || 0) >= 2) {
        newTerrain = 'Mm';
        newOverlay = null;
      }
      // General smoothing
      else if (maxCount >= 4) {
        newTerrain = dominantTerrain;
      }

      // Overlay smoothing (forests)
      if (newTerrain === 'Gg' || newTerrain === 'Hh') {
        if ((overlayCounts.get('Ff') || 0) >= 3) {
          newOverlay = 'Ff';
        } else if ((overlayCounts.get('Ff') || 0) <= 1 && newOverlay === 'Ff') {
          // Remove isolated forests
          newOverlay = null;
        }
      } else {
        newOverlay = null; // Clear overlay if terrain changed to something incompatible
      }

      if (newTerrain !== cell.terrainCode || newOverlay !== cell.overlay) {
        changes.set(`${cell.q},${cell.r}`, { terrainCode: newTerrain, overlay: newOverlay });
      }
    }

    // Apply changes
    for (const [key, change] of changes.entries()) {
      const [qStr, rStr] = key.split(',');
      const cell = grid.get(parseInt(qStr), parseInt(rStr));
      if (cell) {
        cell.terrainCode = change.terrainCode;
        cell.overlay = change.overlay;
      }
    }
  }

   private static generateRivers(grid: HexGrid): void {
     // Initialize water and flow
     for (const cell of grid.values()) {
       cell.water = cell.moisture! * 10; // Base rainfall
       cell.flow = null;
       cell.riverMask = 0;
       cell.sediment = 0; // Sediment transport capacity
     }
 
     // Calculate flow direction (steepest descent)
     for (const cell of grid.values()) {
       let lowestHeight = cell.height!;
       let target = null;
       
       for (const n of cell.neighbors) {
         if (n && n.height! < lowestHeight) {
           lowestHeight = n.height!;
           target = n;
         }
       }
       cell.flow = target;
     }
 
     // Accumulate water and sediment (process from highest to lowest)
     const sortedCells = Array.from(grid.values()).sort((a, b) => b.height! - a.height!);
 
     for (const cell of sortedCells) {
       if (cell.flow) {
         // Accumulate water
         cell.flow.water! += cell.water!;
         
         // Accumulate sediment based on erosion potential
         const erosionPotential = Math.max(0, (cell.height! - (cell.flow!.height || 0)) * 0.5);
         cell.flow.sediment = (cell.flow.sediment || 0) + ((cell.sediment || 0) + erosionPotential);
       }
     }
 
     // Determine rivers with variable width based on flow
     const RIVER_THRESHOLD = 15; // Lower threshold for more rivers
     for (const cell of grid.values()) {
       if (cell.water! > RIVER_THRESHOLD && cell.terrainCode !== 'Ww' && cell.terrainCode !== 'Mm') {
         cell.terrainCode = 'Rr';
         cell.overlay = null; // wash away forests
         
         // Calculate river width based on flow accumulation (logarithmic scale)
         const flowValue = cell.water!;
         const baseWidth = 0.3; // Minimum river width in hex units
         const widthFactor = Math.log1p(flowValue / 10) * 0.4; // Logarithmic scaling
         cell.riverWidth = Math.min(2.5, baseWidth + widthFactor); // Cap maximum width
       }
     }
 
     // Calculate river masks with enhanced connections
     for (const cell of grid.values()) {
       if (cell.terrainCode === 'Rr') {
         let mask = 0;
         for (let dir = 0; dir < 6; dir++) {
           const nCoord = HexGrid.getNeighbor(cell.q, cell.r, dir);
           const n = grid.get(nCoord.q, nCoord.r);
           if (n) {
             // Connect if neighbor is also a river or water, and there is a flow relationship
             if (n.terrainCode === 'Rr' || n.terrainCode === 'Ww') {
               if (cell.flow === n || n.flow === cell || n.terrainCode === 'Ww') {
                 mask |= (1 << dir);
               }
             }
           }
         }
         cell.riverMask = mask;
       }
     }
   }

  private static addVariantsAndDecorations(grid: HexGrid, seed: number): void {
    // Simple hash function for deterministic variations
    function hash(q: number, r: number, seed: number): number {
      let h = (q * 31 + r * 17 + seed) ^ 0x5a5a5a5a;
      h = Math.imul(h, 0x5bd1e995);
      h ^= h >>> 15;
      return Math.abs(h);
    }

    for (const cell of grid.values()) {
      // Set variant
      cell.variation = hash(cell.q, cell.r, seed);

      // Procedural Decorations
      const rand = hash(cell.q, cell.r, seed + 1000) / 0xffffffff;
      
      if (cell.terrainCode === "Gg" && !cell.overlay && rand < 0.1) {
        cell.decoration = "flowers";
      } else if (cell.terrainCode === "Mm" && rand < 0.2) {
        cell.decoration = "rocks";
      } else if (cell.terrainCode === "Ww" && rand < 0.05) {
        cell.decoration = "water-lilies";
      } else if (cell.terrainCode === "Ff" || cell.overlay === "Ff") {
        if (rand < 0.15) {
          cell.decoration = "mushrooms";
        }
      }
    }
  }
}