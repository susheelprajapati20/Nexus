import { calculatePD_Emax, calculateRMSE, solvePK_Exact, solvePK_Euler, solvePK_RK4, validateParameters } from '../src/engine/math';

describe('PK analytical solutions and units', () => {
  test('IV bolus starts at 1000 D/V ng/mL and follows first-order elimination', () => {
    const result = solvePK_Exact({ dose: 10, V: 2, ke: .2 }, 2, 1);
    expect(result.C[0]).toBe(5000);
    expect(result.C[1]).toBeCloseTo(5000 * Math.exp(-.2));
  });
  test('oral solution starts at zero; F is applied once', () => {
    const p = { dose: 100, V: 10, ke: .2, ka: 1.2, F: .5 };
    expect(solvePK_Exact(p, 1, .25).C[0]).toBe(0);
    expect(solvePK_Exact(p, 1, .25).C[4]).toBeCloseTo(5000 * 1.2 / 1 * (Math.exp(-.2) - Math.exp(-1.2)));
  });
  test.each([.2, .200000000001])('equal and nearly equal ka/ke are finite and stable (%s)', rate => {
    const p = { dose: 80, V: 8, ke: .2, ka: rate, F: .6 };
    const value = solvePK_Exact(p, 3, .5).C[6];
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeCloseTo(6000 * .2 * 3 * Math.exp(-.6), 7);
  });
  test('last numerical interval is shortened to land exactly on duration', () => {
    const result = solvePK_RK4({ dose: 1, V: 1, ke: .2 }, 1, .3);
    expect(result.time).toEqual([0, .3, .6, .9, 1]);
    expect(result.C[4]).toBeCloseTo(1000 * Math.exp(-.2), 2);
  });
  test('repeated IV doses are inserted at exact event times', () => {
    const p = { dose: 10, V: 2, ke: .2, numberOfDoses: 2, dosingInterval: 2 };
    const exact = solvePK_Exact(p, 4, 1);
    const numerical = solvePK_RK4(p, 4, .1);
    expect(exact.time).toContain(2);
    expect(exact.C[2]).toBeCloseTo(5000 * Math.exp(-.4) + 5000);
    const eventIndex = numerical.time.indexOf(2);
    expect(eventIndex).toBeGreaterThan(0);
    expect(numerical.C[eventIndex]).toBeCloseTo(exact.C[2], 5);
  });
  test('repeated oral doses add to gut amount and retain analytical agreement', () => {
    const p = { dose: 40, V: 8, ke: .2, ka: .9, F: .65, numberOfDoses: 3, dosingInterval: 2.5 };
    const exact = solvePK_Exact(p, 8, .05), rk4 = solvePK_RK4(p, 8, .05);
    expect(exact.time).toContain(2.5);
    expect(calculateRMSE(exact.C, rk4.C)).toBeLessThan(.01);
  });
  test('rejects repeated dosing without a positive interval', () => {
    expect(validateParameters({ dose: 10, V: 2, ke: .2, numberOfDoses: 2 }).valid).toBe(false);
  });
});

describe('numerical methods and convergence', () => {
  const p = { dose: 100, V: 10, ke: .2, ka: 1.2, F: .5 };
  const rmseAt = (method: typeof solvePK_Euler, step: number) => {
    const exact = solvePK_Exact(p, 12, step);
    return calculateRMSE(exact.C, method(p, 12, step).C);
  };
  test('Euler and RK4 errors decrease as step size is refined', () => {
    expect(rmseAt(solvePK_Euler, .1)).toBeLessThan(rmseAt(solvePK_Euler, .5));
    expect(rmseAt(solvePK_RK4, .1)).toBeLessThan(rmseAt(solvePK_RK4, .5));
    expect(rmseAt(solvePK_RK4, .5)).toBeLessThan(rmseAt(solvePK_Euler, .5));
  });
  test('Emax response is zero at zero concentration and half-max at EC50', () => {
    expect(calculatePD_Emax([0, 10], 100, 10)).toEqual([0, 50]);
  });
  test('sigmoidal Emax includes baseline and Hill coefficient', () => {
    expect(calculatePD_Emax([0, 10], 80, 10, 12, 2)).toEqual([12, 52]);
  });
  test('RMSE rejects mismatched arrays', () => {
    expect(() => calculateRMSE([1], [])).toThrow();
  });
});

describe('input validation', () => {
  test('rejects nonfinite PK inputs and invalid bioavailability', () => {
    expect(validateParameters({ dose: Number.NaN, V: 10, ke: .2 }).valid).toBe(false);
    expect(validateParameters({ dose: 10, V: 10, ke: .2, F: 1.1 }).valid).toBe(false);
  });
});
