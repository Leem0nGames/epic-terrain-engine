/**
 * Tectonic Plate System for Epic Terrain Engine
 * Implements plate tectonics for realistic geological feature generation
 */

export interface Plate {
  id: number;
  center: { q: number; r: number };
  velocity: {
    x: number;
    y: number;
  };
  type: "oceanic" | "continental";
  // Additional properties for simulation
  angularVelocity?: number; // For rotational movement
  boundaries?: number[];    // IDs of neighboring plates
}

export interface PlateBoundary {
  plateA: number;
  plateB: number;
  boundaryType: "convergent" | "divergent" | "transform";
  strength: number; // 0-1, how strong the interaction is
}

/**
 * Calculate distance between two hex coordinates
 */
export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  const s1 = -q1 - r1;
  const s2 = -q2 - r2;
  return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
}

/**
 * Assign each hex to the nearest plate (Voronoi tessellation)
 */
export function assignPlateToHex(
  hexQ: number, 
  hexR: number, 
  plates: Plate[]
): Plate {
  let nearestPlate = plates[0];
  let bestDistance = hexDistance(hexQ, hexR, nearestPlate.center.q, nearestPlate.center.r);

  for (let i = 1; i < plates.length; i++) {
    const plate = plates[i];
    const distance = hexDistance(hexQ, hexR, plate.center.q, plate.center.r);
    
    if (distance < bestDistance) {
      bestDistance = distance;
      nearestPlate = plate;
    }
  }

  return nearestPlate;
}

/**
 * Generate initial tectonic plates with random positions and velocities
 */
export function generatePlates(
  plateCount: number,
  mapWidth: number,
  mapHeight: number,
  seed: number
): Plate[] {
  const plates: Plate[] = [];
  
  // Simple seeded random function
  let s = seed;
  const random = () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };

  for (let i = 0; i < plateCount; i++) {
    // 60% oceanic, 40% continental plates (similar to Earth)
    const type = random() < 0.6 ? "oceanic" : "continental";
    
    plates.push({
      id: i,
      center: {
        q: Math.floor(random() * mapWidth),
        r: Math.floor(random() * mapHeight)
      },
      velocity: {
        x: (random() - 0.5) * 2, // Range [-1, 1]
        y: (random() - 0.5) * 2  // Range [-1, 1]
      },
      type: type,
      // Optional: add small angular velocity for more complex movement
      angularVelocity: (random() - 0.5) * 0.2
    });
  }

  return plates;
}

/**
 * Calculate plate interactions and generate initial height map
 */
export function calculatePlateEffects(
  plates: Plate[],
  mapWidth: number,
  mapHeight: number
): number[][] {
  // Initialize height map
  const heightMap: number[][] = Array(mapHeight)
    .fill(null)
    .map(() => Array(mapWidth).fill(0));

  // Base height by plate type
  for (let r = 0; r < mapHeight; r++) {
    for (let q = 0; q < mapWidth; q++) {
      const plate = assignPlateToHex(q, r, plates);
      
      // Set base height based on plate type
      if (plate.type === "continental") {
        heightMap[r][q] = 0.6;
      } else { // oceanic
        heightMap[r][q] = 0.3;
      }
    }
  }

  // Apply boundary effects
  const boundaries = findPlateBoundaries(plates, mapWidth, mapHeight);
  
  for (const boundary of boundaries) {
    const plateA = plates.find(p => p.id === boundary.plateA);
    const plateB = plates.find(p => p.id === boundary.plateB);
    
    if (!plateA || !plateB) continue;
    
    // Calculate relative velocity at boundary
    const relVelocityX = plateB.velocity.x - plateA.velocity.x;
    const relVelocityY = plateB.velocity.y - plateA.velocity.y;
    
    // Apply effects based on boundary type
    switch (boundary.boundaryType) {
      case "convergent": // Collision/subduction
        applyConvergentBoundary(heightMap, plateA, plateB, relVelocityX, relVelocityY, boundary.strength);
        break;
      case "divergent":  // Separation/Rift
        applyDivergentBoundary(heightMap, plateA, plateB, relVelocityX, relVelocityY, boundary.strength);
        break;
      case "transform":  // Sliding/Faults
        applyTransformBoundary(heightMap, plateA, plateB, relVelocityX, relVelocityY, boundary.strength);
        break;
    }
  }

  return heightMap;
}

/**
 * Find boundaries between plates
 */
