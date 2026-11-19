import { printEquations } from './reportEquations';
export { distributionReportEquations } from './reportEquations';

export interface ReportSeries { label: string; values: number[]; color: string; dash?: number[] }
type Field = [string, string | number];
export interface SimulationReport {
  title: string;
  model: string;
  timestamp: string;
  timeLabel: string;
  valueLabel: string;
  parameters: Field[];
  metrics: Field[];
  time: number[];
  series: ReportSeries[];
  secondarySeries?: ReportSeries[];
  secondaryValueLabel?: string;
  graphTitle?: string;
  secondaryGraphTitle?: string;
  selectedTime?: number;
  equations?: string[];
  disclaimer: string;
}

const ink = '0.059 0.165 0.169';
const teal = '0.035 0.384 0.353';
const muted = '0.245 0.337 0.337';
const rule = '0.80 0.85 0.83';
const paper = '0.968 0.976 0.957';
const team = 'Susheel Prajapati, Suraj Prajapati, Prashil Verma and Nikhil Sharma';
const widths = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const italicWidths = [250,333,420,500,500,833,778,214,333,333,500,675,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,675,675,675,500,920,611,611,667,722,611,611,722,722,333,444,667,556,833,667,722,611,722,611,500,556,722,611,833,611,556,556,389,278,389,422,500,333,500,500,444,500,444,278,500,500,278,278,444,278,722,500,500,500,500,389,389,278,500,444,667,444,444,389,400,275,400,541];

function ascii(value: string) {
  return value.replace(/β/g,'beta').replace(/γ/g,'gamma').replace(/Δ/g,'Delta')
    .replace(/⁻¹/g,'^-1').replace(/[–—−]/g,'-').replace(/·/g,' / ').replace(/×/g,'x')
    .replace(/[’‘]/g,"'").replace(/≈/g,'~').replace(/≤/g,'<=').replace(/≥/g,'>=')
    .normalize('NFKD').replace(/[^\x20-\x7E]/g, '');
}
function measure(value: string, size: number, italic = false) {
  const metrics = italic ? italicWidths : widths;
  return [...ascii(value)].reduce((sum, c) => sum + (metrics[c.charCodeAt(0)-32] ?? 556), 0) * size / 1000;
}
const pos = (v: number) => Number(v.toFixed(3));
const esc = (v: string) => ascii(v).replace(/([\\()])/g,'\\$1');
function label(x: number, y: number, size: number, value: string, color = ink, font = 'F1') {
  return `BT /${font} ${pos(size)} Tf ${color} rg ${pos(x)} ${pos(y)} Td (${esc(value)}) Tj ET\n`;
}
function line(x1:number, y1:number, x2:number, y2:number, color=rule, width=.75, dash='') {
  return `[${dash}] 0 d ${color} RG ${width} w ${pos(x1)} ${pos(y1)} m ${pos(x2)} ${pos(y2)} l S\n`;
}
function wrap(value:string, size:number, maxWidth:number) {
  const lines: string[] = [];
  let row = '';
  for (const word of ascii(value).split(/\s+/)) {
    if (row && measure(row+' '+word,size)>maxWidth) { lines.push(row); row=''; }
    if (measure(word,size)>maxWidth) {
      for (const c of word) {
        if (row && measure(row+c,size)>maxWidth) { lines.push(row); row=''; }
        row+=c;
      }
    } else row += (row?' ':'') + word;
  }
  lines.push(row);
  return lines;
}
function header(heading:string, context:string) {
  // Draw the same capsule, rotation and cutout path as public/nexus.svg.
  let s = `q 0.72 0 0 -0.72 43 765 cm 0.77715 -0.62932 0.62932 0.77715 -9.755 20.452 cm
0.0667 0.4627 0.4078 rg 15.5 10.5 m 32.5 10.5 l 39.956 10.5 46 16.544 46 24 c 46 31.456 39.956 37.5 32.5 37.5 c 15.5 37.5 l 8.044 37.5 2 31.456 2 24 c 2 16.544 8.044 10.5 15.5 10.5 c f
1 1 1 RG 3.4 w 1 J 4 31 m 11 32 13 28 18 19 c 21 13 24 10 27 14 c 30 19 30 28 35 27 c 39 27 42 22 46 18 c S Q\n`;
  s += label(85,746,19,'Nexus',teal,'F2') + label(85,731,8,'MATHEMATICS PRACTICAL',muted,'F2');
  s += label(365,749,9,'Cluster Innovation Centre',ink) + label(365,734,9,'University of Delhi  /  B.Tech Semester III',muted);
  s += line(44,715,568,715);
  const titleLines = wrap(heading,23,505).slice(0,2);
  titleLines.forEach((v,i) => { s+=label(44,680-i*26,23,v,ink,'F2'); });
  const bottom = 660-(titleLines.length-1)*26;
  s += label(45,bottom,10,context,muted);
  return { stream:s, bottom:bottom-20 };
}
function footer(r:SimulationReport, page:number, total:number) {
  let s=line(44,76,568,76)+label(44,59,9,team,ink,'F2');
  wrap(r.disclaimer,8.5,455).forEach((row,i)=>{s+=label(44,44-i*10,8.5,row,muted);});
  return s+label(526,53,9,`${page} / ${total}`,teal,'F2');
}
function rgb(hex:string) {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '0a756b';
  return [0,2,4].map(i=>pos(parseInt(value.slice(i,i+2),16)/255)).join(' ');
}
function tick(value:number) {
  if (value!==0 && (Math.abs(value)<.001 || Math.abs(value)>=100000)) return value.toExponential(1);
  return String(Number(value.toPrecision(3)));
}

