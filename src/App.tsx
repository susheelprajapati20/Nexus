import React, { useEffect, useMemo, useState } from 'react';
import PracticalPlot, { type PracticalCurve } from './PracticalPlot';
import Overview from './Overview';
import MathGuide, {EquationNotes} from './MathGuide';
import Research from './Research';
import {Logo,Icon} from './Identity';
import 'katex/dist/katex.min.css';
import { exactPKAtTimes, calculateMetrics, calculatePD_Emax, calculateRMSE, maximumAbsoluteError, solveLogistic, solvePK_Euler, solvePK_Exact, solvePK_RK4, solveSIR, sirInvariants, validateParameters, validateSIR, type PKParams, type SIRParams } from './engine/math';
import { categoryFilters, modelRegistry, modelSources, type ModelDefinition } from './engine/models';
import { createSimulationPdf } from './engine/report';
import { defaultAntibioticExample, solveAntibioticExample, validateAntibioticExample, type AntibioticExampleParams } from './engine/antibiotic';
import './style.css';
import './nexus.css';
import Distribution from './Distribution';

type Page = 'demo' | 'body' | 'home' | 'explorer' | 'simulator' | 'equations' | 'research' | 'about';
type ModelId = 'pk-iv' | 'pk-oral' | 'pd-emax' | 'antibiotic-bacteria' | 'sir' | 'logistic';
type Curve = PracticalCurve;
type Study = { step: number; euler: number; rk4: number } | null;
interface SimResult {
  time: number[]; timeUnit: string; valueUnit: string; modelName: string; question: string; exactAvailable: boolean;
  curves: Curve[]; responseCurve?: Curve[]; metrics: Array<[string, string | number]>; study: Study[]; warnings: string[];
  assumptions: string[]; equations: string[]; parameters: Array<[string, string | number]>;
  drugLevelCurve?: Curve;
}
const defaultPK: PKParams = { dose: 100, V: 10, ke: .2, ka: 1.2, F: .7, numberOfDoses: 1, dosingInterval: 12 };
const defaultSIR: SIRParams = { population: 1000, initialInfectious: 5, initialRecovered: 0, beta: .3, gamma: .1 };
const pageNames: Record<Page, string> = { demo: 'Class demo', body: 'Body view', home: 'Overview', explorer: 'Practicals', simulator: 'Simulator', equations: 'Maths', research: 'Research', about: 'About' };
const knownPages = Object.keys(pageNames) as Page[];
function readPage(): Page { if (typeof window === 'undefined') return 'home'; const candidate = window.location.hash.replace(/^#\/?/, '').split('?')[0] as Page; return knownPages.includes(candidate) ? candidate : 'home'; }
function Field({ label, symbol, unit, value, min, max, step = 'any', onChange }: { label: string; symbol?: string; unit: string; value: number; min?: number; max?: number; step?: string; onChange: (n: number) => void }) {
  return <label className="input-field"><span>{label} {symbol && <i>{symbol}</i>}<small>{unit}</small></span><input type="number" value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step} onChange={e => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))} /></label>;
}

function SimulationGraphs({ result, selected, select, mode, onModeChange, modelId, pk, treatmentDelay, sensitivity }: {
  result:SimResult; selected:number; select:(index:number)=>void;
  mode:'time'|'concentration'; onModeChange:(mode:'time'|'concentration')=>void;
  modelId:ModelId; pk:PKParams; treatmentDelay:number; sensitivity:[number,number,number,number];
}) {
  const timeLabel='Time ('+result.timeUnit+')';
  const mainLabel=modelId==='antibiotic-bacteria'?'Bacteria (relative units)':modelId==='sir'?'Population (people)':
    modelId==='logistic'?'Population (model units)':'Concentration ('+result.valueUnit+')';
  const drugSeries=useMemo(()=>result.drugLevelCurve?[result.drugLevelCurve]:[],[result]);
  const [emax,ec50,e0,hill]=sensitivity;
  const jumps=useMemo(()=>{
    const main=new Map<number,number[]>(), response=new Map<number,number[]>(), drug=new Map<number,number[]>();
    if(modelId==='pk-iv' && (pk.numberOfDoses??1)>1) {
      const byTime=new Map(result.time.map((time,index)=>[time,index]));
      const bolus=1000*pk.dose/pk.V;
      for(let n=1;n<(pk.numberOfDoses??1);n++) {
        const index=byTime.get(Number((n*(pk.dosingInterval??0)).toPrecision(14)));
        if(index===undefined)continue;
        const previous=result.curves.map(curve=>Math.max(0,curve.values[index]-bolus));
        main.set(index,previous);
        response.set(index,calculatePD_Emax([previous[0]],emax,ec50,e0,hill));
      }
    }
    if(result.drugLevelCurve && treatmentDelay>0) {
      const index=result.time.indexOf(treatmentDelay);
      if(index>=0)drug.set(index,[0]);
    }
    return {main,response,drug};
  },[result,modelId,pk,treatmentDelay,emax,ec50,e0,hill]);
  return <>
    <PracticalPlot primary series={result.curves} x={result.time} xLabel={timeLabel}
      yLabel={mainLabel} selected={selected} onSelect={select} beforeJump={jumps.main}/>
    {result.drugLevelCurve&&<>
      <div className="drug-level-chart"><div className="chart-toolbar"><div><span className="section-label">DRUG LEVEL</span><p>Example level over time</p></div></div>
        <PracticalPlot series={drugSeries} x={result.time} xLabel={timeLabel} yLabel="Drug level (relative units)"
          selected={selected} onSelect={select} beforeJump={jumps.drug}/>
      </div>
      <BodyCanvas drugLevel={result.drugLevelCurve.values[selected]} bacteria={result.curves[1].values[selected]} time={result.time[selected]}/>
    </>}
    {result.responseCurve&&<article className="response-card">
      <div className="chart-toolbar"><div><span className="section-label">DIRECT-LINK EMAX</span><p>{mode==='time'?'Response over time':'Response versus concentration'}</p></div>
        <label className="plot-select"><span>Plot</span><select aria-label="Response plot" value={mode} onChange={e=>onModeChange(e.target.value as 'time'|'concentration')}>
          <option value="time">Response vs time</option><option value="concentration">Response vs concentration</option>
        </select></label>
      </div>
      <PracticalPlot series={result.responseCurve} x={mode==='time'?result.time:result.curves[0].values}
        xLabel={mode==='time'?timeLabel:'Concentration (ng/mL)'} yLabel="Response (model units)" selected={selected}
        concentrationAxis={mode==='concentration'} timeCaption={mode==='concentration'?result.time[selected].toFixed(2)+' '+result.timeUnit:undefined}
        beforeJump={mode==='time'?jumps.response:undefined} onSelect={select}/>
    </article>}
  </>;
}

