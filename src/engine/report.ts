export interface ReportSeries { label: string; values: number[]; color: string; }
export interface SimulationReport {
  title: string; model: string; timestamp: string; timeLabel: string; valueLabel: string;
  parameters: Array<[string, string | number]>; metrics: Array<[string, string | number]>;
  time: number[]; series: ReportSeries[]; secondarySeries?: ReportSeries[]; secondaryValueLabel?: string; disclaimer: string;
}

const ascii = (value: string) => value.normalize('NFKD').replace(/[β]/g, 'beta').replace(/[γ]/g, 'gamma').replace(/[Δ]/g, 'Delta').replace(/[₀]/g, '0').replace(/[₁]/g, '1').replace(/[₂]/g, '2').replace(/[ₑ]/g, 'e').replace(/[ₐ]/g, 'a').replace(/[₅]/g, '5').replace(/[⁻]/g, '-').replace(/[¹]/g, '1').replace(/[²]/g, '2').replace(/[–—−]/g, '-').replace(/[·×]/g, 'x').replace(/[√]/g, 'sqrt').replace(/[^\x20-\x7E]/g, '');
const escapePdf = (value: string) => ascii(value).replace(/([\\()])/g, '\\$1');
const text = (x: number, y: number, size: number, value: string, color = '0.12 0.20 0.30') => `BT /F1 ${size} Tf ${color} rg ${x} ${y} Td (${escapePdf(value)}) Tj ET\n`;
const line = (x1: number, y1: number, x2: number, y2: number, color = '0.82 0.86 0.91', width = 1) => `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`;

/** A single-page PDF containing only the current simulation settings, outputs and graph. */
export function createSimulationPdf(report: SimulationReport): Uint8Array {
  let page = 'q\n0.20 0.39 0.78 rg 0 775 612 17 re f\nQ\n';
  page += text(48, 744, 20, report.title, '0.10 0.20 0.34');
  page += text(48, 721, 11, report.model, '0.19 0.40 0.72');
  page += text(440, 721, 8, report.timestamp, '0.44 0.51 0.59');
  page += line(48, 705, 564, 705);
  page += text(48, 686, 10, 'INPUTS', '0.13 0.34 0.59');
  page += text(318, 686, 10, 'RESULTS', '0.13 0.34 0.59');
  let inputY = 666;
  for (const [label, value] of report.parameters) {
    if (inputY < 508) break;
    page += text(48, inputY, 9, label, '0.38 0.45 0.53') + text(177, inputY, 9, String(value), '0.13 0.22 0.34');
    inputY -= 18;
  }
  let resultY = 666;
  for (const [label, value] of report.metrics) {
    if (resultY < 508) break;
    page += text(318, resultY, 9, label, '0.38 0.45 0.53') + text(430, resultY, 9, String(value), '0.13 0.22 0.34');
    resultY -= 25;
  }
  page += line(48, 490, 564, 490);
  const maxX = Math.max(1e-12, report.time.reduce((max, value) => Math.max(max, value), -Infinity));
  const drawPlot = (series: ReportSeries[], y0: number, h: number, legendY: number) => {
    let plot = '';
    const x0 = 76, w = 466;
    const values = series.flatMap(s => s.values).filter(Number.isFinite);
    const maxY = Math.max(1e-12, values.reduce((max, value) => Math.max(max, value), -Infinity));
    const minY = Math.min(0, values.reduce((min, value) => Math.min(min, value), Infinity));
    const spanY = Math.max(1e-12, maxY - minY);
    plot += line(x0, y0, x0 + w, y0, '0.49 0.57 0.65') + line(x0, y0, x0, y0 + h, '0.49 0.57 0.65');
    plot += text(x0, y0 - 13, 7, '0') + text(x0 + w - 20, y0 - 13, 7, maxX.toPrecision(3));
    plot += text(x0 - 38, y0 + h - 3, 7, maxY.toPrecision(3)) + text(x0 - 38, y0 - 3, 7, minY.toPrecision(3));
    for (const s of series) {
      const points = Math.min(s.values.length, report.time.length); if (points < 2) continue;
      const stride = Math.max(1, Math.ceil(points / 1000));
      const rgb = s.color.replace('#', '').match(/.{2}/g)?.map(v => (parseInt(v, 16) / 255).toFixed(3)).join(' ') ?? '0.20 0.39 0.78';
      plot += `${rgb} RG 1.7 w `; let first = true;
      for (let i = 0; i < points; i += stride) { const x = x0 + report.time[i] / maxX * w, y = y0 + (s.values[i] - minY) / spanY * h; plot += `${x.toFixed(2)} ${y.toFixed(2)} ${first ? 'm' : 'l'} `; first = false; }
      if ((points - 1) % stride !== 0) { const i = points - 1, x = x0 + report.time[i] / maxX * w, y = y0 + (s.values[i] - minY) / spanY * h; plot += `${x.toFixed(2)} ${y.toFixed(2)} l `; }
      plot += 'S\n';
    }
    let legendX = 78;
    for (const s of series) { const rgb = s.color.replace('#', '').match(/.{2}/g)?.map(v => (parseInt(v, 16) / 255).toFixed(3)).join(' ') ?? '0.20 0.39 0.78'; plot += line(legendX, legendY, legendX + 18, legendY, rgb, 2) + text(legendX + 24, legendY - 3, 7, s.label, '0.38 0.45 0.53'); legendX += Math.min(165, 42 + s.label.length * 4); }
    return plot;
  };
  if (report.secondarySeries?.length) {
    page += text(48, 470, 10, 'BACTERIA OVER TIME', '0.13 0.34 0.59') + text(48, 451, 8, `Horizontal: ${report.timeLabel}  |  Vertical: ${report.valueLabel}`, '0.44 0.51 0.59');
    page += drawPlot(report.series, 326, 105, 312);
    page += text(48, 284, 10, 'EXAMPLE DRUG LEVEL', '0.13 0.34 0.59') + text(48, 267, 8, `Horizontal: ${report.timeLabel}  |  Vertical: ${report.secondaryValueLabel ?? 'level units'}`, '0.44 0.51 0.59');
    page += drawPlot(report.secondarySeries, 135, 105, 121);
  } else {
    page += text(48, 470, 10, 'SIMULATION GRAPH', '0.13 0.34 0.59') + text(48, 451, 8, `Horizontal: ${report.timeLabel}  |  Vertical: ${report.valueLabel}`, '0.44 0.51 0.59');
    page += drawPlot(report.series, 165, 260, 140);
  }
  page += line(48, 62, 564, 62);
  page += text(48, 45, 7, report.disclaimer, '0.48 0.54 0.61');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [4 0 R] /Count 1 >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>`,
    `<< /Length ${new TextEncoder().encode(page).length} >>\nstream\n${page}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((body, i) => { offsets.push(new TextEncoder().encode(pdf).length); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = new TextEncoder().encode(pdf).length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