function graph(r:SimulationReport, data:ReportSeries[], title:string, unit:string, top:number, height:number) {
  const x=91, w=454, bottom=top-height+46, plotTop=top-57, graphHeight=plotTop-bottom;
  const maxX = r.time.at(-1) ?? 1;
  const xSpan = maxX>0 ? maxX : 1;
  let low=0, high=0;
  for (const curve of data) for (const v of curve.values) if (Number.isFinite(v)) { low=Math.min(low,v); high=Math.max(high,v); }
  if (high === low) high=low+1;
  const yAt = (value:number) => bottom+(value-low)/(high-low)*graphHeight;
  let s=label(44,top,13,title,teal,'F2')+label(x,top-40,9,unit,ink,'F2');
  for(let i=0;i<=4;i++) {
    const value=low+(high-low)*i/4, y=yAt(value), text=tick(value);
    s+=line(x,y,x+w,y)+label(x-9-measure(text,8.5),y-3,8.5,text,muted);
    const xtick=tick(xSpan*i/4), at=x+w*i/4;
    s+=line(at,bottom-3,at,bottom,muted)+label(at-measure(xtick,8.5)/2,bottom-14,8.5,xtick,muted);
  }
  s+=line(x,bottom,x+w,bottom,muted)+line(x,bottom,x,plotTop,muted);
  const xLabel=/^time\b/i.test(r.timeLabel) && r.timeLabel!=='time units' ? r.timeLabel : `Time (${r.timeLabel})`;
  s+=label(x+(w-measure(xLabel,9))/2,bottom-29,9,xLabel,ink,'F2');
  const styles=['','6 3','2 2','7 2 2 2'];
  let lx=x, ly=top-13;
  data.forEach((curve,j) => {
    const c=rgb(curve.color), dash=styles[j%styles.length], count=Math.min(curve.values.length,r.time.length);
    if(lx+measure(curve.label,8)+25>564) { lx=x; ly-=10; }
    s+=line(lx,ly,lx+16,ly,c,1.6,dash)+label(lx+21,ly-2.5,8,curve.label,muted);
    lx+=measure(curve.label,8)+39;
    let path='',active=false;
    const step=Math.max(1,Math.ceil(count/1300));
    for(let i=0; i<count;) {
      const value=curve.values[i];
      if(Number.isFinite(value)) {
        path+=`${pos(x+r.time[i]/xSpan*w)} ${pos(yAt(value))} ${active?'l':'m'} `;
        active=true;
      } else active=false;
      if(i===count-1) break;
      i=Math.min(i+step,count-1);
    }
    s+=`[${dash}] 0 d ${c} RG 1.6 w ${path}S\n`;
  });
  if(r.selectedTime!==undefined && Number.isFinite(r.selectedTime)) {
    const at=x+Math.max(0,Math.min(1,r.selectedTime/xSpan))*w;
    s+=line(at,bottom,at,plotTop,ink,1.1,'3 3');
  }
  return s;
}

