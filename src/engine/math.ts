/** Pure deterministic model calculations. PK: dose/amount mg, V L, C ng/mL,
 * rates h^-1, time h. Population models use people, days and day^-1. */
export interface PKParams {
  dose: number; V: number; ke: number; ka?: number; F?: number;
  numberOfDoses?: number; dosingInterval?: number;
}
export interface SolverResult { time: number[]; C: number[] }
export type Method = 'euler' | 'rk4';

export function validateParameters(p: Partial<PKParams>) {
  const positive: Array<[keyof PKParams, string]> = [
    ['dose', 'Dose must be finite and positive (mg).'], ['V', 'Volume must be finite and positive (L).'], ['ke', 'Elimination rate must be finite and positive (h⁻¹).'],
  ];
  for (const [key, message] of positive) { const value = p[key]; if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return { valid: false, message }; }
  if (p.ka !== undefined && (!Number.isFinite(p.ka) || p.ka <= 0)) return { valid: false, message: 'Absorption rate must be finite and positive (h⁻¹).' };
  if (p.F !== undefined && (!Number.isFinite(p.F) || p.F < 0 || p.F > 1)) return { valid: false, message: 'Bioavailability must be between 0 and 1.' };
  const count = p.numberOfDoses ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 1000) return { valid: false, message: 'Number of doses must be an integer from 1 to 1000.' };
  if (count > 1 && (!Number.isFinite(p.dosingInterval) || (p.dosingInterval ?? 0) <= 0)) return { valid: false, message: 'Repeated doses require a finite positive interval (h).' };
  return { valid: true, message: 'Parameters are valid.' };
}

function timeGrid(duration: number, step: number, events: number[] = []): number[] {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Duration must be finite and positive.');
  if (!Number.isFinite(step) || step <= 0) throw new Error('Step size must be finite and positive.');
  const n = Math.ceil(duration / step);
  if (!Number.isSafeInteger(n) || n + events.length > 100_000) throw new Error('Choose a larger step size or shorter duration (maximum 100,000 intervals).');
  const values = new Set<number>([duration]);
  for (let i = 0; i < n; i++) values.add(Number((i * step).toPrecision(14)));
  events.filter(t => t > 0 && t <= duration).forEach(t => values.add(t));
  return [...values].sort((a, b) => a - b);
}
const doseTimes = (p: PKParams) => Array.from({ length: p.numberOfDoses ?? 1 }, (_, i) => i * (p.dosingInterval ?? 0));
function singleDoseConcentration(p: PKParams, elapsed: number): number {
  if (p.ka === undefined) return 1000 * p.dose / p.V * Math.exp(-p.ke * elapsed);
  const delta = p.ka - p.ke;
  const scale = 1000 * (p.F ?? 1) * p.dose / p.V;
  if (Math.abs(delta) < 1e-7 * Math.max(p.ka, p.ke)) return scale * p.ka * elapsed * Math.exp(-p.ke * elapsed);
  return scale * p.ka * Math.exp(-p.ke * elapsed) * (-Math.expm1(-delta * elapsed)) / delta;
}
export function solvePK_Exact(p: PKParams, duration: number, step: number): SolverResult {
  const v = validateParameters(p); if (!v.valid) throw new Error(v.message);
  const events = doseTimes(p); const time = timeGrid(duration, step, events);
  return { time, C: time.map(t => events.reduce((sum, td) => td <= t ? sum + singleDoseConcentration(p, t - td) : sum, 0)) };
}

