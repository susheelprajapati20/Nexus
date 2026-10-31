export interface AntibioticExampleParams {
  bacteriaAtStart: number;
  bacteriaLimit: number;
  growthRate: number;
  drugLevelAtStart: number;
  drugRemovalRate: number;
  maxKillRate: number;
  effectLevel: number;
  treatmentDelay: number;
}

export interface AntibioticExampleResult {
  time: number[];
  drugLevel: number[];
  bacteriaWithDrug: number[];
  bacteriaWithoutDrug: number[];
}

export const defaultAntibioticExample: AntibioticExampleParams = {
  bacteriaAtStart: 100,
  bacteriaLimit: 10000,
  growthRate: 0.22,
  drugLevelAtStart: 8,
  drugRemovalRate: 0.18,
  maxKillRate: 0.42,
  effectLevel: 2,
  treatmentDelay: 8,
};

export function validateAntibioticExample(p: AntibioticExampleParams, duration: number, step: number) {
  if (![...Object.values(p), duration, step].every(Number.isFinite)) return { valid: false, message: 'Enter a number in every field.' };
  if (p.bacteriaAtStart <= 0 || p.bacteriaLimit <= 0 || p.bacteriaAtStart > p.bacteriaLimit) return { valid: false, message: 'Starting bacteria must be above zero and no greater than the example population limit.' };
  if (p.growthRate <= 0 || p.drugLevelAtStart <= 0 || p.drugRemovalRate <= 0 || p.maxKillRate < 0 || p.effectLevel <= 0) return { valid: false, message: 'Growth, drug level, removal speed and effect level must be above zero; maximum kill speed may be zero or above.' };
  if (duration <= 0 || step <= 0 || p.treatmentDelay < 0 || p.treatmentDelay > duration) return { valid: false, message: 'Use a positive run length and time step. Treatment delay must fall within the run.' };
  if (Math.ceil(duration / step) > 100_000) return { valid: false, message: 'Use a larger time step or shorter run (maximum 100,000 calculation steps).' };
  return { valid: true, message: 'Example settings are valid.' };
}

type State = [drug: number, bacteria: number];
const derivative = (y: State, p: AntibioticExampleParams): State => {
  const [drug, bacteria] = y;
  const killSpeed = p.maxKillRate * drug / (p.effectLevel + drug);
  return [-p.drugRemovalRate * drug, p.growthRate * bacteria * (1 - bacteria / p.bacteriaLimit) - killSpeed * bacteria];
};
const add = (y: State, k: State, scale: number): State => [y[0] + scale * k[0], y[1] + scale * k[1]];
function rk4(y: State, h: number, p: AntibioticExampleParams): State {
  const f = (v: State) => derivative(v, p);
  const k1 = f(y), k2 = f(add(y, k1, h / 2)), k3 = f(add(y, k2, h / 2)), k4 = f(add(y, k3, h));
  return [0, 1].map(i => y[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) as State;
}

export function solveAntibioticExample(p: AntibioticExampleParams, duration: number, step: number): AntibioticExampleResult {
  const valid = validateAntibioticExample(p, duration, step);
  if (!valid.valid) throw new Error(valid.message);
  const n = Math.ceil(duration / step);
  const times = new Set<number>([duration, p.treatmentDelay]);
  for (let i = 0; i < n; i++) times.add(Number((i * step).toPrecision(14)));
  const time = [...times].sort((a, b) => a - b);
  let state: State = [0, p.bacteriaAtStart];
  if (p.treatmentDelay === 0) state[0] = p.drugLevelAtStart;
  const drugLevel = [state[0]], bacteriaWithDrug = [state[1]];
  for (let i = 1; i < time.length; i++) {
    state = rk4(state, time[i] - time[i - 1], p);
    if (Math.abs(time[i] - p.treatmentDelay) < 1e-12 && p.treatmentDelay > 0) state[0] += p.drugLevelAtStart;
    drugLevel.push(state[0]);
    bacteriaWithDrug.push(state[1]);
  }
  const bacteriaWithoutDrug = time.map(t => p.bacteriaLimit / (1 + (p.bacteriaLimit / p.bacteriaAtStart - 1) * Math.exp(-p.growthRate * t)));
  return { time, drugLevel, bacteriaWithDrug, bacteriaWithoutDrug };
}