export function findPlateBoundaries(
  plates: Plate[],
  mapWidth: number,
  mapHeight: number
): PlateBoundary[] {
  const boundaries: PlateBoundary[] = [];
  
  // Sample points to detect boundaries
  const step = Math.max(1, Math.floor(Math.min(mapWidth, mapHeight) / 20));
  
  for (let r = 0; r < mapHeight; r += step) {
    for (let q = 0; q < mapWidth; q += step) {
      const plateA = assignPlateToHex(q, r, plates);
      
      // Check neighbors
      for (let dir = 0; dir < 6; dir++) {
        const neighborCoord = getHexNeighbor(q, r, dir);
        const plateB = assignPlateToHex(neighborCoord.q, neighborCoord.r, plates);
        
        if (plateA.id !== plateB.id) {
          // Found a boundary
          const boundaryType = determineBoundaryType(plateA, plateB);
          const strength = Math.random() * 0.5 + 0.5; // Random strength 0.5-1.0
          
          // Avoid duplicate boundaries
          const existingIndex = boundaries.findIndex(b => 
            ((b.plateA === plateA.id && b.plateB === plateB.id) ||
             (b.plateA === plateB.id && b.plateB === plateA.id)) &&
            b.boundaryType === boundaryType
          );
          
          if (existingIndex === -1) {
            boundaries.push({
              plateA: plateA.id,
              plateB: plateB.id,
              boundaryType: boundaryType,
              strength: strength
            });
          }
        }
      }
    }
  }
  
  return boundaries;
}

/**
 * Get hex neighbor in given direction (flat-top orientation)
 */
export function getHexNeighbor(q: number, r: number, direction: number): { q: number; r: number } {
  const directions = [
    { q: 1, r: 0 },   // 0: Right
    { q: 1, r: -1 },  // 1: Top Right
    { q: 0, r: -1 },  // 2: Top Left
    { q: -1, r: 0 },  // 3: Left
    { q: -1, r: 1 },  // 4: Bottom Left
    { q: 0, r: 1 }    // 5: Bottom Right
  ];
  
  const dir = directions[direction % 6];
  return { q: q + dir.q, r: r + dir.r };
}

/**
 * Determine boundary type based on plate properties and movement
 */
export function determineBoundaryType(plateA: Plate, plateB: Plate): "convergent" | "divergent" | "transform" {
  // Simplified logic - in reality this depends on relative movement and plate types
  const relVelocityX = plateB.velocity.x - plateA.velocity.x;
  const relVelocityY = plateB.velocity.y - plateA.velocity.y;
  
  // Calculate dot product with vector between centers to see if plates are moving toward/away
  const centerDx = plateB.center.q - plateA.center.q;
  const centerDy = plateB.center.r - plateA.center.r;
  const centerDist = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
  
  if (centerDist === 0) return "transform"; // Avoid division by zero
  
  const normalizedCenterDx = centerDx / centerDist;
  const normalizedCenterDy = centerDy / centerDist;
  
  // Dot product: positive = moving apart, negative = moving together
  const dotProduct = relVelocityX * normalizedCenterDx + relVelocityY * normalizedCenterDy;
  
  // Add some randomness to make it less predictable
  const noise = (Math.random() - 0.5) * 0.2;
  const adjustedDot = dotProduct + noise;
  
  if (adjustedDot > 0.1) {
    return "divergent";  // Moving apart
  } else if (adjustedDot < -0.1) {
    return "convergent"; // Moving together
  } else {
    return "transform";  // Sliding past
  }
}

/**
 * Apply convergent boundary effects (mountain building, subduction)
 */
export function applyConvergentBoundary(
  heightMap: number[][],
  plateA: Plate,
  plateB: Plate,
  relVelocityX: number,
  relVelocityY: number,
  strength: number
): void {
  const collisionStrength = strength * 0.3; // Scale factor
  
  // Find cells near the boundary between these plates
  const influenceRadius = 3; // How far the effect spreads
  
  for (let r = 0; r < heightMap.length; r++) {
    for (let q = 0; q < heightMap[0].length; q++) {
      const plateAtQ = assignPlateToHex(q, r, [plateA, plateB]);
      
      // Only affect cells that belong to either plate
      if (plateAtQ.id === plateA.id || plateAtQ.id === plateB.id) {
        // Check if near boundary by seeing if neighbors have different plates
        let isNearBoundary = false;
        
        for (let dir = 0; dir < 6; dir++) {
          const neighbor = getHexNeighbor(q, r, dir);
          // Bounds checking
          if (neighbor.q >= 0 && neighbor.q < heightMap[0].length && 
              neighbor.r >= 0 && neighbor.r < heightMap.length) {
            const neighborPlate = assignPlateToHex(neighbor.q, neighbor.r, [plateA, plateB]);
            if (neighborPlate.id !== plateAtQ.id) {
              isNearBoundary = true;
              break;
            }
          }
        }
        
        if (isNearBoundary) {
          // Oceanic-Continental convergence: subduction -> volcanoes/mountains
          // Oceanic-Oceanic convergence: island arcs
          // Continental-Continental convergence: major mountains
          
          let heightIncrease = collisionStrength;
          
          if (plateA.type === "oceanic" && plateB.type === "oceanic") {
            // Oceanic-Oceanic: moderate height increase (island arcs)
            heightIncrease *= 0.7;
          } else if ((plateA.type === "continental" && plateB.type === "continental")) {
            // Continental-Continental: large height increase (Himalayas style)
            heightIncrease *= 1.2;
          }
          // Oceanic-Continental: standard (Andes style)
          
          heightMap[r][q] += heightIncrease;
        }
      }
    }
  }
}

