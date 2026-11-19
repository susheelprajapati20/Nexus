import React from 'react';
import { tissueResponse } from './engine/distribution';

export default function TissueEffect({ amount, ec50, onChange, hinglish }: {
  amount: number; ec50: number; onChange: (value: number) => void; hinglish: boolean;
}) {
  const { concentration, response } = tissueResponse(amount, ec50);
  return <section className="lab-sensitivity" aria-label="Tissue response and sensitivity">
    <h3>Target sensitivity</h3>
    <div className="lab-response-pair">
      <div><span>Tissue concentration</span><strong data-testid="tissue-concentration">{concentration.toFixed(3)} <small>mg/L</small></strong></div>
      <div><span>Predicted response</span><strong data-testid="tissue-response">{response.toFixed(1)}<small>% of maximum</small></strong></div>
    </div>
    <label htmlFor="lab-ec50"><b>EC₅₀</b><output htmlFor="lab-ec50">{ec50.toFixed(2)} mg/L</output></label>
    <input id="lab-ec50" type="range" min=".25" max="8" step=".25" value={ec50}
      aria-label="EC50 sensitivity" aria-describedby="lab-ec50-description"
      aria-valuetext={ec50 + ' milligrams per litre'} onChange={e => onChange(Number(e.target.value))}/>
    <p id="lab-ec50-description">EC₅₀ is the concentration needed for half the maximum modelled effect.</p>
    {hinglish && <p>EC₅₀ woh concentration hai jahaan model ka effect aadha hota hai.</p>}
  </section>;
}
