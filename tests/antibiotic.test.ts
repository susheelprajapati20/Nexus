import { defaultAntibioticExample, solveAntibioticExample, validateAntibioticExample } from '../src/engine/antibiotic';

describe('illustrative antibiotic and bacteria model', () => {
  test('adds treatment at the selected delay and puts the event on the timeline', () => {
    const result = solveAntibioticExample({ ...defaultAntibioticExample, treatmentDelay: 2.3 }, 8, .5);
    const eventIndex = result.time.indexOf(2.3);
    expect(eventIndex).toBeGreaterThan(0);
    expect(result.drugLevel[eventIndex]).toBe(defaultAntibioticExample.drugLevelAtStart);
    expect(result.drugLevel[0]).toBe(0);
  });
  test('a later treatment start changes only the example trajectory', () => {
    const early = solveAntibioticExample({ ...defaultAntibioticExample, treatmentDelay: 0 }, 72, .1);
    const late = solveAntibioticExample({ ...defaultAntibioticExample, treatmentDelay: 24 }, 72, .1);
    expect(early.bacteriaWithoutDrug).toEqual(late.bacteriaWithoutDrug);
    const atHourTwelve = early.time.indexOf(12);
    expect(atHourTwelve).toBeGreaterThanOrEqual(0);
    expect(early.bacteriaWithDrug[atHourTwelve]).toBeLessThan(late.bacteriaWithDrug[atHourTwelve]);
  });
  test('zero example kill speed matches the no-treatment logistic reference', () => {
    const result = solveAntibioticExample({ ...defaultAntibioticExample, maxKillRate: 0, treatmentDelay: 0 }, 24, .05);
    expect(result.bacteriaWithDrug.at(-1)).toBeCloseTo(result.bacteriaWithoutDrug.at(-1)!, 3);
  });
  test('rejects invalid example rates and too-dense calculation grids', () => {
    expect(validateAntibioticExample({ ...defaultAntibioticExample, treatmentDelay: 80 }, 72, .25).valid).toBe(false);
    expect(validateAntibioticExample(defaultAntibioticExample, 72, .0001).valid).toBe(false);
  });
});
