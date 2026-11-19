import React, { useEffect, useMemo, useState } from 'react';
import katex from 'katex';
import Anatomy, { type Organ } from './Anatomy';
import TissueEffect from './TissueEffect';
import TissuePlot from './TissuePlot';
import { classDemoParams, DistributionParams, distributionDefaults, massTolerance, sampleDistribution,
  solveDistribution, tissuePeak, tissueRates, tissueResponse, tissueVolume } from './engine/distribution';
import { biologicalStops, displayElapsed, journeyAt, JourneyStage, playbackEnd, positionForModelTime } from './engine/journey';
import { createSimulationPdf, distributionReportEquations } from './engine/report';
import './body-lab.css';

const chapters: Record<JourneyStage, { title: string; organ: Organ; en: string; hi: string }> = {
  ready: { title: 'Before the first sip', organ: 'whole',
    en: 'Imagine a headache. Our guide follows an immediate-release paracetamol tablet from the mouth into the body.',
    hi: 'Sochiye sir dard ho raha hai. Hum immediate-release paracetamol ki ek tablet ka safar muh se sharir tak dekhenge.' },
  placed: { title: 'Tablet on the tongue', organ: 'mouth',
    en: 'The tablet is on the tongue. Take a sip and follow it into the food passage.',
    hi: 'Tablet jeebh par hai. Paani ke ghoont ke saath dekhiye yeh khaane ki nali mein kaise jaati hai.' },
  swallow: { title: 'Down the oesophagus', organ: 'mouth',
    en: 'A sip carries the tablet to the throat. A wave of muscle contraction moves it down the food passage. Air travels through the neighbouring windpipe.',
    hi: 'Paani tablet ko gale tak laata hai. Muscles ki lehar use khaane ki nali se neeche le jaati hai. Saath waali saans ki nali se hawa jaati hai.' },
  stomach: { title: 'From fragments to solution', organ: 'stomach',
    en: 'The tablet breaks into solid fragments. Drug molecules leave the fragments and dissolve in the stomach fluid. These are two different steps.',
    hi: 'Tablet pehle thos tukdon mein tootti hai. Phir dawa ke molecules tukdon se nikal kar pet ke fluid mein ghulte hain.' },
  intestine: { title: 'Across the intestinal lining', organ: 'intestine',
    en: 'Follow dissolved drug across the lining of a villus into a capillary. This crossing is absorption. The generic model starts with all its input at the absorption site.',
    hi: 'Ghuli dawa villus ki parat paar karke ek capillary mein jaati hai. Isi ko absorption kehte hain. Model mein shuru ki poori matra absorption site par hai.' },
  liver: { title: 'Through the portal vein', organ: 'liver',
    en: 'Blood from the intestine follows the portal vein to the liver. Drug leaving the liver reaches the wider circulation. The model combines blood in a single central compartment.',
    hi: 'Aant se khoon portal vein ke zariye liver tak jaata hai. Liver se nikal kar dawa systemic circulation mein pahunchti hai. Model khoon ko ek compartment maanta hai.' },
  tissue: { title: 'Into tissue and back', organ: 'tissue',
    en: 'Drug can enter tissue from circulation and return to the blood. Paracetamol can ease a headache. One proposed action is to reduce pain signalling in the central nervous system. Here the percentage measures the generic model’s response.',
    hi: 'Dawa khoon se tissue mein jaa sakti hai aur wapas aa sakti hai. Paracetamol sir dard mein rahat de sakta hai. Ek sambhaavit asar dimaag aur spinal cord mein pain signals ko kam karna hai. Yahan percentage generic model ka response hai.' },
  removal: { title: 'Where the medicine goes', organ: 'removal',
    en: 'The liver metabolises paracetamol. Its products leave mainly in urine. In the generic model, the removed amount accumulates as drug leaves circulation.',
    hi: 'Liver paracetamol ko metabolise karta hai. Iske products zyaadatar urine se nikalte hain. Generic model mein circulation se nikalti dawa removed amount mein judti hai.' },
};

