import React, {useEffect, useState} from 'react';
import {AtlasPlate} from './Anatomy';
import {Icon, type IconName} from './Identity';
import {distributionDefaults,solveDistribution} from './engine/distribution';
import {calculatePD_Emax,solvePK_Exact} from './engine/math';
import {defaultAntibioticExample,solveAntibioticExample} from './engine/antibiotic';

const trace=solveDistribution(distributionDefaults);
const oral=solvePK_Exact({dose:100,V:10,ka:1.2,ke:.2,F:.7},24,.25);
const iv=solvePK_Exact({dose:100,V:10,ke:.2},24,.25);
const levels=Array.from({length:61},(_,i)=>i/5);
const bacteria=solveAntibioticExample(defaultAntibioticExample,48,.4);
type Thumbnail={x:number[];curves:{label:string;y:number[]}[];xUnit:string;yUnit:string};
const cards:{id:string;title:string;field:string;text:string;icon:IconName;plot:Thumbnail}[]=[
  {id:'pk-oral',title:'Dose & concentration',field:'Pharmacokinetics',text:'Compare oral and IV models. Measure half-life and test Euler against RK4.',icon:'drop',plot:{x:oral.time,curves:[{label:'Oral',y:oral.C.map(c=>c/1000)},{label:'IV',y:iv.C.map(c=>c/1000)}],xUnit:'Time (h)',yUnit:'C (mg/L)'}},
  {id:'pd-emax',title:'Concentration & response',field:'Pharmacodynamics',text:'Change target sensitivity and see how a concentration translates into effect.',icon:'target',plot:{x:levels,curves:[{label:'Model response',y:calculatePD_Emax(levels,100,2)}],xUnit:'C (mg/L)',yUnit:'Effect (%)'}},
  {id:'antibiotic-bacteria',title:'Antibiotic & bacteria',field:'Population dynamics',text:'Move the treatment start time and compare two growth trajectories.',icon:'microbe',plot:{x:bacteria.time,curves:[{label:'With treatment',y:bacteria.bacteriaWithDrug},{label:'Without',y:bacteria.bacteriaWithoutDrug}],xUnit:'Time (h)',yUnit:'Bacteria (rel. units)'}}
];
function MiniPlot({plot}:{plot:Thumbnail}){
  const last=plot.x.length-1, maxX=plot.x[last],maxY=Math.max(1,...plot.curves.flatMap(c=>c.y));
  const x=(i:number)=>34+plot.x[i]/maxX*224,y=(n:number)=>72-50*n/maxY;
  const pick=Math.round(last*.37);
  return <div className="nx-mini"><svg viewBox="0 0 282 98" role="img" aria-label={plot.curves.map(c=>c.label).join(' and ')+' plotted against '+plot.xUnit}>
    <g fill="none" stroke="currentColor" opacity=".17">{[22,47,72].map(a=><path key={a} d={`M34 ${a}H258`}/>)}{[34,90,146,202,258].map(a=><path key={a} d={`M${a} 22V72`}/>)}</g>
    <g fill="currentColor" fontSize="10" fontFamily="sans-serif"><text x="32" y="12">{plot.yUnit}</text><text x="28" y="74" textAnchor="end">0</text><text x="28" y="26" textAnchor="end">{Math.round(maxY)}</text><text x="34" y="87">0</text><text x="258" y="87" textAnchor="end">{maxX}</text><text x="146" y="91" textAnchor="middle">{plot.xUnit}</text></g>
    <path d={`M${x(pick)} 18V73`} stroke="currentColor" opacity=".55" strokeDasharray="2 3"/>
    {plot.curves.map((c,j)=><g key={c.label}><path fill="none" stroke="currentColor" strokeWidth="2.3" strokeDasharray={j?'5 4':undefined} d={c.y.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(' ')}/><circle cx={x(pick)} cy={y(c.y[pick])} r="3.2" fill="currentColor" stroke="#fff" strokeWidth="1"/></g>)}
  </svg><div className="nx-mini-legend">{plot.curves.map((c,j)=><span key={c.label}><i style={{borderTopStyle:j?'dashed':'solid'}}/>{c.label}</span>)}</div></div>;
}
export function PracticalCards({openModel}:{openModel:(id:string)=>void}){
  return <div className="nx-cards">{cards.map((c,i)=><button className={'nx-card colour-'+i} key={c.id} onClick={()=>openModel(c.id)}>
    <div className="nx-card-art"><div className="nx-card-field"><Icon name={c.icon} size={16}/>{c.field}</div><MiniPlot plot={c.plot}/></div>
    <div className="nx-card-text"><h3>{c.title}</h3><p>{c.text}</p><span className="nx-card-link">Open practical <Icon name="arrow" size={15}/></span></div>
  </button>)}</div>;
}
function Preview(){
  const [index,setIndex]=useState(Math.min(24,trace.length-1)),[playing,setPlaying]=useState(false);
  useEffect(()=>{if(!playing)return;const id=window.setInterval(()=>setIndex(i=>(i+1)%trace.length),160);return()=>clearInterval(id)},[playing]);
  const row=trace[index];
  return <figure className="nx-preview" aria-label="Interactive body atlas preview">
    <div className="nx-plate-top"><span><i/> Simulation preview</span><a href="#body" aria-label="Open body view"><Icon name="external" size={17}/></a></div>
    <div className="nx-plate-art"><AtlasPlate central={row.central/distributionDefaults.dose} tissue={row.tissue/distributionDefaults.dose}/></div>
    <div className="nx-plate-bottom"><div className="nx-plate-readout"><span>Biological time <b>{row.time.toFixed(1)} h</b></span><span>Tissue concentration <b>{(row.tissue/10).toFixed(2)} mg/L</b></span></div><div className="nx-preview-play"><button aria-label={playing?'Pause preview':'Play preview'} onClick={()=>setPlaying(!playing)}><Icon name={playing?'pause':'play'} size={14}/></button><input aria-label="Preview biological time" type="range" min="0" max={trace.length-1} value={index} onChange={e=>{setIndex(+e.target.value);setPlaying(false)}}/></div></div>
  </figure>;
}
interface HomeProps {openModel:(id:string)=>void; startTour:()=>void; firstVisit:boolean}
export default function Overview({openModel,startTour,firstVisit}:HomeProps){
 return <div className="nx-home"><section className="nx-hero"><div className="nx-intro">
  <span className="nx-kicker"><i/> Interactive mathematics lab</span>
  <h1>A tablet’s journey<br/><em>through the body.</em></h1>
  <p>Follow a tablet from the first swallow to the tissue it reaches. Explore why concentration rises and falls, and how the same concentration can produce different responses.</p>
  <div className="nx-actions"><a className="nx-button" href="#body"><Icon name="play" size={16}/>Follow a tablet</a><a className="nx-button outline" href="#equations"><Icon name="book" size={18}/>Explore the maths</a></div>
  <div className="nx-academic"><Icon name="cap" size={21}/><span><strong>B.Tech · Semester III Mathematics Practical</strong><br/>Cluster Innovation Centre, University of Delhi</span></div>
 </div><Preview/></section>
 <section className="nx-practicals"><div className="nx-section-head"><div><span className="nx-kicker"><i/> Practical library</span><h2>Explore the practicals</h2></div><a href="#explorer">View all models <Icon name="arrow" size={18}/></a></div><PracticalCards openModel={openModel}/></section>
 <section className="nx-tour-strip"><Icon name="compass" size={26}/><div><h2>{firstVisit?'Your first visit · tour 1 of 3':'Lab orientation'}</h2><p>{firstVisit?'In Body view, place a tablet and swallow with water. The organ cutaways follow the same clock as the tissue graph.':'Get a three-step tour of the tablet journey, tissue graph and sensitivity experiment.'}</p></div><button className="nx-button outline" onClick={startTour}>{firstVisit?'Continue tour':'Take the tour'} <Icon name="arrow" size={15}/></button></section>
 </div>;
}
