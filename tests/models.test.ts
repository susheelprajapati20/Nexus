import { calculateRMSE, maximumAbsoluteError, sirInvariants, solveLogistic, solveSIR, validateSIR } from '../src/engine/math';
import { modelRegistry, modelSources } from '../src/engine/models';
import { createSimulationPdf } from '../src/engine/report';

describe('SIR model', () => {
  const params = { population: 1000, initialInfectious: 5, initialRecovered: 0, beta: .3, gamma: .1 };
  test('RK4 conserves a closed population and preserves non-negative compartments at a refined step', () => {
    const result = solveSIR(params, 100, .1, 'rk4');
    const checks = sirInvariants(result, params.population);
    expect(checks.maxConservationError).toBeLessThan(1e-8);
    expect(checks.minimumCompartment).toBeGreaterThanOrEqual(0);
    expect(checks.peakInfectious).toBeGreaterThan(params.initialInfectious);
  });
  test('rejects initial compartments exceeding N', () => {
    expect(validateSIR({ ...params, initialInfectious: 1001 }).valid).toBe(false);
  });
  test('step refinement reduces Euler and RK4 difference against a finer RK4 reference', () => {
    const coarse = solveSIR(params, 30, .5, 'euler'), coarseRk = solveSIR(params, 30, .5, 'rk4');
    const fine = solveSIR(params, 30, .0625, 'rk4');
    const fineAtCoarse = coarse.time.map((_, i) => fine.I[i * 8]);
    const fineRkAtCoarse = coarseRk.time.map((_, i) => fine.I[i * 8]);
    const errorEuler = calculateRMSE(fineAtCoarse, coarse.I), errorRk = calculateRMSE(fineRkAtCoarse, coarseRk.I);
    expect(errorRk).toBeLessThan(errorEuler);
    expect(maximumAbsoluteError(fineAtCoarse, coarseRk.I)).toBeGreaterThan(0);
  });
});

describe('logistic model', () => {
  test('RK4 agrees with the derived logistic solution and improves on Euler', () => {
    const p = { growthRate: .3, capacity: 1000, initial: 25 };
    const exact = solveLogistic(p, 30, .5), euler = solveLogistic(p, 30, .5, 'euler'), rk4 = solveLogistic(p, 30, .5, 'rk4');
    expect(calculateRMSE(exact.exact, rk4.numeric)).toBeLessThan(calculateRMSE(exact.exact, euler.numeric));
    expect(rk4.numeric.at(-1)).toBeCloseTo(exact.exact.at(-1)!, 2);
  });
});

describe('model documentation and PDF report', () => {
  test('every registered model documents input, output, assumptions and scope', () => {
    for (const model of modelRegistry) {
      expect(model.inputs.length).toBeGreaterThan(0);
      expect(model.outputs.length).toBeGreaterThan(0);
      expect(model.assumptions.length).toBeGreaterThan(0);
      expect(model.limitations.length).toBeGreaterThan(15);
    }
    expect(Object.keys(modelSources)).toContain('sir-review');
  });
  test('PDF generator returns a structured PDF with real vector report content', () => {
    const pdf = createSimulationPdf({
      title: 'Nexus · Simulation output', model: 'IV bolus', timestamp: '2026-10-31', timeLabel: 'h', valueLabel: 'ng/mL',
      parameters: [['Dose', '100 mg']], metrics: [['Half-life', '3.47 h']],
      time: [0, 1, 2], series: [{ label: 'Bacteria with example treatment', values: [100, 80, 60], color: '#168c71' }], secondarySeries: [{ label: 'Example drug level', values: [0, 10, 7], color: '#315fce' }], secondaryValueLabel: 'level units', disclaimer: 'Educational model only.',
    });
    const decoded = new TextDecoder().decode(pdf);
    expect(decoded.startsWith('%PDF-1.4')).toBe(true);
    expect(decoded).toContain('/Type /Page');
    expect(decoded).toContain('xref');
    expect(decoded).toContain('INPUTS');
    expect(decoded).toContain('BACTERIA OVER TIME');
    expect(decoded).toContain('EXAMPLE DRUG LEVEL');
    expect(decoded).toContain('/Count 1');
    expect(decoded).not.toContain('REFERENCES');
    expect(decoded.endsWith('%%EOF')).toBe(true);
  });
});
