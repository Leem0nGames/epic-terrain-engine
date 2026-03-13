import { describe, it, expect } from 'vitest';
import { HexGrid } from '../lib/hex/HexGrid';

describe('Hex Neighbors', () => {
  it('should return 6 neighbors for a hex', () => {
    const neighbors = HexGrid.getNeighborCoords(0, 0);
    expect(neighbors.length).toBe(6);
    // N, NE, SE, S, SW, NW
    expect(neighbors).toContainEqual({ q: 0, r: -1 }); // N
    expect(neighbors).toContainEqual({ q: 1, r: -1 }); // NE
    expect(neighbors).toContainEqual({ q: 1, r: 0 });  // SE
    expect(neighbors).toContainEqual({ q: 0, r: 1 });  // S
    expect(neighbors).toContainEqual({ q: -1, r: 1 }); // SW
    expect(neighbors).toContainEqual({ q: -1, r: 0 }); // NW
  });

  it('should return correct neighbor for a specific direction', () => {
    expect(HexGrid.getNeighbor(0, 0, 0)).toEqual({ q: 0, r: -1 }); // N
    expect(HexGrid.getNeighbor(0, 0, 3)).toEqual({ q: 0, r: 1 });  // S
  });
});
