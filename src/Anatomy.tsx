import React, { useState } from 'react';
import { AtlasBody, Tablet } from './AtlasBody';
import OrganSections, { Leader } from './OrganSections';
import MeshAtlas from './MeshAtlas';
import './anatomy.css';

export type Organ = 'whole'|'mouth'|'stomach'|'intestine'|'liver'|'tissue'|'removal';
export type Stage = 'ready'|'placed'|'swallow'|'stomach'|'intestine'|'liver'|'tissue'|'removal';
export type AnatomyProps = {
  organ:Organ;
  onSelect:(organ:Organ)=>void;
  stage:Stage;
  progress:number;
  fractions:{gut:number;central:number;tissue:number;removed:number};
  language?:'en'|'hi';
};
export const atlasRegions:Record<Organ,string> = {
  whole:'Whole body',mouth:'Mouth & oesophagus',stomach:'Stomach',intestine:'Small intestine',liver:'Liver & circulation',tissue:'Tissue exchange',removal:'Removal',
};
const anchors:Record<Exclude<Organ,'whole'>,[number,number]>={mouth:[218,50],stomach:[243,153],intestine:[214,187],liver:[197,146],tissue:[238,254],removal:[222,192]};
const ink='#ade1cc';
const organHotspots:Partial<Record<Organ,string>> = {
  mouth:'M199 43Q213 53 217 58L218 104L227 104L225 53Q235 48 238 42Z',
  stomach:'M231 140Q251 130 255 150Q256 174 224 168L214 166L227 154Z',
  liver:'M179 144Q187 132 207 134L232 139L225 150L205 163L180 162Z',
  intestine:'M187 171Q211 175 246 168L252 178L245 204L223 220L190 203Z',
  tissue:'M225 230Q247 217 247 250L237 280L222 257Z',
};

