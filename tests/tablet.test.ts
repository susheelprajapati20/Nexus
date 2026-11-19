import { classDemoParams, massTolerance, sampleDistribution, solveDistribution, tissuePeak, tissueRates, tissueResponse } from '../src/engine/distribution';
import { biologicalStops, displayElapsed, journeyAt, playbackEnd, playbackStops, positionForModelTime, preludeSeconds } from '../src/engine/journey';

const rows = solveDistribution(classDemoParams);
const peak = tissuePeak(rows, classDemoParams)!;
const stops = biologicalStops(classDemoParams.duration, peak);

describe('the class demonstration', () => {
  test('has a strict interior tissue maximum where entry balances return', () => {
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(classDemoParams.duration);
    const atPeak = sampleDistribution(rows, peak);
    const { entry, back } = tissueRates(atPeak, classDemoParams);
    expect(entry).toBeCloseTo(back, 12);
    const rising = sampleDistribution(rows, peak * .45);
    const falling = sampleDistribution(rows, (peak + classDemoParams.duration) / 2);
    expect(tissueRates(rising, classDemoParams).net).toBeGreaterThan(0);
    expect(tissueRates(falling, classDemoParams).net).toBeLessThan(0);
    expect(falling.tissue).toBeLessThan(atPeak.tissue);
    expect(falling.removed).toBeGreaterThan(atPeak.removed);
  });
  test('distinguishes early endpoints and runs without uptake from interior maxima', () => {
    for (const params of [{ ...classDemoParams, duration: .015 }, { ...classDemoParams, ka: 0 }, { ...classDemoParams, k21: 0 }]) {
      expect(tissuePeak(solveDistribution(params), params)).toBeNull();
    }
  });
  test('preserves dose and nonnegativity between samples across the full allowed rate range', () => {
    const p = { dose: 10000, ka: 5, k12: 5, k21: 5, ke: 5, duration: 168 };
    const extreme = solveDistribution(p);
    let previousRemoved = 0;
    for (let t = .003; t < p.duration; t += .374) {
      const row = sampleDistribution(extreme, t);
      expect(Math.min(row.gut, row.central, row.tissue, row.removed)).toBeGreaterThanOrEqual(0);
      expect(Math.abs(row.gut + row.central + row.tissue + row.removed - p.dose)).toBeLessThan(massTolerance(p.dose));
      expect(row.removed).toBeGreaterThanOrEqual(previousRemoved);
      previousRemoved = row.removed;
    }
  });
  test('the worked example converts 20 mg in 10 L into 2 mg/L and both stated effects', () => {
    expect(tissueResponse(20, 2)).toEqual({ concentration: 2, response: 50 });
    expect(tissueResponse(20, 4).concentration).toBe(2);
    expect(tissueResponse(20, 4).response).toBeCloseTo(100 / 3, 12);
    expect(() => tissueResponse(20, 0)).toThrow();
    expect(() => tissueResponse(20, -1)).toThrow();
  });
  test('at a fixed selection, EC50 alone changes response and leaves the trajectory and time intact', () => {
    const time = 2.135;
    const before = sampleDistribution(rows, time);
    const concentrations = rows.map(r => tissueResponse(r.tissue, 2).concentration);
    const higher = tissueResponse(before.tissue, 4);
    expect(higher.response).toBeLessThan(tissueResponse(before.tissue, 2).response);
    expect(rows.map(r => tissueResponse(r.tissue, 4).concentration)).toEqual(concentrations);
    expect(sampleDistribution(rows, time)).toEqual(before);
  });
});

describe('one clock for anatomy, curves and readouts', () => {
  test('visits every chapter, with the model input held at its initial state during the prelude', () => {
    expect(journeyAt(-2, stops).stage).toBe('ready');
    expect(journeyAt(-1, stops).stage).toBe('placed');
    expect(playbackStops.map(p => journeyAt(p, stops).stage)).toEqual(['swallow','stomach','intestine','liver','tissue','removal','removal']);
    expect(journeyAt(4, stops).elapsed).toBe(8);
    expect(journeyAt(10.99, stops).modelHours).toBe(0);
    expect(journeyAt(11, stops).elapsed).toBe(preludeSeconds);
    expect(journeyAt(playbackEnd, stops).modelHours).toBe(classDemoParams.duration);
  });
  test('selecting a graph point and scrubbing backwards reconstruct the same state', () => {
    for (const time of [0, .001, .12, .32, peak, 11.9, 12]) {
      const position = positionForModelTime(time, stops);
      const first = journeyAt(position, stops);
      const end = journeyAt(playbackEnd, stops);
      const again = journeyAt(position, stops);
      expect(end.elapsed).toBeGreaterThanOrEqual(first.elapsed);
      expect(again).toEqual(first);
      expect(first.modelHours).toBeCloseTo(time, 12);
      expect(sampleDistribution(rows, first.modelHours).tissue).toBeCloseTo(sampleDistribution(rows, time).tissue, 12);
    }
  });
  test('prints elapsed biological time in seconds, minutes and hours', () => {
    expect(displayElapsed(8)).toBe('8 s');
    expect(displayElapsed(preludeSeconds)).toBe('5 min 00 s');
    expect(displayElapsed(12 * 3600 + preludeSeconds)).toBe('12 h 05 min');
  });
});