type MathBox={width:number; draw:(x:number,y:number)=>string};
/** Print the small formula vocabulary as genuine vector fractions and scripts. */
function mathBox(expression:string, size:number):MathBox {
  let at=0;
  function group(fontSize:number, nested:boolean):MathBox {
    const parts:MathBox[]=[];
    while(at<expression.length) {
      if(nested && expression[at]==='}') { at++; break; }
      if(expression.startsWith('\\frac{',at)) {
        at+=6;
        const num=group(fontSize*.88,true);
        if(expression[at]==='{') at++;
        const den=group(fontSize*.88,true), width=Math.max(num.width,den.width)+5;
        parts.push({width,draw:(x,y)=>num.draw(x+(width-num.width)/2,y+fontSize*.56)+line(x,y+fontSize*.22,x+width,y+fontSize*.22,ink,.7)+den.draw(x+(width-den.width)/2,y-fontSize*.66)});
      } else if((expression[at]==='_' || expression[at]==='^') && expression[at+1]==='{') {
        const up=expression[at]==='^'; at+=2;
        const script=group(fontSize*.70,true);
        parts.push({width:script.width,draw:(x,y)=>script.draw(x,y+(up?.52:-.25)*fontSize)});
      } else if(expression.startsWith('\\beta',at) || expression.startsWith('\\gamma',at)) {
        const beta=expression.startsWith('\\beta',at); at+=beta?5:6;
        parts.push({width:fontSize*.57,draw:(x,y)=>label(x,y,fontSize,beta?'b':'g',ink,'F4')});
      } else {
        const start=at++;
        while(at<expression.length && !'\\_^{}'.includes(expression[at])) at++;
        const v=expression.slice(start,at);
        parts.push({width:measure(v,fontSize,true),draw:(x,y)=>label(x,y,fontSize,v,ink,'F3')});
      }
    }
    return {width:parts.reduce((a,b)=>a+b.width,0),draw:(x,y)=>{
      let stream='';
      for(const part of parts) { stream+=part.draw(x,y); x+=part.width; }
      return stream;
    }};
  }
  return group(size,false);
}
function fields(rows:Field[], x:number, top:number, width:number) {
  let s='', y=top;
  for(const [key,value] of rows) {
    for(const row of wrap(key,9,width-8)) { s+=label(x,y,9,row,muted); y-=12; }
    for(const row of wrap(String(value),11,width-10)) { s+=label(x,y,11,row,ink,'F2'); y-=14; }
    s+=line(x,y+6,x+width,y+6);
    y-=7;
  }
  return {stream:s,bottom:y};
}
function pdfFile(pages:string[], r:SimulationReport):Uint8Array {
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>','',
    ...['Helvetica','Helvetica-Bold','Times-Italic','Symbol'].map(f=>`<< /Type /Font /Subtype /Type1 /BaseFont /${f} >>`),
  ];
  const pageIds:number[]=[];
  pages.forEach((stream,i)=>{
    stream+=footer(r,i+1,pages.length);
    const pageId=objects.length+1;
    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${pageId+1} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });
  objects[1]=`<< /Type /Pages /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] /Count ${pages.length} >>`;
  const info=objects.length+1;
  objects.push(`<< /Title (${esc(r.title)}) /Author (${esc(team)}) >>`);
  let pdf='%PDF-1.4\n';
  const offsets:number[]=[];
  objects.forEach((body,i)=>{ offsets.push(pdf.length); pdf+=`${i+1} 0 obj\n${body}\nendobj\n`; });
  const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(const offset of offsets) pdf+=`${String(offset).padStart(10,'0')} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function createSimulationPdf(r:SimulationReport):Uint8Array {
  const equations=printEquations(r.equations??[]);
  const detailed=equations.length>0 || Math.max(r.parameters.length,r.metrics.length)>2;
  const first=header(r.model,r.timestamp+'  /  Generic educational model');
  let page=first.stream, top=first.bottom;
  if(r.selectedTime!==undefined) {
    page+=`${paper} rg 44 ${top-24} 524 26 re f\n`;
    const unit=r.timeLabel.match(/\(([^)]+)\)$/)?.[1] ?? r.timeLabel;
    page+=label(55,top-15,10,`Selected time  ${Number(r.selectedTime.toPrecision(6))} ${unit}`,ink,'F2');
    page+=line(365,top-12,385,top-12,ink,1,'3 3')+label(391,top-15,9,'Time cursor in each plot',muted);
    top-=52;
  }
  if(!detailed) {
    page+=label(44,top,10,'INPUTS',teal,'F2')+label(320,top,10,'RESULTS',teal,'F2');
    const inputs=fields(r.parameters,44,top-17,234), metrics=fields(r.metrics,320,top-17,247);
    page+=inputs.stream+metrics.stream; top=Math.min(inputs.bottom,metrics.bottom)-15;
  }
  const hasSecond=Boolean(r.secondarySeries?.length);
  const bacteria=r.series.some(curve=>/bacteria|antibiotic/i.test(curve.label));
  const primary=r.graphTitle??(bacteria?'Bacteria over time':'Simulation graph');
  const graphHeight=(top-85)/(hasSecond?2:1);
  page+=graph(r,r.series,primary.toUpperCase(),r.valueLabel,top,graphHeight);
  if(r.secondarySeries?.length) {
    const secondary=r.secondaryGraphTitle??(bacteria?'Example drug level':'Model response');
    page+=graph(r,r.secondarySeries,secondary.toUpperCase(),r.secondaryValueLabel??'Model units',top-graphHeight,graphHeight);
  }
  const pages=[page];
  if(detailed) {
    const details=header('Settings and equations',r.model);
    let sheet=details.stream, y=details.bottom;
    let input=0, metric=0;
    do {
      sheet+=label(44,y,11,'INPUTS',teal,'F2')+label(319,y,11,'RESULTS',teal,'F2');
      let left=y-22, right=left;
      while(input<r.parameters.length) {
        const next=fields([r.parameters[input]],44,left,236);
        if(next.bottom<92 && left<y-22) break;
        sheet+=next.stream; left=next.bottom; input++;
      }
      while(metric<r.metrics.length) {
        const next=fields([r.metrics[metric]],319,right,249);
        if(next.bottom<92 && right<y-22) break;
        sheet+=next.stream; right=next.bottom; metric++;
      }
      y=Math.min(left,right)-16;
      if(input<r.parameters.length || metric<r.metrics.length) {
        pages.push(sheet); sheet=details.stream; y=details.bottom;
      }
    } while(input<r.parameters.length || metric<r.metrics.length);
    if(equations.length) {
      if(y-24-Math.ceil(equations.length/2)*51<88) {
        pages.push(sheet); sheet=details.stream; y=details.bottom;
      }
      sheet+=label(44,y,11,'MODEL EQUATIONS',teal,'F2');
      for(let i=0;i<equations.length;i++) {
        let formula=mathBox(equations[i],15);
        if(formula.width>244) formula=mathBox(equations[i],15*244/formula.width);
        sheet+=formula.draw(i%2?319:44,y-33-Math.floor(i/2)*51);
      }
    }
    pages.push(sheet);
  }
  return pdfFile(pages,r);
}