const parameterFields = [
  ['dose', 'Starting amount', 'mg', 10000], ['ka', 'Absorption', 'h⁻¹', 5],
  ['k12', 'Transfer into tissue', 'h⁻¹', 5], ['k21', 'Return to circulation', 'h⁻¹', 5],
  ['ke', 'Removal', 'h⁻¹', 5], ['duration', 'Simulation duration', 'h', 168],
] as const;

const explanations = [
  [String.raw`\frac{dA_g}{dt}=-k_a A_g`, 'Drug leaves the absorption site at a rate proportional to the amount left.', 'Absorption site par jitni dawa bachi hai, usi ke hisaab se woh bahar jaati hai.'],
  [String.raw`\frac{dA_c}{dt}=k_a A_g-k_{ct} A_c+k_{tc} A_t-k_e A_c`, 'Circulation gains absorbed and returning drug, and loses drug to tissue and removal.', 'Circulation mein absorbed aur lautti dawa judti hai. Tissue transfer aur removal se matra kam hoti hai.'],
  [String.raw`\frac{dA_t}{dt}=k_{ct} A_c-k_{tc} A_t`, 'Tissue gains drug when entry exceeds return. At a smooth interior peak, the two rates balance.', 'Jab entry rate return se zyaada ho, tissue ki matra badhti hai. Smooth interior peak par rates barabar hote hain.'],
  [String.raw`\frac{dA_r}{dt}=k_e A_c`, 'Cumulative removal grows as drug leaves the central compartment.', 'Circulation se dawa nikalti hai to removed amount badhta hai.'],
  [String.raw`C_t=\frac{A_t}{V_t},\quad V_t=10\,\mathrm{L}`, 'Divide the tissue amount in milligrams by 10 litres to obtain mg/L.', 'Tissue ki matra ko 10 litre se divide karne par concentration mg/L mein milti hai.'],
  [String.raw`E=100\,\frac{C_t}{EC_{50}+C_t}\,\%`, 'At a fixed concentration, a larger EC₅₀ gives a smaller response. E is a percentage of the model maximum.', 'Concentration ek jaisi rahe to bada EC₅₀ chhota response deta hai. E model ke maximum ka percentage hai.'],
].map(([tex, en, hi]) => ({ html: katex.renderToString(tex, { displayMode: true, throwOnError: false }), en, hi }));

function Parameters({ params, onApply, onReset }: {
  params: DistributionParams; onApply: (next: DistributionParams) => void; onReset: () => void;
}) {
  return <form className="lab-parameters" onSubmit={e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = { ...params };
    for (const [key] of parameterFields) next[key] = Number(data.get(key));
    onApply(next);
  }}>
    {parameterFields.map(([key, label, unit, max]) => <label key={key}><span>{label}</span>
      <span className="lab-unit-input"><input required name={key} type="number" min="0" max={max} step="any" defaultValue={params[key]}/><small>{unit}</small></span>
    </label>)}
    <div className="lab-form-actions"><button className="lab-button solid">Apply and restart</button><button type="button" className="lab-button" onClick={onReset}>Restore preset</button></div>
  </form>;
}

