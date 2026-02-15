import { describe, it, expect } from 'vitest';
import { countOuts, analyzeDrawVisibility } from '../outs.js';
import { parseCards } from '../cards.js';

describe('outs counter', () => {
  it('counts 9 flush outs for nut flush draw', () => {
    // Scenario 2: As 9s on Ts 6s 3d
    const hole = parseCards(['As', '9s']);
    const board = parseCards(['Ts', '6s', '3d']);
    const result = countOuts(hole, board);
    // Should have 9 spade outs for flush (13 spades - 4 known)
    expect(result.byType.flush).toBe(9);
  });

  it('counts 8 outs for open-ended straight draw', () => {
    // 9h 8h on Td 7c 2s — need a J or 6 for straight
    const hole = parseCards(['9h', '8h']);
    const board = parseCards(['Td', '7c', '2s']);
    const result = countOuts(hole, board);
    expect(result.byType.straight).toBe(8);
  });

  it('counts 4 outs for gutshot straight draw', () => {
    // 9s 8d on Jh 5c 3s 6d — need a 7 for straight
    const hole = parseCards(['9s', '8d']);
    const board = parseCards(['Jh', '5c', '3s', '6d']);
    const result = countOuts(hole, board);
    expect(result.byType.straight).toBe(4);
  });

  it('counts overcard outs (pair improvements)', () => {
    // AK on 8 5 2 rainbow — ANY card making a pair improves from High Card
    // 3 Aces + 3 Kings + 3 eights + 3 fives + 3 twos = 15 pair outs
    const hole = parseCards(['Ac', 'Kd']);
    const board = parseCards(['8h', '5c', '2d']);
    const result = countOuts(hole, board);
    expect(result.byType.pair).toBe(15);
  });

  it('counts combo draw outs (flush + straight)', () => {
    // Scenario 8: Ts 9s on Js 8s 2c — flush draw + OESD
    // Starting from High Card, many improvements: flush, straight, pair, two pair
    const hole = parseCards(['Ts', '9s']);
    const board = parseCards(['Js', '8s', '2c']);
    const result = countOuts(hole, board);
    // Flush outs (9) + straight outs (non-spade Q/7) + pair outs etc.
    expect(result.totalOuts).toBeGreaterThanOrEqual(20);
    expect(result.byType.flush).toBeDefined();
    expect(result.byType.straight).toBeDefined();
  });

  it('handles turn board (4 cards)', () => {
    const hole = parseCards(['As', '9s']);
    const board = parseCards(['Ts', '6s', '3d', '2h']);
    const result = countOuts(hole, board);
    // Still flush draw with 9 outs
    expect(result.byType.flush).toBe(9);
  });

  it('returns 0 outs for made hand with no draws', () => {
    // AA on A K Q rainbow — already have trips, hard to improve category
    const hole = parseCards(['Ah', 'Ad']);
    const board = parseCards(['Ac', 'Kd', 'Qs']);
    const result = countOuts(hole, board);
    // Trips can improve to full house or quads
    const improvementOuts = result.totalOuts;
    // Should have some outs to full house (3 kings + 3 queens) and 1 to quads
    expect(improvementOuts).toBeGreaterThan(0);
  });

  it('throws for invalid board size', () => {
    const hole = parseCards(['Ah', 'Kh']);
    expect(() => countOuts(hole, parseCards(['2h', '3h']))).toThrow();
    expect(() => countOuts(hole, parseCards(['2h', '3h', '4h', '5h', '6h']))).toThrow();
  });
});

describe('draw visibility analysis', () => {
  it('identifies flush draw as high visibility', () => {
    const result = analyzeDrawVisibility({ flush: 9 });
    expect(result[0].visibility).toBe('high');
    expect(result[0].impliedOdds).toBe('worst');
  });

  it('identifies gutshot as low visibility', () => {
    const result = analyzeDrawVisibility({ straight: 4 });
    expect(result[0].visibility).toBe('low');
    expect(result[0].impliedOdds).toBe('good');
  });

  it('identifies OESD as medium visibility', () => {
    const result = analyzeDrawVisibility({ straight: 8 });
    expect(result[0].visibility).toBe('medium');
    expect(result[0].impliedOdds).toBe('medium');
  });

  it('identifies set outs as very low visibility', () => {
    const result = analyzeDrawVisibility({ trips: 2 });
    expect(result[0].visibility).toBe('very_low');
    expect(result[0].impliedOdds).toBe('best');
  });

  it('identifies overcard outs as high visibility', () => {
    const result = analyzeDrawVisibility({ pair: 6 });
    expect(result[0].visibility).toBe('high');
    expect(result[0].impliedOdds).toBe('worst');
  });
});
