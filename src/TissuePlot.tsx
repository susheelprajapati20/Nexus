import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DistributionRow, tissueResponse, tissueVolume } from './engine/distribution';

type PlotMode = 'Tissue' | 'Amounts' | 'Response';
type Curve = { label: string; color: string; dash?: string; values: number[]; selected: number };

export default function TissuePlot({ rows, row, ec50, onSelect }: {
  rows: DistributionRow[]; row: DistributionRow; ec50: number; onSelect: (time: number) => void;
}) {
  const [mode, setMode] = useState<PlotMode>('Tissue');
  const [width, setWidth] = useState(520);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const measure = () => setWidth(Math.max(230, node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const isTissue = mode === 'Tissue', isResponse = mode === 'Response';
  const axis = isTissue ? 'Tissue concentration (mg/L)' : isResponse ? 'Response (% of maximum)' : 'Drug amount (mg)';
  const duration = rows[rows.length - 1].time;
  const curves = useMemo<Omit<Curve, 'selected'>[]>(() => {
    if (isTissue) return [{ label: 'Tissue concentration', color: '#136759', values: rows.map(r => r.tissue / tissueVolume) }];
    if (isResponse) return [{ label: 'Modelled response', color: '#875322', values: rows.map(r => tissueResponse(r.tissue, ec50).response) }];
    return [
      { label: 'Absorption site', color: '#704d84', dash: '6 4', values: rows.map(r => r.gut) },
      { label: 'Circulation', color: '#32728d', dash: '2 3', values: rows.map(r => r.central) },
      { label: 'Tissue', color: '#136759', values: rows.map(r => r.tissue) },
      { label: 'Removed', color: '#a75c32', dash: '9 3 2 3', values: rows.map(r => r.removed) },
    ];
  }, [rows, mode, isTissue, isResponse, isResponse ? ec50 : 0]);
  const selected = isTissue ? [row.tissue / tissueVolume] : isResponse ?
    [tissueResponse(row.tissue, ec50).response] : [row.gut, row.central, row.tissue, row.removed];
  const max = useMemo(() => {
    if (isResponse) return 100;
    const peak = Math.max(...curves.map(c => Math.max(...c.values)));
    if (peak <= 0) return 1;
    const place = 10 ** Math.floor(Math.log10(peak));
    return Math.ceil(peak / place * 2) * place / 2;
  }, [curves, isResponse]);
  const left = 45, right = width - 13, top = 14, bottom = 158;
  const x = (t: number) => left + (right - left) * t / duration;
  const y = (value: number) => bottom - (bottom - top) * value / max;
  const paths = useMemo(() => curves.map(curve => curve.values.map((value, i) =>
    (i ? 'L' : 'M') + x(rows[i].time).toFixed(2) + ' ' + y(value).toFixed(2)).join(' ')),
    [curves, rows, width, duration, max]);
  const num = (n: number) => Number(n.toPrecision(3)).toString();
  const tickCount = width < 360 ? 3 : 4;
  const pointerSelect = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const chartX = (event.clientX - rect.left) / rect.width * width;
    onSelect(Math.max(0, Math.min(duration, (chartX - left) / (right - left) * duration)));
  };
  return <div className="lab-plot">
    <div className="lab-plot-modes" role="group" aria-label="Graph quantity">{(['Tissue', 'Amounts', 'Response'] as const).map(m =>
      <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}</div>
    <div className="lab-axis-caption">{axis}</div>
    <div ref={container}><svg viewBox={'0 0 ' + width + ' 202'} aria-label={axis + ' over time. Select a time on the graph.'}
      role="slider" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={Number(row.time.toFixed(4))}
      aria-valuetext={row.time.toFixed(3) + ' hours'} tabIndex={0}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); pointerSelect(e); }}
      onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) pointerSelect(e); }}
      onKeyDown={e => {
        let t = row.time;
        if (e.key === 'Home') t = 0;
        else if (e.key === 'End') t = duration;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t += duration / 150;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t -= duration / 150;
        else return;
        e.preventDefault(); onSelect(Math.min(duration, Math.max(0, t)));
      }}>
      {[0, 1, 2, 3, 4].map(i => <g key={i}>
        <line x1={left} x2={right} y1={y(max * i / 4)} y2={y(max * i / 4)} stroke="#d8e3de" strokeDasharray={i ? '3 4' : undefined}/>
        <text x={left - 7} y={y(max * i / 4) + 4} textAnchor="end">{num(max * i / 4)}</text>
      </g>)}
      {Array.from({ length: tickCount + 1 }, (_, i) => <text key={i} x={x(duration * i / tickCount)} y={bottom + 17} textAnchor="middle">{num(duration * i / tickCount)}</text>)}
      <text x={(left + right) / 2} y={197} textAnchor="middle">Time since absorption began (h)</text>
      {curves.length === 1 && <path d={paths[0] + ' L' + right + ' ' + bottom + ' L' + left + ' ' + bottom + 'Z'} fill={curves[0].color} opacity=".07"/>}
      {curves.map((c, i) => <path key={c.label} d={paths[i]} fill="none" stroke={c.color} strokeWidth="2.8" strokeDasharray={c.dash}/>)}
      <line x1={x(row.time)} x2={x(row.time)} y1={top} y2={bottom} stroke="#526768" strokeDasharray="3 3"/>
      {curves.map((c, i) => <circle key={c.label} cx={x(row.time)} cy={y(selected[i])} r="4.2" fill={c.color} stroke="white" strokeWidth="1.5"/>)}
    </svg></div>
    <div className="lab-plot-legend">{curves.map(c => <span key={c.label}><svg aria-hidden="true" width="23" height="10"><path d="M1 5h21" fill="none" stroke={c.color} strokeWidth="2.8" strokeDasharray={c.dash}/></svg>{c.label}</span>)}<span><i/>Selected time</span></div>
  </div>;
}