export default function Distribution({ demo = false, language = 'en' }: { demo?: boolean; language?: 'en' | 'hi' }) {
  const [params, setParams] = useState(demo ? classDemoParams : distributionDefaults);
  const [formVersion, setFormVersion] = useState(0);
  const [ec50, setEc50] = useState(2);
  const [position, setPosition] = useState(-2);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [pinnedOrgan, setPinnedOrgan] = useState<Organ | null>(null);
  const [error, setError] = useState('');
  const hi = language === 'hi';
  const rows = useMemo(() => solveDistribution(params), [params]);
  const peak = useMemo(() => tissuePeak(rows, params), [rows, params]);
  const stops = useMemo(() => biologicalStops(params.duration, peak), [params.duration, peak]);
  const { stage, progress, elapsed, modelHours } = journeyAt(position, stops);
  const row = sampleDistribution(rows, modelHours);
  const { entry, back, net } = tissueRates(row, params);
  const { concentration, response } = tissueResponse(row.tissue, ec50);
  const chapter = chapters[stage];
  const organ = pinnedOrgan ?? chapter.organ;
  const end = position >= playbackEnd;
  const isFlat = !params.ka || !params.k12;
  const balanced = Math.abs(net) <= Math.max(entry, back, Number.MIN_VALUE) * 1e-7;
  const flatAtEnd = Math.abs(tissueRates(rows[rows.length - 1], params).net) <= Number.EPSILON * params.dose;
  const massError = useMemo(() => rows.reduce((max, r) => Math.max(max, Math.abs(r.gut + r.central + r.tissue + r.removed - params.dose)), 0), [rows, params]);
  const seek = (next: number) => {
    setPlaying(false); setPinnedOrgan(null); setPosition(next);
  };
  const selectTime = (time: number) => seek(positionForModelTime(time, stops));
  useEffect(() => {
    if (!playing || end) return;
    let last = performance.now();
    const tick = window.setInterval(() => {
      const now = performance.now(), delta = (now - last) / 1000;
      last = now;
      setPosition(t => Math.min(playbackEnd, t + delta * speed));
    }, 70);
    return () => window.clearInterval(tick);
  }, [playing, speed, end]);
  useEffect(() => { if (end) setPlaying(false); }, [end]);
  const play = () => {
    setPinnedOrgan(null);
    if (stage === 'ready') { setPosition(-1); return; }
    if (stage === 'placed' || end) setPosition(0);
    setPlaying(!playing);
  };
  const apply = (next: DistributionParams, reset = false) => {
    try {
      solveDistribution(next);
      setParams(next); seek(-2); setError('');
      if (reset) { setEc50(2); setSpeed(1); }
      setFormVersion(v => v + 1);
    } catch (e) { setError((e as Error).message); }
  };
  const save = () => {
    try {
      const bytes = createSimulationPdf({
        title: 'Nexus | Follow a tablet', model: 'Generic four-amount oral PK-PD model',
        timestamp: new Date().toLocaleString(), selectedTime: row.time,
        graphTitle: 'Tissue concentration', secondaryGraphTitle: 'Predicted response',
        timeLabel: 'Time since absorption began (h)', valueLabel: 'Tissue concentration (mg/L)',
        secondaryValueLabel: 'Response (% of maximum)',
        time: rows.map(r => r.time),
        series: [{ label: 'Tissue concentration', values: rows.map(r => r.tissue / tissueVolume), color: '#136759' }],
        secondarySeries: [{ label: 'Predicted response', values: rows.map(r => tissueResponse(r.tissue, ec50).response), color: '#9a652b' }],
        parameters: [...parameterFields.map(([key, label, unit]): [string, string] => [label, params[key] + ' ' + unit]),
          ['Tissue volume', '10 L'], ['EC50', ec50 + ' mg/L']],
        metrics: [['Selected model time', row.time.toFixed(3) + ' h'], ['Tissue amount', row.tissue.toFixed(3) + ' mg'],
          ['Tissue concentration', concentration.toFixed(3) + ' mg/L'], ['Model response', response.toFixed(1) + '% of maximum'],
          ['Entry rate', entry.toFixed(3) + ' mg/h'], ['Return rate', back.toFixed(3) + ' mg/h'],
          ['Net tissue rate', net.toFixed(3) + ' mg/h'], ['Max mass error', massError.toExponential(2) + ' mg']],
        equations: distributionReportEquations,
        disclaimer: 'Generic educational PK-PD model. Individual pain relief, recovery and dose requirements cannot be predicted.',
      });
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' }));
      const link = document.createElement('a'); link.href = url; link.download = 'Nexus_Tablet_Results.pdf';
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setError('');
    } catch { setError('The PDF could not be created. Please try again.'); }
  };
  const action = stage === 'ready' ? 'Place tablet' : stage === 'placed' ? 'Swallow with water' : playing ? 'Pause' : end ? 'Play again' : 'Play';
  const slopeText = row.time === 0
    ? (hi ? 'Shuru mein circulation aur tissue ki matra zero hai. Abhi dono rates zero hain.' : 'At the model start, circulation and tissue are empty. Both rates are zero.')
    : balanced
      ? (hi ? 'Entry aur return barabar hain. Is waqt tissue curve ka slope lagbhag zero hai.' : 'Entry and return balance. At this instant, the slope of the tissue curve is approximately zero.')
      : net > 0
        ? (hi ? 'Entry return se zyaada hai. Isliye tissue concentration badh rahi hai.' : 'Medicine enters tissue faster than it returns to circulation, so the tissue curve is rising.')
        : (hi ? 'Return entry se zyaada hai. Isliye tissue concentration gir rahi hai.' : 'Medicine returns to circulation faster than it enters tissue, so the tissue curve is falling.');
  return <div className="tablet-lab">
    <header className="lab-heading"><div><span className="lab-kicker">BODY VIEW</span><h1>{demo ? 'Class demo' : 'Follow a tablet'}</h1>
      <p>{demo ? 'A two-minute investigation of the tissue peak and target sensitivity.' : 'Follow an oral tablet, then use the tissue curve to explain what happens.'}</p></div>
      <button className="lab-button lab-export" onClick={save}>Download results PDF <span aria-hidden="true">↓</span></button>
    </header>
    {demo && <details className="lab-script"><summary>Two-minute presentation script</summary>
      <ol><li><b>0:00–0:35</b> Place the tablet, swallow with water and follow absorption, portal transit and tissue exchange.</li>
        <li><b>0:35–1:00</b> Choose Rising point. Compare entry and return in mg/h.</li>
        <li><b>1:00–1:25</b> Choose Approximate peak. The two rates balance and the slope is near zero.</li>
        <li><b>1:25–2:00</b> Keep time still. Raise EC₅₀ from 2 to 4 mg/L and compare the two live readings. Use the worked example below for the 50% to 33.3% calculation.</li></ol>
    </details>}
    <div className="lab-grid">
      <section className="lab-card lab-journey" aria-label="Guided tablet journey">
        <div className="lab-card-head"><h2>Tablet journey</h2><span className="lab-stage-time" aria-label="Elapsed biological time">{displayElapsed(elapsed)}</span></div>
        <div className="lab-player"><button className="lab-button solid" onClick={play}><span aria-hidden="true">{playing ? 'Ⅱ' : stage === 'ready' ? '+' : '▶'}</span>{action}</button>
          <button className="lab-button" onClick={() => seek(-2)} disabled={stage === 'ready'}>↺ Replay</button>
          <label>Speed <select aria-label="Speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div>
        <div className="lab-anatomy"><Anatomy organ={organ} stage={stage} progress={progress} language={language}
          fractions={{ gut: row.gut / params.dose, central: row.central / params.dose, tissue: row.tissue / params.dose, removed: row.removed / params.dose }}
          onSelect={o => { setPinnedOrgan(o); setPlaying(false); }}/></div>
        <div className="lab-timeline"><div><label htmlFor="lab-time">Elapsed since swallowing</label><strong>{displayElapsed(elapsed)}</strong></div>
          <input id="lab-time" aria-label="Body simulation time" aria-valuetext={displayElapsed(elapsed)} type="range" min="0" max={playbackEnd}
            step=".01" value={Math.max(0, position)} onChange={e => seek(Number(e.target.value))}/>
          <div className="lab-time-ends"><span>Swallow · seconds</span><span>Model run · {params.duration} h</span></div></div>
        <div className="lab-caption"><h3>{chapter.title}</h3><p>{hi ? chapter.hi : chapter.en}</p></div>
        <p className="lab-fine">{hi ? 'Swallowing, dissolution aur portal transit illustrative hain. Pehle 5 simulated minute ke baad absorption model shuru hota hai.' : 'Swallowing, dissolution and portal transit are illustrative. The absorption model starts after the first five simulated minutes.'}</p>
      </section>
      <section className="lab-card lab-kinetics" aria-label="Generic educational model">
        <div className="lab-card-head"><h2>Tissue kinetics</h2><span className="lab-model-tag">Generic model</span></div>
        <p className="lab-instruction">Select a point on the graph to inspect the flow into and out of tissue.</p>
        <TissuePlot rows={rows} row={row} ec50={ec50} onSelect={selectTime}/>
        <div className="lab-point-buttons"><button className="lab-chip" disabled={isFlat} onClick={() => selectTime((peak ?? params.duration) * .45)}>Rising point</button>
          <button className="lab-chip" onClick={() => selectTime(peak ?? params.duration)}>{peak === null ? 'Run endpoint' : 'Approximate peak'}</button>
          <span>t = <b>{row.time.toFixed(3)} h</b></span></div>
        {peak === null && <p className="lab-fine">{isFlat ? 'Tissue stays at zero in this run.' : flatAtEnd ? 'The curve levels off by the run endpoint. No interior peak was resolved.' : 'The run ends while tissue is still rising. No interior peak was reached.'}</p>}
        <div className="lab-rates">{([['Entry', entry], ['Return', back], ['Net', net]] as const).map(([label, val]) =>
          <div key={label}><span>{label} rate</span><b>{Math.abs(val) < .0005 ? '0.000' : val.toFixed(3)} <small>mg/h</small></b></div>)}</div>
        <p className="lab-slope">{slopeText}</p>
        <TissueEffect amount={row.tissue} ec50={ec50} onChange={setEc50} hinglish={hi}/>
      </section>
    </div>
    <section className="lab-card lab-balance"><div><h2>Where is the starting amount?</h2><p>All four amounts at the selected model time.</p></div>
      <div className="lab-compartments">{([['Absorption site', row.gut], ['Circulation', row.central], ['Tissue', row.tissue], ['Cumulative removal', row.removed]] as const).map(([label, amount]) =>
        <div key={label}><span>{label}</span><b>{amount.toFixed(2)} <small>mg</small></b><progress value={amount / params.dose} max={1} aria-label={label + ' fraction of starting amount'}/></div>)}</div>
      <p className="lab-fine">Sum {(row.gut + row.central + row.tissue + row.removed).toFixed(2)} mg of {params.dose} mg. Maximum run error {massError.toExponential(1)} mg. Tolerance {massTolerance(params.dose).toExponential(1)} mg.</p>
    </section>
    <div className="lab-lower">
      <section className="lab-card"><h2>Model parameters</h2><p className="lab-instruction">One generic oral input. Each rate is a fraction per hour.</p>
        <Parameters key={formVersion} params={params} onApply={apply} onReset={() => apply(demo ? classDemoParams : distributionDefaults, true)}/></section>
      <section className="lab-card lab-worked"><span className="lab-kicker">WORKED EXAMPLE</span><h2>One concentration, two responses</h2>
        <p>{hi ? 'Maan lijiye 10 L tissue mein 20 mg dawa hai. Concentration 2 mg/L banti hai.' : 'Suppose 10 L of tissue contains 20 mg. Its concentration is 2 mg/L.'}</p>
        <dl><div><dt>EC₅₀ = 2 mg/L</dt><dd>100 × 2 / (2 + 2) = <b>50%</b></dd></div><div><dt>EC₅₀ = 4 mg/L</dt><dd>100 × 2 / (4 + 2) ≈ <b>33.3%</b></dd></div></dl>
        <p className="lab-fine">{hi ? 'Yeh worked-example values hain. Live readings upar hain. Model kisi vyakti ki pain relief, dose ya recovery predict nahi kar sakta.' : 'These percentages belong to the worked example. The live readings are above. The model cannot predict a person’s pain relief, dose requirements or recovery.'}</p></section>
    </div>
    <details className="lab-card lab-equations"><summary>Equations and assumptions</summary>
      <p>{hi ? 'Matra mg mein hai, samay hours mein aur transfer rates h⁻¹ mein. Sab compartments well-mixed hain. Shuru mein saari dawa absorption site par hai.' : 'Amounts are in mg, time in hours and transfer constants in h⁻¹. The compartments are well mixed. At model time zero, the whole input is at the absorption site. All absorbed drug reaches circulation.'}</p>
      {explanations.map((e, i) => <div key={i} className="lab-eq"><div className="lab-math" dangerouslySetInnerHTML={{ __html: e.html }}/><p>{hi ? e.hi : e.en}</p></div>)}
      <p>RK4 steps are at most 0.01 h. Each stored state is checked for non-negative amounts and mass error below 10⁻¹⁰ × max(1, starting amount in mg) mg. Between stored states the display interpolates linearly.</p>
    </details>
    {error && <p role="alert" className="lab-error">{error}</p>}
  </div>;
}