function PlateLines({full=false,onSelect,active}:{full?:boolean;onSelect?:(o:Organ)=>void;active?:Organ}) {
  const rows:{id:Exclude<Organ,'whole'>;y:number;right?:boolean;label:string}[]=[
    {id:'mouth',y:57,label:'Oral cavity'}, {id:'liver',y:131,label:'Liver'},
    {id:'stomach',y:143,right:true,label:'Stomach'}, {id:'intestine',y:208,right:true,label:'Small intestine'},
    {id:'tissue',y:296,right:true,label:'Tissue'}, {id:'removal',y:223,label:'Removal'},
  ];
  return <>{rows.filter(r=>full||['mouth','liver','intestine','tissue'].includes(r.id)).map(({id,y,right,label})=>{
    const [x,ay]=anchors[id], via=right?Math.max(264,x+28):Math.min(171,x-28),end=right?398:43;
    return <g key={id} className={'nx-plate-link'+(active===id?' is-active':'')} onClick={()=>onSelect?.(id)}
      role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?'Inspect '+atlasRegions[id]:undefined}
      onKeyDown={onSelect?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(id)}}:undefined}>
      {onSelect&&<><rect x={right?via-5:end-5} y={y-23} width={Math.abs(end-via)+10} height="34" fill="transparent"/><circle cx={x} cy={ay} r="9" fill="transparent"/></>}
      <Leader from={[x,ay]} via={[via,y]} to={[end,y]} label={label} end={right}/>
    </g>;
  })}</>;
}
export function AtlasPlate({labels=true,central=0,tissue=0}:{labels?:boolean;central?:number;tissue?:number}) {
  return <svg className="nx-atlas-plate" viewBox="0 0 440 450" role="img" aria-label="Front-view anatomical illustration with the liver, small intestine and target tissue">
    <AtlasBody central={central} tissue={tissue}/>{labels&&<PlateLines/>}
  </svg>;
}
function Whole(props:AnatomyProps) {
  const {stage,progress:p,fractions:f}=props;
  const tablet=stage==='ready'?{x:192,y:47}:stage==='placed'?{x:220,y:50}:stage==='swallow'?{x:220+Math.pow(p,3)*18,y:50+p*102}:undefined;
  return <svg className="nx-atlas-whole" viewBox="0 0 440 445" role="group" aria-label="Front cutaway with selectable organs">
    <AtlasBody tablet={tablet} tissue={f.tissue} central={f.central}/>
    <g fill={ink} stroke="#355e57" strokeWidth=".6">
      {stage==='stomach'&&Array.from({length:Math.ceil(p*7)},(_,i)=><circle key={i} cx={237+i%3*3} cy={153+Math.floor(i/3)*2} r="1.3"/>)}
      {(stage==='intestine'||stage==='liver')&&Array.from({length:5},(_,i)=>{const t=(p+i/5)%1;return <circle key={i} cx={216-21*t} cy={186-40*t} r="1.6"/>})}
      {Array.from({length:Math.round(f.central*20)},(_,i)=><circle key={i} cx={222+Math.sin(i*.7)*1.3} cy={92+((i*19+p*25)%111)} r="1.35"/>)}
    </g>
    <g aria-hidden="true">{Object.entries(organHotspots).map(([region,d])=><path key={region} d={d} fill="transparent" style={{cursor:'pointer'}} onClick={()=>props.onSelect(region as Organ)}/>)}</g>
    <PlateLines full active={stage==='swallow'?'mouth':stage==='ready'||stage==='placed'?'whole':stage} onSelect={props.onSelect}/>
  </svg>;
}
function Locator({organ,onReturn}:{organ:Exclude<Organ,'whole'>;onReturn:()=>void}) {
  const [x,y]=anchors[organ];
  return <button className="nx-atlas-locator" onClick={onReturn} title="Return to whole body" aria-label="Return to whole body overview">
    <svg viewBox="108 0 220 440" aria-hidden="true"><AtlasBody/><circle cx={x} cy={y} r="23" stroke="#ffe1a3" fill="#e7bb6445" strokeWidth="7"/></svg>
    <span>↶ Body</span>
  </button>;
}
function ParticleLegend(){
  return <div className="nx-atlas-legend" aria-label="Tablet and dissolved drug legend">
    <span><svg viewBox="0 0 22 16" aria-hidden="true"><Tablet x={11} y={8}/></svg>Tablet</span>
    <span><svg viewBox="0 0 22 16" aria-hidden="true"><path d="M4 8l4-4 4 3-3 4zm10 3 3-4 3 2-1 4Z" fill="#ffd98f"/></svg>Fragments</span>
    <span><svg viewBox="0 0 22 16" aria-hidden="true"><g fill={ink}><circle cx="6" cy="8" r="2.4"/><circle cx="13" cy="4" r="2"/><circle cx="16" cy="11" r="2.5"/></g></svg>Dissolved drug</span>
  </div>;
}
export default function Anatomy(props:AnatomyProps) {
  const {organ,onSelect}=props;
  const [dimension,setDimension]=useState<'2D'|'3D'>('2D');
  return <section className="nx-atlas" aria-label="Interactive anatomy atlas">
    <div className="nx-atlas-bar"><span className="nx-atlas-viewname">{dimension==='3D'?'Spatial model':organ==='whole'?'Anterior view':'Anatomical section'}</span>
      <div className="nx-atlas-tabs" role="group" aria-label="Anatomy display">{(['2D','3D'] as const).map(d=><button key={d} aria-pressed={dimension===d} onClick={()=>setDimension(d)}>{d}</button>)}</div>
    </div>
    <div className={'nx-atlas-stage'+(organ==='whole'?'':' is-section')}>
      {dimension==='3D'?<MeshAtlas {...props}/>:organ==='whole'?<Whole {...props}/>:<svg viewBox="0 0 460 265" className="nx-atlas-section" role="img" aria-label={atlasRegions[organ]+' anatomical close-up'}><OrganSections {...props}/></svg>}
      {organ!=='whole'&&<Locator organ={organ} onReturn={()=>onSelect('whole')}/>}
    </div>
    <div className="nx-atlas-footer"><label><span>Inspect region</span><select value={organ} onChange={e=>onSelect(e.target.value as Organ)}>
      {Object.entries(atlasRegions).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select></label><ParticleLegend/></div>
  </section>;
}