/**
 * Apply divergent boundary effects (rifts, oceans)
 */
export function applyDivergentBoundary(
  heightMap: number[][],
  plateA: Plate,
  plateB: Plate,
  relVelocityX: number,
  relVelocityY: number,
  strength: number
): void {
  const separationStrength = strength * 0.4; // Scale factor
  
  // Find cells near the boundary between these plates
  const influenceRadius = 3;
  
  for (let r = 0; r < heightMap.length; r++) {
    for (let q = 0; q < heightMap[0].length; q++) {
      const plateAtQ = assignPlateToHex(q, r, [plateA, plateB]);
      
      // Only affect cells that belong to either plate
      if (plateAtQ.id === plateA.id || plateAtQ.id === plateB.id) {
        // Check if near boundary
        let isNearBoundary = false;
        
        for (let dir = 0; dir < 6; dir++) {
          const neighbor = getHexNeighbor(q, r, dir);
          // Bounds checking
          if (neighbor.q >= 0 && neighbor.q < heightMap[0].length && 
              neighbor.r >= 0 && neighbor.r < heightMap.length) {
            const neighborPlate = assignPlateToHex(neighbor.q, neighbor.r, [plateA, plateB]);
            if (neighborPlate.id !== plateAtQ.id) {
              isNearBoundary = true;
              break;
            }
          }
        }
        
        if (isNearBoundary) {
          heightMap[r][q] -= separationStrength;
        }
      }
    }
  }
}

/**
 * Apply transform boundary effects (faults, rough terrain)
 */
export function applyTransformBoundary(
  heightMap: number[][],
  plateA: Plate,
  plateB: Plate,
  relVelocityX: number,
  relVelocityY: number,
  strength: number
): void {
  const faultStrength = strength * 0.2; // Scale factor
  
  // Find cells near the boundary between these plates
  for (let r = 0; r < heightMap.length; r++) {
    for (let q = 0; q < heightMap[0].length; q++) {
      const plateAtQ = assignPlateToHex(q, r, [plateA, plateB]);
      
      // Only affect cells that belong to either plate
      if (plateAtQ.id === plateA.id || plateAtQ.id === plateB.id) {
        // Check if near boundary
        let isNearBoundary = false;
        
        for (let dir = 0; dir < 6; dir++) {
          const neighbor = getHexNeighbor(q, r, dir);
          // Bounds checking
          if (neighbor.q >= 0 && neighbor.q < heightMap[0].length && 
              neighbor.r >= 0 && neighbor.r < heightMap.length) {
            const neighborPlate = assignPlateToHex(neighbor.q, neighbor.r, [plateA, plateB]);
            if (neighborPlate.id !== plateAtQ.id) {
              isNearBoundary = true;
              break;
            }
          }
        }
        
        if (isNearBoundary) {
          // Create rough, irregular terrain along fault lines
          const faultOffset = (Math.random() - 0.5) * faultStrength * 2;
          heightMap[r][q] += faultOffset;
        }
      }
    }
  }
}

/**
 * Apply erosion to height map with hydraulic and thermal erosion
 */