type PKState = { Ag: number; C: number };
function pkDerivative(s: PKState, p: PKParams): PKState {
  const ka = p.ka ?? 0;
  return { Ag: -ka * s.Ag, C: 1000 * (p.F ?? 1) * ka * s.Ag / p.V - p.ke * s.C };
}
function pkAdd(s: PKState, k: PKState, f: number): PKState { return { Ag: s.Ag + f * k.Ag, C: s.C + f * k.C }; }
function pkAdvance(s: PKState, h: number, p: PKParams, method: Method): PKState {
  const k1 = pkDerivative(s, p); if (method === 'euler') return pkAdd(s, k1, h);
  const k2 = pkDerivative(pkAdd(s, k1, h / 2), p), k3 = pkDerivative(pkAdd(s, k2, h / 2), p), k4 = pkDerivative(pkAdd(s, k3, h), p);
  return { Ag: s.Ag + h / 6 * (k1.Ag + 2 * k2.Ag + 2 * k3.Ag + k4.Ag), C: s.C + h / 6 * (k1.C + 2 * k2.C + 2 * k3.C + k4.C) };
}
export function solveNumerical(p: PKParams, duration: number, step: number, method: Method): SolverResult {
  const v = validateParameters(p); if (!v.valid) throw new Error(v.message);
  const events = doseTimes(p); const time = timeGrid(duration, step, events);
  let state: PKState = p.ka === undefined ? { Ag: 0, C: 1000 * p.dose / p.V } : { Ag: p.dose, C: 0 };
  const C = [state.C];
  for (let i = 1; i < time.length; i++) {
    state = pkAdvance(state, time[i] - time[i - 1], p, method);
    if (events.slice(1).some(td => Math.abs(td - time[i]) < 1e-12)) {
      if (p.ka === undefined) state.C += 1000 * p.dose / p.V;
      else state.Ag += p.dose;
    }
    C.push(state.C);
  }
  return { time, C };
}
export const solvePK_Euler = (p: PKParams, duration: number, step: number) => solveNumerical(p, duration, step, 'euler');
export const solvePK_RK4 = (p: PKParams, duration: number, step: number) => solveNumerical(p, duration, step, 'rk4');

export function calculatePD_Emax(conc: number[], Emax: number, EC50: number, E0 = 0, hill = 1): number[] {
  if (!Number.isFinite(Emax) || Emax < 0) throw new Error('Emax must be finite and non-negative.');
  if (!Number.isFinite(EC50) || EC50 <= 0) throw new Error('EC50 must be finite and positive.');
  if (!Number.isFinite(E0)) throw new Error('Baseline response E0 must be finite.');
  if (!Number.isFinite(hill) || hill <= 0) throw new Error('Hill coefficient must be finite and positive.');
  return conc.map(c => {
    if (!Number.isFinite(c) || c < 0) throw new Error('Concentration must be finite and non-negative.');
    if (c === 0) return E0;
    const logRatio = hill * (Math.log(c) - Math.log(EC50));
    const fractionalEffect = logRatio >= 0 ? 1 / (1 + Math.exp(-logRatio)) : Math.exp(logRatio) / (1 + Math.exp(logRatio));
    return E0 + Emax * fractionalEffect;
  });
}
export function calculateRMSE(ref: number[], est: number[]): number {
  if (!ref.length || ref.length !== est.length) throw new Error('RMSE requires equal, non-empty series at matching time points.');
  return Math.sqrt(ref.reduce((sum, y, i) => sum + (y - est[i]) ** 2, 0) / ref.length);
}
export function maximumAbsoluteError(ref: number[], est: number[]): number {
  if (!ref.length || ref.length !== est.length) throw new Error('Error requires equal, non-empty series.');
  return ref.reduce((max, y, i) => Math.max(max, Math.abs(y - est[i])), 0);
}
export function calculateMetrics(time: number[], series: number[], ke: number) {
  if (!time.length || time.length !== series.length || !Number.isFinite(ke) || ke <= 0) throw new Error('Metrics require valid matching time and concentration data.');
  const peakIdx = series.reduce((best, value, i) => value > series[best] ? i : best, 0);
  return { halfLife: Math.log(2) / ke, peakC: series[peakIdx], peakT: time[peakIdx] };
}

