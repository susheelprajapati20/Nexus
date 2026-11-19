import { calculatePD_Emax } from './math';

export interface DistributionParams {
  dose: number;
  ka: number;
  k12: number;
  k21: number;
  ke: number;
  duration: number;
}

export interface DistributionRow {
  time: number;
  gut: number;
  central: number;
  tissue: number;
  removed: number;
}

export const distributionDefaults: DistributionParams = {
  dose: 100, ka: 1, k12: .35, k21: .2, ke: .15, duration: 24,
};
export const classDemoParams: DistributionParams = {
  dose: 100, ka: 1.35, k12: .8, k21: .55, ke: .6, duration: 12,
};
export const tissueVolume = 10;
export const massTolerance = (dose: number) => 1e-10 * Math.max(1, dose);

export function solveDistribution(p: DistributionParams): DistributionRow[] {
  if (!Object.values(p).every(Number.isFinite) || p.dose <= 0 || p.dose > 10000 ||
      p.duration <= 0 || p.duration > 168 || [p.ka, p.k12, p.k21, p.ke].some(v => v < 0 || v > 5)) {
    throw new Error('Choose a positive starting amount up to 10,000 mg, a run of up to 168 hours and rates from 0 to 5 per hour.');
  }
  const derivative = ([gut, central, tissue]: number[]) => {
    const absorption = p.ka * gut, entry = p.k12 * central, back = p.k21 * tissue, loss = p.ke * central;
    return [-absorption, absorption - entry + back - loss, entry - back, loss];
  };
  const stepState = (state: number[], slope: number[], h: number) => state.map((v, k) => v + h * slope[k]);
  let y = [p.dose, 0, 0, 0];
  const rowAt = (time: number) => ({ time, gut: y[0], central: y[1], tissue: y[2], removed: y[3] });
  const rows = [rowAt(0)];
  const intervals = Math.max(120, Math.ceil(p.duration / .04));
  for (let i = 1; i <= intervals; i++) {
    const time = i === intervals ? p.duration : p.duration * i / intervals;
    const delta = time - rows[i - 1].time;
    const substeps = Math.max(1, Math.ceil(delta / .01)), h = delta / substeps;
    for (let j = 0; j < substeps; j++) {
      const a = derivative(y), b = derivative(stepState(y, a, h / 2));
      const c = derivative(stepState(y, b, h / 2)), d = derivative(stepState(y, c, h));
      y = y.map((v, k) => v + h * (a[k] + 2 * b[k] + 2 * c[k] + d[k]) / 6);
    }
    const total = y.reduce((sum, value) => sum + value, 0);
    if (y.some(v => !Number.isFinite(v) || v < 0) || Math.abs(total - p.dose) > massTolerance(p.dose)) {
      throw new Error('The solver could not verify a non-negative, mass-balanced result for these inputs.');
    }
    rows.push(rowAt(time));
  }
  return rows;
}

/** Linear interpolation of adjacent RK4 outputs also conserves the dose. */
export function sampleDistribution(rows: DistributionRow[], t: number): DistributionRow {
  const last = rows.length - 1, duration = rows[last].time;
  if (t <= 0) return rows[0];
  if (t >= duration) return rows[last];
  const i = Math.min(last - 1, Math.floor(t / duration * last));
  const a = rows[i], b = rows[i + 1], fraction = (t - a.time) / (b.time - a.time);
  const mix = (x: number, y: number) => x + fraction * (y - x);
  return { time: t, gut: mix(a.gut, b.gut), central: mix(a.central, b.central),
    tissue: mix(a.tissue, b.tissue), removed: mix(a.removed, b.removed) };
}

export function tissueRates(row: DistributionRow, p: DistributionParams) {
  const entry = p.k12 * row.central, back = p.k21 * row.tissue;
  return { entry, back, net: entry - back };
}

export function tissueResponse(amount: number, ec50: number) {
  const concentration = amount / tissueVolume;
  const [response] = calculatePD_Emax([concentration], 100, ec50);
  return { concentration, response };
}

/** Interpolate the first positive-to-negative zero of dAt/dt at the tissue maximum. */
export function tissuePeak(rows: DistributionRow[], p: DistributionParams): number | null {
  let previous = tissueRates(rows[0], p).net;
  for (let i = 1; i < rows.length; i++) {
    const current = tissueRates(rows[i], p).net;
    if (previous > 0 && current <= 0) {
      const a = rows[i - 1], b = rows[i];
      const peak = a.time + (b.time - a.time) * previous / (previous - current);
      return peak < p.duration ? peak : null;
    }
    previous = current;
  }
  return null;
}