export function applyErosion(
  heightMap: number[][],
  erosionFactor: number = 0.1,
  iterations: number = 3,
  solubility: number = 0.3, // How easily material dissolves in water
  deposition: number = 0.5   // How much eroded material gets deposited
): number[][] {
  const result = heightMap.map(row => [...row]); // Deep copy
  const width = heightMap[0].length;
  const height = heightMap.length;
  
  // Sediment transport capacity map
  const sediment = heightMap.map(row => [...row].map(() => 0));
  
  for (let iter = 0; iter < iterations; iter++) {
    const erosionChanges = heightMap.map(row => [...row].map(() => 0));
    const depositionChanges = heightMap.map(row => [...row].map(() => 0));
    
    // Hydraulic erosion: water flow carries sediment downhill
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        let totalSlope = 0;
        let validNeighbors = 0;
        let maxSlope = 0;
        let maxSlopeDir = -1;
        
        // Find steepest downslope direction
        for (let dir = 0; dir < 6; dir++) {
          const neighbor = getHexNeighbor(q, r, dir);
          // Bounds checking
          if (neighbor.q >= 0 && neighbor.q < width && 
              neighbor.r >= 0 && neighbor.r < height) {
            const neighborHeight = heightMap[neighbor.r][neighbor.q];
            const slope = heightMap[r][q] - neighborHeight;
            if (slope > 0) { // Only positive slopes contribute to erosion
              totalSlope += slope;
              validNeighbors++;
              
              if (slope > maxSlope) {
                maxSlope = slope;
                maxSlopeDir = dir;
              }
            }
          }
        }
        
        const averageSlope = validNeighbors > 0 ? totalSlope / validNeighbors : 0;
        
        // Erosion occurs proportional to slope and water flow
        const erosionAmount = averageSlope * erosionFactor * solubility;
        
        // Deposition occurs where slope decreases
        const depositionAmount = (validNeighbors > 0 ? averageSlope * deposition : 0) * 0.1;
        
        erosionChanges[r][q] = -erosionAmount;
        
        // Distribute eroded sediment to downstream neighbors
        if (maxSlopeDir >= 0 && erosionAmount > 0) {
          const neighbor = getHexNeighbor(q, r, maxSlopeDir);
          if (neighbor.q >= 0 && neighbor.q < width && 
              neighbor.r >= 0 && neighbor.r < height) {
            // Deposit sediment downstream
            depositionChanges[neighbor.r][neighbor.q] += erosionAmount * 0.8; // 80% transported
          }
        }
        
        // Add some local deposition
        depositionChanges[r][q] += depositionAmount;
      }
    }
    
    // Apply erosion and deposition changes
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        const newHeight = result[r][q] + erosionChanges[r][q] + depositionChanges[r][q];
        result[r][q] = Math.max(0, newHeight); // Don't go below 0
      }
    }
  }
  
  return result;
}

/**
 * Add noise detail to height map for micro-variation
 */
export function addNoiseDetail(
  heightMap: number[][],
  noiseScale: number = 0.05,
  noiseStrength: number = 0.1,
  seed: number = 0
): number[][] {
  const result = heightMap.map(row => [...row]); // Deep copy
  
  for (let r = 0; r < heightMap.length; r++) {
    for (let q = 0; q < heightMap[0].length; q++) {
      // Convert hex coordinates to proper Cartesian space for noise
      // This prevents the triangular pattern artifact
      const x = q * 0.75; // Approximate conversion
      const y = r * 0.866; // sqrt(3)/2 * hex size
      
      // Note: This function is used internally, so we use a simple noise function
      // In a full implementation, we should import and use the Noise.ts class
      const noiseValue = Math.sin(x * noiseScale * 10) * Math.cos(y * noiseScale * 10);
      const normalizedNoise = (noiseValue + 1) / 2; // Convert [-1,1] to [0,1]
      
      result[r][q] += (normalizedNoise - 0.5) * noiseStrength * 2;
      
      // Ensure height stays in reasonable bounds
      result[r][q] = Math.max(0, Math.min(1, result[r][q]));
    }
  }
  
  return result;
}

/**
 * Convert height map to terrain types
 */
export function heightToTerrain(
  height: number,
  moisture: number = 0.5,
  temperature: number = 0.5
): { terrainCode: string; overlay: string | null } {
  if (height < 0.3) {
    return { terrainCode: "Ww", overlay: null }; // Water
  } else if (height < 0.35) {
    return { terrainCode: "Ds", overlay: null }; // Beach/Sand
  } else if (height > 0.8) {
    return { terrainCode: "Mm", overlay: null }; // Mountain
  } else if (height > 0.65) {
    return { terrainCode: "Hh", overlay: null }; // Hills
  } else {
    // Plains - determine by temperature and moisture
    if (temperature > 0.7 && moisture < 0.3) {
      return { terrainCode: "Dd", overlay: null }; // Desert
    } else if (temperature > 0.6 && moisture > 0.6) {
      return { 
        terrainCode: "Gg", 
        overlay: Math.random() < 0.3 ? "Jg" : null // Jungle with some probability
      };
    } else if (temperature < 0.3) {
      return { terrainCode: "Aa", overlay: null }; // Snow
    } else {
      // Grassland base
      let overlay: string | null = null;
      
      // Add forest overlay based on moisture
      if (moisture > 0.5 && Math.random() < 0.4) {
        overlay = "Ff";
      }
      
      return { terrainCode: "Gg", overlay: overlay };
    }
  }
}