function BodyCanvas({ drugLevel, bacteria, time }: { drugLevel: number; bacteria: number; time: number }) {
  const level = Math.max(0, Math.min(1, drugLevel / 8));
  return <section className="body-canvas-panel" aria-label="Illustrative body and infection view"><div className="chart-toolbar"><div><span className="section-label">BODY VIEW · EXAMPLE</span><p>Follow the example level and bacteria value</p></div><span className="body-time">Hour {time.toFixed(1)}</span></div><div className="body-canvas"><div className="body-figure"><svg viewBox="0 0 230 310" role="img" aria-label="Simple human outline with a highlighted example infection area"><defs><linearGradient id="bodyFill" x1="0" x2="1"><stop stopColor="#dfeaff"/><stop offset=".55" stopColor="#edf4ff"/><stop offset="1" stopColor="#d8edeb"/></linearGradient></defs><ellipse cx="115" cy="36" rx="23" ry="27" fill="url(#bodyFill)" stroke="#91afd0" strokeWidth="2"/><path d="M92 68 Q115 58 138 68 L155 83 L151 157 L137 169 L135 219 L148 294 L125 294 L114 226 L103 294 L80 294 L94 219 L91 169 L77 157 L74 83 Z" fill="url(#bodyFill)" stroke="#91afd0" strokeWidth="2"/><path d="M76 86 L55 166 L42 222 M154 86 L175 166 L188 222" fill="none" stroke="#91afd0" strokeWidth="12" strokeLinecap="round"/><path d="M115 78 L115 209" fill="none" stroke="#6f94c0" strokeWidth="3" strokeDasharray="4 6"/><circle cx="115" cy="131" r="22" fill="#fbe2e7" stroke="#cf6271" strokeWidth="2"/><circle cx="115" cy="131" r="8" fill="#cf6271" opacity={.3 + (bacteria / (bacteria + 300)) * .7}/><path d="M93 80 C94 100 101 114 115 131 C130 150 137 168 137 191" fill="none" stroke="#2f69d8" strokeWidth="2" strokeDasharray="4 5" opacity={.45 + .5 * level}/>{[0,1,2,3,4].map(i=><circle key={i} cx={101 + (i%2)*27} cy={91 + i*18 + Math.sin(time*.35+i)*4} r="3" fill="#2f69d8" opacity={level > i/5 ? .92 : .18}/>)}</svg><span className="body-caption">Illustration only · not anatomical</span></div><div className="body-readouts"><div><i className="readout-dot blue"/><span>Example drug level</span><b>{drugLevel.toFixed(2)} level units</b></div><div><i className="readout-dot red"/><span>Bacteria in model</span><b>{bacteria.toFixed(1)} relative units</b></div><div className="body-note">The markers follow the selected simulation time. This illustration does not show real medicine inside a body.</div></div></div></section>;
}