export interface SIRParams { population: number; initialInfectious: number; initialRecovered: number; beta: number; gamma: number }
export interface SIRResult { time: number[]; S: number[]; I: number[]; R: number[] }
export function validateSIR(p: SIRParams) {
  if (![p.population, p.initialInfectious, p.initialRecovered, p.beta, p.gamma].every(Number.isFinite)) return { valid: false, message: 'All SIR parameters must be finite.' };
  if (p.population <= 0 || p.beta < 0 || p.gamma <= 0 || p.initialInfectious < 0 || p.initialRecovered < 0 || p.initialInfectious + p.initialRecovered > p.population) return { valid: false, message: 'Use N > 0, β ≥ 0, γ > 0 and non-negative I₀, R₀ with I₀ + R₀ ≤ N.' };
  return { valid: true, message: 'SIR parameters are valid.' };
}
type Triple = [number, number, number];
const sirF = ([s, i]: Triple, p: SIRParams): Triple => { const flow = p.beta * s * i / p.population; const recovery = p.gamma * i; return [-flow, flow - recovery, recovery]; };
const vecAdd = (y: Triple, k: Triple, f: number): Triple => [y[0] + f * k[0], y[1] + f * k[1], y[2] + f * k[2]];
function vecStep(y: Triple, h: number, f: (y: Triple) => Triple, method: Method): Triple {
  const k1 = f(y); if (method === 'euler') return vecAdd(y, k1, h);
  const k2 = f(vecAdd(y, k1, h / 2)), k3 = f(vecAdd(y, k2, h / 2)), k4 = f(vecAdd(y, k3, h));
  return [0, 1, 2].map(j => y[j] + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) as Triple;
}
function populationGrid(duration: number, step: number): number[] {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(step) || step <= 0) throw new Error('Duration and step must be finite and positive.');
  const n = Math.ceil(duration / step); if (n > 100_000) throw new Error('Maximum 100,000 simulation steps.');
  return Array.from({ length: n + 1 }, (_, i) => i === n ? duration : Number((i * step).toPrecision(14)));
}
export function solveSIR(p: SIRParams, duration: number, step: number, method: Method = 'rk4'): SIRResult {
  const v = validateSIR(p); if (!v.valid) throw new Error(v.message);
  const time = populationGrid(duration, step); let y: Triple = [p.population - p.initialInfectious - p.initialRecovered, p.initialInfectious, p.initialRecovered];
  const data: Triple[] = [y];
  for (let j = 1; j < time.length; j++) { y = vecStep(y, time[j] - time[j - 1], state => sirF(state, p), method); data.push(y); }
  return { time, S: data.map(x => x[0]), I: data.map(x => x[1]), R: data.map(x => x[2]) };
}
export function sirInvariants(r: SIRResult, population: number) {
  const totals = r.S.map((s, i) => s + r.I[i] + r.R[i]);
  const peakInfectious = r.I.reduce((max, value) => Math.max(max, value), 0);
  const minimumCompartment = [...r.S, ...r.I, ...r.R].reduce((min, value) => Math.min(min, value), Infinity);
  return { maxConservationError: maximumAbsoluteError(totals, totals.map(() => population)), minimumCompartment, peakInfectious, peakTime: r.time[r.I.indexOf(peakInfectious)] };
}

export interface LogisticParams { growthRate: number; capacity: number; initial: number }
export function solveLogistic(p: LogisticParams, duration: number, step: number, method: Method = 'rk4') {
  if (![p.growthRate, p.capacity, p.initial].every(Number.isFinite) || p.growthRate <= 0 || p.capacity <= 0 || p.initial <= 0 || p.initial > p.capacity) throw new Error('Use finite r > 0, K > 0 and 0 < x₀ ≤ K.');
  const time = populationGrid(duration, step); const f = (x: number) => p.growthRate * x * (1 - x / p.capacity);
  const exact = time.map(t => p.capacity / (1 + (p.capacity / p.initial - 1) * Math.exp(-p.growthRate * t)));
  let value = p.initial; const numeric = [value];
  for (let j = 1; j < time.length; j++) { const h = time[j] - time[j - 1]; if (method === 'euler') value += h * f(value); else { const k1=f(value),k2=f(value+h*k1/2),k3=f(value+h*k2/2),k4=f(value+h*k3); value += h*(k1+2*k2+2*k3+k4)/6; } numeric.push(value); }
  return { time, exact, numeric };
}

export interface DrugPreset { name: string; eliminationRate: number; volumeDistribution: number; absorptionRate: number; bioavailability: number; EC50: number; Emax: number; evidenceStatus: 'illustrative'; notes: string }
export const getDrugPresets = (): DrugPreset[] => [
  { name: 'Metoprolol (illustrative)', eliminationRate: .20, volumeDistribution: 3.2, absorptionRate: 1.2, bioavailability: .5, EC50: 28.1, Emax: 100, evidenceStatus: 'illustrative', notes: 'Unverified demonstration assumptions; not validated clinical parameters.' },
  { name: 'Indomethacin (illustrative)', eliminationRate: .26, volumeDistribution: .29, absorptionRate: 1, bioavailability: .8, EC50: 350, Emax: 100, evidenceStatus: 'illustrative', notes: 'Unverified demonstration assumptions; not validated clinical parameters.' },
  { name: 'Theophylline (illustrative)', eliminationRate: .085, volumeDistribution: .45, absorptionRate: .8, bioavailability: .9, EC50: 8500, Emax: 100, evidenceStatus: 'illustrative', notes: 'Unverified demonstration assumptions; not validated clinical parameters.' },
];