const App: React.FC = () => {
  const [page, setPage] = useState<Page>(readPage);
  const [modelId, setModelId] = useState<ModelId>('pk-oral');
  const [pk, setPK] = useState<PKParams>(defaultPK);
  const [ec50, setEC50] = useState(900);
  const [e0, setE0] = useState(0);
  const [emax, setEmax] = useState(100);
  const [hill, setHill] = useState(1);
  const [sir, setSIR] = useState<SIRParams>(defaultSIR);
  const [antibiotic, setAntibiotic] = useState<AntibioticExampleParams>(defaultAntibioticExample);
  const [infectionLabel, setInfectionLabel] = useState('Example bacterial infection');
  const [antibioticDuration, setAntibioticDuration] = useState(72);
  const [antibioticStep, setAntibioticStep] = useState(.25);
  const [diseaseLabel, setDiseaseLabel] = useState('Illustrative disease scenario');
  const [sirDuration, setSIRDuration] = useState(160);
  const [sirStep, setSIRStep] = useState(.5);
  const [logistic, setLogistic] = useState({ growthRate: .3, capacity: 1000, initial: 25 });
  const [duration, setDuration] = useState(24);
  const [step, setStep] = useState(.25);
  const [activeTab, setActiveTab] = useState('Graph');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(categoryFilters[0]);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [showBaseline, setShowBaseline] = useState(false);
  const [responseMode, setResponseMode] = useState<'time' | 'concentration'>('time');
  const [baselinePK, setBaselinePK] = useState<PKParams>(defaultPK);
  const [playIndex, setPlayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [demoRun,setDemoRun]=useState(0);
  const [firstVisit,setFirstVisit]=useState(()=>{try{return !localStorage.getItem('nexus-tablet-tour')}catch{return true}});
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const sync=()=>{setPage(readPage());setPlaying(false);setMenuOpen(false);setActiveTab('Graph');window.scrollTo(0,0)};
    window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);
  },[]);
  useEffect(()=>{document.title=pageNames[page]+' · Nexus Mathematics Lab'},[page]);
  useEffect(()=>{
    if(!tourOpen)return;
    const returnFocus=document.activeElement as HTMLElement|null;
    const dialog=document.querySelector<HTMLElement>('.tour-dialog');
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape')finishTour();
      if(e.key!=='Tab')return;
      const buttons=dialog?.querySelectorAll<HTMLButtonElement>('button');
      if(!buttons?.length)return;
      const first=buttons[0],last=buttons[buttons.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    };
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);if(returnFocus?.isConnected)returnFocus.focus()};
  },[tourOpen]);

  const selected = modelRegistry.find(m => m.id === modelId) as ModelDefinition;
  const calculation = useMemo<SimResult | Error>(() => {
    const warnings: string[] = [];
    try {
      if (modelId === 'pk-iv' || modelId === 'pk-oral' || modelId === 'pd-emax') {
        const params: PKParams = { ...pk, ka: modelId === 'pk-iv' ? undefined : pk.ka, F: modelId === 'pk-iv' ? undefined : pk.F };
        const valid = validateParameters(params); if (!valid.valid) throw new Error(valid.message);
        if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(step) || step <= 0) throw new Error('Duration and step size must be finite positive values.');
        if (!Number.isFinite(ec50) || ec50 <= 0 || !Number.isFinite(emax) || emax < 0 || !Number.isFinite(e0) || !Number.isFinite(hill) || hill <= 0) throw new Error('Check E₀, Emax, EC₅₀ and Hill coefficient; EC₅₀ and n must be positive.');
        const exact = solvePK_Exact(params, duration, step), eu = solvePK_Euler(params, duration, step), rk = solvePK_RK4(params, duration, step);
        const response = calculatePD_Emax(exact.C, emax, ec50, e0, hill);
        const study: Study[] = [step, step / 2, step / 4].map(h => {
          if (Math.ceil(duration / h) > 20_000) return null;
          const ref = solvePK_Exact(params, duration, h);
          return { step: h, euler: calculateRMSE(ref.C, solvePK_Euler(params, duration, h).C), rk4: calculateRMSE(ref.C, solvePK_RK4(params, duration, h).C) };
        });
        if (eu.C.some(c => c < -1e-9)) warnings.push('Euler produced a negative concentration. Reduce the step size; negative concentration is a numerical artifact for this model.');
        if ([...exact.C, ...eu.C, ...rk.C, ...response].some(v => !Number.isFinite(v))) warnings.push('A non-finite solver result was detected; reduce the step size or review the parameters.');
        const metrics = calculateMetrics(exact.time, exact.C, params.ke);
        const curves: Curve[] = [
          { label: 'Analytical concentration', values: exact.C, color: '#315fce' },
          { label: 'Euler concentration', values: eu.C, color: '#d1892d' },
          { label: 'RK4 concentration', values: rk.C, color: '#08a08a' },
        ];
        const baseline = showBaseline && modelId !== 'pk-iv' ? exactPKAtTimes(baselinePK, exact.time) : null;
        if (baseline && (Math.abs(pk.dose - baselinePK.dose) > 1e-12 || Math.abs(pk.ke - baselinePK.ke) > 1e-12 || Math.abs(pk.V - baselinePK.V) > 1e-12 || Math.abs((pk.ka ?? 0) - (baselinePK.ka ?? 0)) > 1e-12 || Math.abs((pk.F ?? 1) - (baselinePK.F ?? 1)) > 1e-12 || (pk.numberOfDoses ?? 1) !== (baselinePK.numberOfDoses ?? 1) || (pk.dosingInterval ?? 0) !== (baselinePK.dosingInterval ?? 0))) curves.push({ label: 'Baseline concentration', values: baseline, color: '#687681', dash: [10, 3, 2, 3] });
        return { time: exact.time, timeUnit: 'h', valueUnit: 'ng/mL', modelName: selected.name, question: selected.question, exactAvailable: true, curves, responseCurve: [{ label: 'Emax response', values: response, color: '#7853bc' }], metrics: [['Model half-life', `${metrics.halfLife.toFixed(3)} h`], ['Peak concentration', `${metrics.peakC.toFixed(3)} ng/mL at ${metrics.peakT.toFixed(2)} h`], ['Euler difference', `${calculateRMSE(exact.C, eu.C).toPrecision(4)} ng/mL`], ['RK4 difference', `${calculateRMSE(exact.C, rk.C).toPrecision(4)} ng/mL`], ['Largest RK4 difference', `${maximumAbsoluteError(exact.C, rk.C).toPrecision(4)} ng/mL`]], study, warnings, assumptions: selected.assumptions, equations: [modelRegistry.find(m=>m.id===(modelId==='pk-iv'?'pk-iv':'pk-oral'))!.model, modelRegistry.find(m=>m.id==='pd-emax')!.model], parameters: [['Dose', `${pk.dose} mg × ${pk.numberOfDoses ?? 1} doses`], ['Interval', `${pk.dosingInterval??12} h`], ['Volume', `${pk.V} L`], ['kₑ', `${pk.ke} h⁻¹`], ...(params.ka !== undefined ? [['kₐ', `${params.ka} h⁻¹`] as [string,string], ['F', String(params.F)] as [string,string]] : []), ['EC₅₀', `${ec50} ng/mL`], ['E₀ / Emax / n', `${e0} / ${emax} / ${hill}`], ['Duration / step', `${duration} h / ${step} h`]] };
      }
      if (modelId === 'antibiotic-bacteria') {
        const valid = validateAntibioticExample(antibiotic, antibioticDuration, antibioticStep);
        if (!valid.valid) throw new Error(valid.message);
        const output = solveAntibioticExample(antibiotic, antibioticDuration, antibioticStep);
        if ([...output.drugLevel, ...output.bacteriaWithDrug, ...output.bacteriaWithoutDrug].some(v => !Number.isFinite(v) || v < 0)) warnings.push('The example calculation left its expected non-negative range. Reduce the time step and review the chosen values.');
        const untreatedEnd = output.bacteriaWithoutDrug.at(-1) ?? 0, treatedEnd = output.bacteriaWithDrug.at(-1) ?? 0;
        return { time: output.time, timeUnit: 'hours', valueUnit: 'relative bacteria units', modelName: `Example bacteria model · ${infectionLabel.trim() || 'unnamed example'}`, question: selected.question, exactAvailable: false, curves: [{ label: 'Without example antibiotic', values: output.bacteriaWithoutDrug, color: '#cf5368' }, { label: 'With example antibiotic', values: output.bacteriaWithDrug, color: '#168c71' }], drugLevelCurve: { label: 'Example antibiotic level', values: output.drugLevel, color: '#315fce' }, metrics: [['Bacteria at start', `${antibiotic.bacteriaAtStart.toFixed(1)} relative units`], ['Bacteria at end with example treatment', `${treatedEnd.toFixed(1)} relative units`], ['Bacteria at end without treatment', `${untreatedEnd.toFixed(1)} relative units`], ['Treatment begins', `${antibiotic.treatmentDelay} hours`]], study: [], warnings, assumptions: selected.assumptions, equations: [selected.model], parameters: [['Example name', infectionLabel.trim() || 'Unnamed example'], ['Starting bacteria', antibiotic.bacteriaAtStart+' relative units'], ['Population limit', antibiotic.bacteriaLimit+' relative units'], ['Growth speed', `${antibiotic.growthRate} per hour`], ['Example drug level', `${antibiotic.drugLevelAtStart} level units`], ['Drug removal speed', `${antibiotic.drugRemovalRate} per hour`], ['Maximum model kill speed', `${antibiotic.maxKillRate} per hour`], ['Effect level', `${antibiotic.effectLevel} level units`], ['Treatment start delay', `${antibiotic.treatmentDelay} hours`], ['Run length / time step', `${antibioticDuration} h / ${antibioticStep} h`]] };
      }
      if (modelId === 'sir') {
        const valid = validateSIR(sir); if (!valid.valid) throw new Error(valid.message);
        const rk = solveSIR(sir, sirDuration, sirStep, 'rk4'), eu = solveSIR(sir, sirDuration, sirStep, 'euler');
        const invariant = sirInvariants(rk, sir.population);
        if (invariant.minimumCompartment < -1e-7) warnings.push('The solver produced a negative compartment count. Reduce the step size.');
        if (invariant.maxConservationError > Math.max(1e-7, sir.population * 1e-9)) warnings.push('S + I + R deviates from N beyond floating-point tolerance; refine the step size.');
        const study: Study[] = [sirStep, sirStep / 2, sirStep / 4].map(h => {
          if (Math.ceil(sirDuration / h) > 20_000) return null;
          const coarseE = solveSIR(sir, sirDuration, h, 'euler'), coarseR = solveSIR(sir, sirDuration, h, 'rk4'), ref = solveSIR(sir, sirDuration, h / 8, 'rk4');
          const sample = (times: number[], values: number[], targets: number[]) => targets.map(t => { const j = times.findIndex(x => x >= t); if (j <= 0) return values[Math.max(0, j)]; if (times[j] === t) return values[j]; const f = (t - times[j-1]) / (times[j] - times[j-1]); return values[j-1] + f * (values[j] - values[j-1]); });
          return { step: h, euler: calculateRMSE(sample(ref.time, ref.I, coarseE.time), coarseE.I), rk4: calculateRMSE(sample(ref.time, ref.I, coarseR.time), coarseR.I) };
        });
        return { time: rk.time, timeUnit: 'days', valueUnit: 'people', modelName: `SIR simulation · ${diseaseLabel.trim() || 'unnamed scenario'}`, question: selected.question, exactAvailable: false, curves: [{ label: 'Susceptible', values: rk.S, color: '#315fce' }, { label: 'Infectious', values: rk.I, color: '#de5b64' }, { label: 'Recovered', values: rk.R, color: '#08a08a' }, { label: 'Infectious (Euler comparison)', values: eu.I, color: '#d1892d', dash: [5,4] }], metrics: [['Starting population', `${sir.population} people`], ['Infectious peak', `${invariant.peakInfectious.toFixed(2)} people at day ${invariant.peakTime.toFixed(2)}`], ['Basic reproduction number (early stage)', (sir.beta / sir.gamma).toFixed(3)], ['Population total check', `${invariant.maxConservationError.toExponential(2)} people`]], study, warnings, assumptions: selected.assumptions, equations: [selected.model, 'N = S + I + R is constant'], parameters: [['Scenario name', diseaseLabel.trim() || 'Unnamed scenario'], ['Population', `${sir.population} people`], ['Infectious at start', `${sir.initialInfectious} people`], ['Recovered at start', `${sir.initialRecovered} people`], ['Spread rate β', `${sir.beta} day⁻¹`], ['Recovery rate γ', `${sir.gamma} day⁻¹`], ['Duration / step', `${sirDuration} days / ${sirStep} days`]] };
      }
      const raw = solveLogistic(logistic, duration, step, 'rk4');
      const eu = solveLogistic(logistic, duration, step, 'euler');
      const study: Study[] = [step, step / 2, step / 4].map(h => {
        if (Math.ceil(duration / h) > 20_000) return null;
        const ref = solveLogistic(logistic, duration, h), e = solveLogistic(logistic, duration, h, 'euler'), r = solveLogistic(logistic, duration, h, 'rk4');
        return { step: h, euler: calculateRMSE(ref.exact, e.numeric), rk4: calculateRMSE(ref.exact, r.numeric) };
      });
      if (eu.numeric.some(v => v < -1e-8 || v > logistic.capacity * 1.5)) warnings.push('Euler left the expected non-negative bounded range. Reduce the step size.');
      return { time: raw.time, timeUnit: 'time units', valueUnit: 'population units', modelName: selected.name, question: selected.question, exactAvailable: true, curves: [{ label: 'Analytical solution', values: raw.exact, color: '#315fce' }, { label: 'Euler', values: eu.numeric, color: '#d1892d' }, { label: 'RK4', values: raw.numeric, color: '#08a08a' }], metrics: [['Carrying capacity', logistic.capacity], ['Initial population', logistic.initial], ['Analytical endpoint', raw.exact.at(-1)!.toFixed(3)], ['RK4 difference', calculateRMSE(raw.exact, raw.numeric).toPrecision(4)]], study, warnings, assumptions: selected.assumptions, equations: [selected.model], parameters: [['Growth rate r', logistic.growthRate], ['Capacity K', logistic.capacity], ['Initial x₀', logistic.initial], ['Duration / step', `${duration} / ${step}`]] };
    } catch (error) { return error instanceof Error ? error : new Error('Check the parameter values.'); }
  }, [modelId, pk, ec50, e0, emax, hill, sir, diseaseLabel, antibiotic, infectionLabel, antibioticDuration, antibioticStep, sirDuration, sirStep, logistic, duration, step, selected, baselinePK, showBaseline]);

  const result=calculation instanceof Error?null:calculation;
  const calcError=calculation instanceof Error?calculation.message:'';
  const lastIndex=Math.max(0,(result?.time.length??1)-1);
  useEffect(()=>{setPlayIndex(lastIndex);setPlaying(false)},[lastIndex,modelId]);
  useEffect(() => { if (!playing || !result) return; const timer = window.setInterval(() => setPlayIndex(i => { if (i >= result.time.length - 1) { setPlaying(false); return i; } return i + 1; }), 75); return () => window.clearInterval(timer); }, [playing, result]);

  const visibleModels = modelRegistry.filter(m => (category === 'All models' || category === 'Numerical methods' && m.category === 'Numerical methods' || m.category === category) && `${m.name} ${m.category} ${m.question} ${m.model}`.toLowerCase().includes(query.toLowerCase()));
  const setPKValue = (key: keyof PKParams, value: number) => setPK(old => ({ ...old, [key]: value }));
  const openModel = (id: string) => { if (id === 'ode-comparison') setModelId('pk-oral'); else if (['pk-iv','pk-oral','pd-emax','antibiotic-bacteria','sir','logistic'].includes(id)) setModelId(id as ModelId); setActiveTab('Graph'); window.location.hash = 'simulator'; };
  const downloadPdf = () => {
    if (!result) return;
    const bytes = createSimulationPdf({ title: 'Nexus · Simulation results', model: result.modelName, timestamp: new Date().toLocaleString(), timeLabel: result.timeUnit, valueLabel: result.valueUnit, parameters: result.parameters, metrics: result.metrics, time: result.time, selectedTime: result.time[Math.min(playIndex,result.time.length-1)], equations: result.equations, series: result.curves.map(c => ({ label: c.label, values: c.values, color: c.color })), secondarySeries: result.drugLevelCurve ? [{ label: result.drugLevelCurve.label, values: result.drugLevelCurve.values, color: result.drugLevelCurve.color }] : result.responseCurve, secondaryValueLabel: result.drugLevelCurve ? 'relative level units' : 'response units', secondaryGraphTitle: result.drugLevelCurve ? 'Example drug level' : 'Predicted response', disclaimer: 'Educational simulation only. Not for medical treatment or medication decisions.' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: 'application/pdf' })); a.download = 'Nexus_Results.pdf'; a.click(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1200);
  };

  const finishTour = () => { setTourOpen(false); setTourStep(0); setFirstVisit(false); try { localStorage.setItem('nexus-tablet-tour','done'); } catch { /* tour still works without saved preference */ } };

  const nav = (target: Page) => <a href={`#${target}`} aria-current={page === target ? 'page' : undefined}>{pageNames[target]}</a>;
  return <div className="site-shell">
    <a className="nx-skip" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus()}}>Skip to content</a>
    <header className="nx-header"><div className="nx-header-inner"><Logo/>
      <button className="nx-menu-btn" aria-label="Toggle navigation" aria-controls="site-nav" aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}><Icon name={menuOpen?'close':'menu'}/></button>
      <nav id="site-nav" className={menuOpen?'open':''} aria-label="Main navigation">{nav('home')}{nav('body')}{nav('explorer')}{nav('equations')}{nav('research')}</nav>
      <div className="nx-header-actions"><label className="nx-language"><Icon name="globe" size={17}/><select aria-label="Caption and equation language" value={language} onChange={e=>setLanguage(e.target.value as 'en'|'hi')}><option value="en">English</option><option value="hi">Hinglish</option></select></label><a className="nx-demo" href="#demo" onClick={()=>{if(page==='demo')setDemoRun(run=>run+1)}}><Icon name="play" size={14}/>Class demo</a></div>
    </div></header>
    <main id="main-content" tabIndex={-1} className={'page-wrap nx-wrap page-'+page} key={page}>
      {(page==='body'||page==='demo')&&<Distribution key={page+demoRun} demo={page==='demo'} language={language}/>}
      {page==='home'&&<Overview openModel={openModel} firstVisit={firstVisit} startTour={()=>{setTourStep(firstVisit?1:0);setTourOpen(true)}}/>}
      {page === 'explorer' && <><section className="page-heading"><div className="eyebrow">MODEL LIBRARY</div><h1>Choose a simulation</h1><p>Pick a model to explore. Each one shows the values you can change and the results you will see.</p></section><div className="explorer-tools"><label className="search-box"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search models" aria-label="Search models"/></label><div className="filter-row" role="group" aria-label="Filter by model category">{categoryFilters.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div></div><section className="explorer-grid">{visibleModels.map((m,i)=><article className="explorer-card" key={m.id}><div className="card-top"><span className="category-chip">{m.category}</span><span className={`evidence-pill ${m.status}`}>{m.status==='implemented'?'Ready to try':'Being researched'}</span></div><h2>{m.name}</h2><p className="question"><b>What can I explore?</b>{m.question}</p><div className="model-summary"><span><b>Values you set</b>{m.inputs.join(' · ')}</span><span><b>Results you see</b>{m.outputs.join(' · ')}</span></div>{m.status==='implemented'?<button className="button primary" onClick={()=>openModel(m.id)}>Try this model <span>↗</span></button>:<span className="research-note">This model will be added after its inputs and evidence are checked.</span>}</article>)}</section>{visibleModels.length===0&&<div className="empty-state">No models match your search. Try a shorter word.</div>}</>}

      {page === 'simulator' && <><section className="page-heading compact-heading"><div className="eyebrow">INTERACTIVE MODELS</div><h1>Build a simulation</h1><p>Choose a model, set a few values, and watch the graph update. The antibiotic example links drug level, bacteria growth and treatment start time.</p></section><div className="sim-selector"><label>Choose a model<select value={modelId} onChange={e=>{setModelId(e.target.value as ModelId);setActiveTab('Graph');}}>{modelRegistry.filter(m=>m.status==='implemented'&&m.id!=='ode-comparison').map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label><span className="live-status"><i/> Updates when values change</span><button className="button small-outline" onClick={()=>{setPK(defaultPK);setSIR(defaultSIR);setDiseaseLabel('Illustrative disease scenario');setAntibiotic(defaultAntibioticExample);setInfectionLabel('Example bacterial infection');setAntibioticDuration(72);setAntibioticStep(.25);setSIRDuration(160);setSIRStep(.5);setLogistic({growthRate:.3,capacity:1000,initial:25});setDuration(24);setStep(.25);setEC50(900);setE0(0);setEmax(100);setHill(1);}}>Reset values</button></div>
        <div className="tab-bar" role="tablist" aria-label="Simulator sections">{['Graph','Equation','Inputs','Results','Checks'].map(t=><button role="tab" aria-selected={activeTab===t} className={activeTab===t?'active':''} key={t} onClick={()=>setActiveTab(t)}>{t}</button>)}</div>
        <div className="sim-layout"><aside className="input-panel"><div className="panel-title"><span className="section-label">SET YOUR VALUES</span><span className="control-count">{modelId==='antibiotic-bacteria'?'DRUG + BACTERIA':modelId.startsWith('pk')||modelId==='pd-emax'?'DRUG MODEL':modelId==='sir'?'DISEASE MODEL':'GROWTH MODEL'}</span></div>{(modelId.startsWith('pk')||modelId==='pd-emax')&&<>
          <Field label="Dose per administration" symbol="D" unit="mg" value={pk.dose} min={0} onChange={v=>setPKValue('dose',v)}/><Field label="Volume" symbol="V" unit="L" value={pk.V} min={0} onChange={v=>setPKValue('V',v)}/><Field label="Removal rate" symbol="kₑ" unit="h⁻¹" value={pk.ke} min={0} onChange={v=>setPKValue('ke',v)}/>
          {modelId!=='pk-iv'&&<><Field label="Absorption speed" symbol="kₐ" unit="h⁻¹" value={pk.ka??1} min={0} onChange={v=>setPKValue('ka',v)}/><Field label="Fraction absorbed" symbol="F" unit="fraction 0–1" value={pk.F??1} min={0} max={1} step="0.01" onChange={v=>setPKValue('F',v)}/></>}
          <div className="field-pair"><Field label="Dose count" symbol="m" unit="integer" value={pk.numberOfDoses??1} min={1} step="1" onChange={v=>setPKValue('numberOfDoses',v)}/><Field label="Time between doses" symbol="τ" unit="h" value={pk.dosingInterval??12} min={0} onChange={v=>setPKValue('dosingInterval',v)}/></div><div className="field-pair"><Field label="How long to run" unit="h" value={duration} min={0} step="0.5" onChange={setDuration}/><Field label="Time step" symbol="h" unit="h" value={step} min={0} step="0.05" onChange={setStep}/></div>
          <details className="advanced-inputs"><summary>Response settings (optional)</summary><Field label="Baseline response" symbol="E₀" unit="response units" value={e0} onChange={setE0}/><Field label="Maximum added response" symbol="Emax" unit="response units" value={emax} min={0} onChange={setEmax}/><Field label="Concentration for half response" symbol="EC₅₀" unit="ng/mL" value={ec50} min={0} onChange={setEC50}/><Field label="Curve steepness" symbol="n" unit="dimensionless" value={hill} min={0} step="0.1" onChange={setHill}/></details>
        </>}
        {modelId==='antibiotic-bacteria'&&<><label className="input-field scenario-field"><span>Example name<small>For the chart and PDF</small></span><input type="text" value={infectionLabel} maxLength={60} onChange={e=>setInfectionLabel(e.target.value)}/></label><p className="scenario-note">Example values only. This model does not calculate a medicine dose or adjust values by age.</p><Field label="Bacteria at the start" unit="relative units" value={antibiotic.bacteriaAtStart} min={0} onChange={v=>setAntibiotic(x=>({...x,bacteriaAtStart:v}))}/><Field label="Bacteria growth speed" unit="per hour" value={antibiotic.growthRate} min={0} step="0.01" onChange={v=>setAntibiotic(x=>({...x,growthRate:v}))}/><Field label="Bacteria population limit" unit="relative units" value={antibiotic.bacteriaLimit} min={0} onChange={v=>setAntibiotic(x=>({...x,bacteriaLimit:v}))}/><Field label="Example drug level" unit="relative level units" value={antibiotic.drugLevelAtStart} min={0} step="0.5" onChange={v=>setAntibiotic(x=>({...x,drugLevelAtStart:v}))}/><Field label="Drug removal speed" unit="per hour" value={antibiotic.drugRemovalRate} min={0} step="0.01" onChange={v=>setAntibiotic(x=>({...x,drugRemovalRate:v}))}/><Field label="Example maximum kill speed" unit="per hour" value={antibiotic.maxKillRate} min={0} step="0.01" onChange={v=>setAntibiotic(x=>({...x,maxKillRate:v}))}/><Field label="Level for half of model effect" unit="relative level units" value={antibiotic.effectLevel} min={0} step="0.5" onChange={v=>setAntibiotic(x=>({...x,effectLevel:v}))}/><Field label="Treatment start delay" unit="hours after start" value={antibiotic.treatmentDelay} min={0} onChange={v=>setAntibiotic(x=>({...x,treatmentDelay:v}))}/><div className="field-pair"><Field label="Run length" unit="hours" value={antibioticDuration} min={0} onChange={setAntibioticDuration}/><Field label="Time step" unit="hours" value={antibioticStep} min={0} step="0.05" onChange={setAntibioticStep}/></div><p className="scenario-note">No child, adult or older adult dose is suggested. Age-based modeling needs a specific medicine and verified population data.</p></>}
        {modelId==='sir'&&<><label className="input-field scenario-field"><span>Disease or scenario name<small>Used as a label only</small></span><input type="text" value={diseaseLabel} maxLength={60} placeholder="For example: sample outbreak" aria-describedby="scenario-note" onChange={e=>setDiseaseLabel(e.target.value)}/></label><p className="scenario-note" id="scenario-note">The name does not load disease-specific values. Set the example rates below yourself.</p><Field label="Total population" symbol="N" unit="people" value={sir.population} min={1} step="1" onChange={v=>setSIR(x=>({...x,population:v}))}/><Field label="Infectious at the start" symbol="I₀" unit="people" value={sir.initialInfectious} min={0} onChange={v=>setSIR(x=>({...x,initialInfectious:v}))}/><Field label="Recovered at the start" symbol="R₀" unit="people" value={sir.initialRecovered} min={0} onChange={v=>setSIR(x=>({...x,initialRecovered:v}))}/><Field label="Spread rate" symbol="β" unit="per day" value={sir.beta} min={0} step="0.01" onChange={v=>setSIR(x=>({...x,beta:v}))}/><Field label="Recovery rate" symbol="γ" unit="per day" value={sir.gamma} min={0} step="0.01" onChange={v=>setSIR(x=>({...x,gamma:v}))}/><div className="field-pair"><Field label="Run length" unit="days" value={sirDuration} min={0} onChange={setSIRDuration}/><Field label="Time step" unit="days" value={sirStep} min={0} step="0.1" onChange={setSIRStep}/></div></>}
        {modelId==='logistic'&&<><Field label="Initial population" symbol="x₀" unit="units" value={logistic.initial} min={0} onChange={v=>setLogistic(x=>({...x,initial:v}))}/><Field label="Growth speed" symbol="r" unit="time⁻¹" value={logistic.growthRate} min={0} onChange={v=>setLogistic(x=>({...x,growthRate:v}))}/><Field label="Population limit" symbol="K" unit="units" value={logistic.capacity} min={0} onChange={v=>setLogistic(x=>({...x,capacity:v}))}/><div className="field-pair"><Field label="How long to run" unit="time" value={duration} min={0} onChange={setDuration}/><Field label="Time step" unit="time" value={step} min={0} step="0.05" onChange={setStep}/></div></>}
        <div className="input-provenance"><span className="status-dot illustrative"/> <span>Parameter values are illustrative unless individually marked with a source.</span></div>
        </aside>
        <section className="sim-center"><div className="chart-head"><div><span className="section-label">MODEL OUTPUT</span><h2>{modelId==='sir'?(diseaseLabel.trim()||'Disease spread example'):modelId==='antibiotic-bacteria'?(infectionLabel.trim()||'Bacteria example'):selected.name}</h2><p>{selected.question}</p></div>{(modelId.startsWith('pk')||modelId==='pd-emax')&&<button className="button small-outline" onClick={()=>setShowBaseline(v=>!v)}>{showBaseline?'Hide baseline':'Compare baseline'}</button>}</div>
          {activeTab==='Graph'&&result&&<><div className="player"><div className="player-buttons"><button aria-label={playing?'Pause':'Play'} onClick={()=>{if(playIndex>=result.time.length-1)setPlayIndex(0);setPlaying(v=>!v);}}>{playing?'Ⅱ':'▶'}</button><button aria-label="Reset playback" onClick={()=>{setPlaying(false);setPlayIndex(0);}}>↺</button><span>{playing?'Playing':'Paused'}</span></div><input type="range" min={0} max={Math.max(0,result.time.length-1)} value={Math.min(playIndex,result.time.length-1)} aria-label="Simulation timeline" onChange={e=>{setPlaying(false);setPlayIndex(Number(e.target.value));}}/><span className="time-readout">{result.time[Math.min(playIndex,result.time.length-1)].toFixed(2)} {result.timeUnit}</span></div><SimulationGraphs result={result} selected={Math.min(playIndex,result.time.length-1)}
            select={index=>{setPlaying(false);setPlayIndex(index)}} mode={responseMode} onModeChange={setResponseMode}
            modelId={modelId} pk={pk} treatmentDelay={antibiotic.treatmentDelay} sensitivity={[emax,ec50,e0,hill]}/></>}
          {activeTab==='Equation'&&<div className="tab-content"><h3>The equation behind this graph</h3><EquationNotes id={modelId} language={language}/></div>}
          {activeTab==='Inputs'&&<div className="tab-content"><h3>What the inputs mean</h3><div className="variable-table"><div className="variable-row variable-head"><span>Input</span><span>Example</span><span>Unit and allowed values</span><span>Value status</span></div>{selected.variables.map(v=><div className="variable-row" key={v.symbol}><span><b>{v.name} · {v.symbol}</b><small>{v.description}</small></span><span>{v.default}</span><span>{v.unit}<small>{v.range}</small></span><span><i className={`evidence-dot ${v.evidence}`}/>{v.evidence}<small>{v.identifiable===undefined?'Not assessed':v.identifiable?'Can be estimated with suitable data':'Cannot be separated from the current outputs'}</small></span></div>)}{selected.variables.length===0&&<p>Inputs can be changed in the panel on the left. Example values are for learning.</p>}<p className="small-copy">Values are examples unless a source is shown. They do not describe a particular person or a real disease outbreak.</p></div></div>}
          {activeTab==='Results'&&<div className="tab-content"><h3>What the model calculated</h3>{result&&<><div className="results-list">{result.metrics.map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div><p className="small-copy">{modelId==='antibiotic-bacteria'?'This model compares two example paths: one with the selected treatment start and one without treatment. Its values are illustrative, not measurements from a real medicine or infection.':'The error values show how closely the step-by-step calculations match the model\'s own reference. A close match checks the maths only; it does not show how closely the model matches real-world data.'}</p>{result.study.length>0&&<div className="table-scroll"><table className="study-table"><thead><tr><th>Step size</th><th>Euler difference</th><th>RK4 difference</th></tr></thead><tbody>{result.study.map((x,i)=>x?<tr key={x.step}><td>{x.step.toPrecision(4)} {result.timeUnit}</td><td>{x.euler.toExponential(3)}</td><td>{x.rk4.toExponential(3)}</td></tr>:<tr key={i}><td>h / {2**i}</td><td colSpan={2}>Smaller step would exceed the calculation limit</td></tr>)}</tbody></table></div>}</>}</div>}
          {activeTab==='Checks'&&result&&<div className="tab-content"><h3>Input and calculation checks</h3><div className="warning-list">{result?.warnings.length?result.warnings.map((w,i)=><div className="warning caution" key={i}><b>CHECK THIS</b><span>{w}</span><small>Try a smaller step size or adjust the values shown on the left.</small></div>):<div className="warning success"><b>LOOKS GOOD</b><span>The values are within the model's allowed range and the calculations returned finite results. {modelId==='sir'?'The population total is checked at every time point.':modelId==='antibiotic-bacteria'?'The example calculation passed its input and number checks.':'The step-by-step results are compared with the model reference.'}</span></div>}<div className="warning info"><b>ABOUT THESE RESULTS</b><span>These are examples from a simplified model. They are not a forecast for a real person or community.</span></div></div></div>}
          {!result&&<div className="error-box" role="alert">{calcError}</div>}
          <div className="sim-actions"><button className="button primary" onClick={downloadPdf} disabled={!result}>Download results PDF ↓</button><button className="button quiet" onClick={()=>setActiveTab('Checks')}>Check this run →</button></div>
        </section>
        <aside className="results-panel"><div className="results-title"><span className="section-label">AT A GLANCE</span><span className="validation-chip"><i/> {!result?'Check inputs':result.warnings.length?'Review':'Ready'}</span></div>{result?.metrics.slice(0,4).map(([k,v])=><div className="summary-metric" key={k}><span>{k}</span><b>{v}</b></div>)}<div className="assumption-box"><b>Model assumptions</b>{selected.assumptions.slice(0,4).map(a=><span key={a}>• {a}</span>)}</div>{(modelId.startsWith('pk')||modelId==='pd-emax')&&<button className="text-action" onClick={()=>{setBaselinePK({...pk});setShowBaseline(true);}}>Set current values as baseline ↗</button>}<button className="text-action" onClick={()=>setActiveTab('Checks')}>Review validation panel ↗</button></aside></div>
      </>}

      {page==='equations'&&<MathGuide language={language} openModel={openModel}/>}
      {(page==='research'||page==='about')&&<Research about={page==='about'}/>}
    </main>
    <footer className="nx-footer"><div><Logo/><span>Cluster Innovation Centre · University of Delhi</span></div><nav aria-label="Project links">{nav('about')}{nav('research')}<button onClick={()=>{setTourStep(0);setTourOpen(true)}}>Take a tour</button></nav></footer>
    {tourOpen&&<div className="tour-backdrop"><section className="tour-dialog" role="dialog" aria-modal="true" aria-labelledby="tour-title"><div className="tour-top"><span className="nx-kicker">Lab tour · {tourStep+1} of 3</span><button className="tour-close" aria-label="Close tour" onClick={finishTour}>×</button></div><div className="tour-progress"><i style={{width:((tourStep+1)/3*100)+'%'}}/></div><h2 id="tour-title">{['Follow the tablet','Read the tissue curve','Hold concentration still'][tourStep]}</h2><p>{['Open Body view and choose Place tablet, then Swallow with water. Follow the cutaways or select an organ to inspect it.','Select a rising point or the peak. Compare entry and return in mg/h to explain the slope.','Pause at a positive tissue concentration. Move EC50 and watch the response change. Save the selected results as a PDF.'][tourStep]}</p><div className="tour-actions"><button className="tour-skip" onClick={finishTour}>Skip tour</button><button className="nx-button" onClick={()=>{if(tourStep<2)setTourStep(tourStep+1);else{finishTour();window.location.hash='body'}}}>{tourStep===2?'Follow a tablet':'Next'}<Icon name="arrow" size={15}/></button></div></section></div>}
  </div>;
};

export default App;
