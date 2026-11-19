import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AnatomyProps, Organ } from './Anatomy';

// Local, original low-poly geometry in anatomical coordinates. Positive z
// faces the viewer at 0°, and x increases toward the subject's left.
type V = [number,number,number];
type Pigment = [number,number,number];
type Face = {v:V[];color:Pigment;alpha:number;organ?:Organ};
type Profile = [number,number,number,number?,number?]; // y, x/z radii, x/z centre
type Point = [number,number];
type Paint = {points:Point[];depth:number;fill:string;organ?:Organ};
const skin:Pigment=[158,190,167], vessel:Pigment=[197,127,111], vein:Pigment=[105,175,164], gut:Pigment=[216,163,120], muscle:Pigment=[193,133,121], lung:Pigment=[141,170,151];
const faces:Face[]=[];

function joinRings(rings:V[][], color:Pigment, alpha:number, organ?:Organ) {
  for(let i=1;i<rings.length;i++) {
    for(let j=0;j<rings[i].length;j++) {
      const next=(j+1)%rings[i].length;
      faces.push({v:[rings[i-1][j],rings[i-1][next],rings[i][next],rings[i][j]],color,alpha,organ});
    }
  }
}
function contour(profile:Profile[],color:Pigment,alpha=1,organ?:Organ,sides=14) {
  const rings=profile.map(([y,rx,rz,cx=0,cz=0])=>Array.from({length:sides},(_,i):V=>{
    const a=2*Math.PI*i/sides;
    return [cx+rx*Math.cos(a),y,cz+rz*Math.sin(a)];
  }));
  joinRings(rings,color,alpha,organ);
}
function oval([x,y,z]:V,[rx,ry,rz]:V,color:Pigment,alpha=1,organ?:Organ) {
  const profile:Profile[]=Array.from({length:9},(_,i)=>{
    const phi=Math.PI*(i+.008)/8.016;
    return [y-ry*Math.cos(phi),rx*Math.sin(phi),rz*Math.sin(phi),x,z];
  });
  contour(profile,color,alpha,organ,12);
}
function unit(v:V):V {const n=Math.hypot(...v)||1;return [v[0]/n,v[1]/n,v[2]/n]}
function cross(a:V,b:V):V{return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function diff(a:V,b:V):V{return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function tube(path:V[],radius:number,color:Pigment,organ?:Organ) {
  const rings=path.map((p,i)=>{
    const axis=unit(diff(path[Math.min(path.length-1,i+1)],path[Math.max(0,i-1)]));
    const lateral=unit(cross(axis,Math.abs(axis[2])<.85?[0,0,1]:[1,0,0]));
    const up=cross(axis,lateral);
    return Array.from({length:7},(_,j):V=>{
      const a=2*Math.PI*j/7,c=radius*Math.cos(a),s=radius*Math.sin(a);
      return [p[0]+c*lateral[0]+s*up[0],p[1]+c*lateral[1]+s*up[1],p[2]+c*lateral[2]+s*up[2]];
    });
  });
  joinRings(rings,color,1,organ);
}
contour([[5,2,4],[8,12,13],[15,19,17],[28,20,19],[39,17,18],[48,12,15,0,2],[54,5,6,0,3]],skin,.85);
oval([0,29,17],[3.2,6,4.7],skin,.9);
for(const sign of [-1,1]) {
  oval([sign*8,25,16.8],[3,1,1.2],[91,120,105]);
  oval([sign*19,33,0],[2,5,3],skin,.85);
}
contour([[45,9,9],[58,10,10],[69,14,12]],skin,.28);
contour([[62,15,12],[69,36,14],[77,47,17],[93,42,23],[111,38,24],[130,34,22],[150,29,18],[170,30,20],[185,37,23],[200,36,22],[218,26,17],[225,8,10]],skin,.11);
for(const s of [-1,1]){
  const side=(x:number)=>x*s;
  contour([[72,5,8,side(39)],[78,12,12,side(46)],[90,12,12,side(50)],[110,9,10,side(55)],[138,7,7,side(62)],[148,8,8,side(64)],[164,7,8,side(68)],[186,4,5,side(77)],[198,6,5,side(80)],[211,4,3,side(83)],[215,1,1,side(83)]],skin,.38);
  contour([[198,14,16,side(20)],[211,20,20,side(22)],[228,19,19,side(23)],[256,14,15,side(21)],[280,10,10,side(20)],[290,10,10,side(20),1],[310,12,12,side(21),-2],[331,9,10,side(20),-3],[353,5,6,side(20)],[369,5,6,side(21)],[380,8,12,side(23),3],[386,9,15,side(24),7],[389,7,12,side(25),9]],skin,.29);
  contour([[73,2,3,side(14)],[84,10,8,side(19)],[99,15,11,side(23)],[121,15,12,side(23)],[130,10,11,side(26)],[133,3,4,side(27)]],lung,.77);
  tube([[0,105,4],[side(7),79,5],[side(36),76,6],[side(48),91,8],[side(61),141,4],[side(78),196,2]],1.4,vessel,'liver');
  tube([[0,194,3],[side(19),215,7],[side(24),238,8],[side(21),273,2],[side(19),291,-3],[side(22),330,-4],[side(21),372,2]],1.9,vessel,'tissue');
  tube([[side(9),109,8],[side(5),181,4],[side(8),197,5],[side(20),218,9],[side(26),244,7],[side(24),274,0]],1.3,vein,'tissue');
}
oval([0,39,16],[8,2.4,3.1],muscle,1,'mouth');
tube([[0,39,17],[0,40,10],[0,40,1],[0,44,-3],[0,62,-4],[1,81,-5],[1,109,-3],[3,128,0],[14,141,5]],2.5,gut,'mouth');
tube([[0,52,3],[0,79,4],[0,85,4],[-10,97,2]],2.1,lung,'mouth');
tube([[0,85,4],[10,95,2]],2,lung,'mouth');
contour([[97,2,3,4,6],[99,8,7,6,8],[106,11,9,7,9],[116,8,6,8,10],[122,1,1,11,9]],vessel,1,'liver');
contour([[122,6,6,-13,5],[125,19,13,-11,4],[131,24,17,-9,4],[136,23,15,-12,5],[143,15,11,-16,4],[148,4,3,-24,3]],[202,141,105],1,'liver');
contour([[129,3,5,21,0],[133,9,8,23,0],[141,11,11,22,1],[150,8,9,19,4],[155,8,6,13,7],[157,4,4,7,7]],muscle,1,'stomach');
tube([[19,143,4],[18,148,6],[13,153,7],[6,154,8],[-3,152,8],[-8,156,9]],3.7,muscle,'stomach');
const bowelPath:V[]=[];
for(let i=0;i<=120;i++){const t=i/120,angle=t*10*Math.PI;bowelPath.push([Math.sin(angle)*(18+2*Math.sin(t*5)),160+37*t+3*Math.cos(angle),6+6*Math.cos(angle*.6)])}
tube(bowelPath,3.4,gut,'intestine');
tube([[-21,191,8],[-23,178,7],[-22,163,7],[-17,158,10],[-6,160,12],[10,161,12],[21,157,8],[25,161,5],[23,179,5],[21,193,7],[15,198,10],[4,202,10],[2,208,6]],3.6,[190,163,124],'intestine');
tube([[0,178,3],[2,163,3],[-2,153,4],[-9,141,6],[-14,131,8]],2.4,vein,'liver');
tube([[-11,132,7],[-4,128,3],[0,123,0],[1,104,6]],2.6,vein,'liver');
contour([[209,2,2,26,4],[219,6,7,29,7],[234,7,8,29,9],[247,5,6,26,8],[258,1,2,23,7]],muscle,.96,'tissue');
for(const s of [-1,1]){
  oval([s*20,147,-11],[6,10,5],[166,108,94],.95);
}
const focus:Record<Organ,{at:V;span:number}> = {
  whole:{at:[0,198,0],span:416}, mouth:{at:[0,65,4],span:133}, stomach:{at:[14,146,4],span:68},
  intestine:{at:[0,182,6],span:85}, liver:{at:[0,132,4],span:112}, tissue:{at:[22,232,6],span:92},
  removal:{at:[0,150,3],span:180},
};
function inside([px,py]:Point,points:Point[]) {
  let contained=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [xi,yi]=points[i],[xj,yj]=points[j];
    if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi) contained=!contained;
  }
  return contained;
}
function projectScene(angle:number,organ:Organ) {
  const a=angle*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a),{at,span}=focus[organ];
  function project(v:V):[number,number,number]{
    const [x,y,z]=diff(v,at),depth=x*sin+z*cos;
    const s=350/span*(1+depth/(span*4));
    return [210+(x*cos-z*sin)*s,178+(y-depth*.045)*s,depth];
  }
  const rendered:Paint[]=[];
  for(const face of faces) {
    const v=face.v.map(project),n=unit(cross(diff(v[1],v[0]),diff(v[2],v[0])));
    if(v.every(p=>p[1]<-6)||v.every(p=>p[1]>362)||v.every(p=>p[0]<-6)||v.every(p=>p[0]>426))continue;
    const light=.67+.33*Math.abs(n[2]*.8-n[0]*.37-n[1]*.43);
    const alpha=organ!=='whole'&&organ!=='removal'&&face.organ!==organ?face.alpha*.22:face.alpha;
    const color=face.color.map(c=>Math.round(c*light));
    rendered.push({points:v.map(([x,y])=>[x,y]),depth:v.reduce((s,p)=>s+p[2],0)/v.length,fill:`rgba(${color.join(',')},${alpha})`,organ:face.organ});
  }
  return {rendered:rendered.sort((a,b)=>a.depth-b.depth),project};
}
const labels:{organ:Organ;name:string;at:V;x:number;y:number}[]=[
  {organ:'mouth',name:'Oral cavity',at:[0,39,17],x:36,y:46},
  {organ:'stomach',name:'Stomach',at:[21,143,5],x:393,y:118},
  {organ:'liver',name:'Liver',at:[-16,133,8],x:36,y:112},
  {organ:'intestine',name:'Small intestine',at:[2,175,10],x:393,y:166},
  {organ:'tissue',name:'Tissue',at:[26,233,9],x:393,y:236},
];
export default function MeshAtlas({organ,onSelect,stage,progress,fractions}:AnatomyProps){
  const [angle,setAngle]=useState(0),canvas=useRef<HTMLCanvasElement>(null),drag=useRef<{x:number;angle:number;moved:boolean}|null>(null);
  const rangeId=useId(),scene=useMemo(()=>projectScene(angle,organ),[angle,organ]);
  useEffect(()=>{
    const el=canvas.current,ctx=el?.getContext('2d');if(!ctx||!el)return;
    const density=Math.min(2,window.devicePixelRatio||1);
    el.width=420*density;el.height=356*density;ctx.scale(density,density);
    for(const face of scene.rendered){
      ctx.beginPath();face.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=face.fill;ctx.fill();
    }
    const dot=(at:V,fill:string,r:number)=>{
      const [x,y]=scene.project(at);ctx.beginPath();ctx.ellipse(x,y,r*1.4,r,-.3,0,2*Math.PI);ctx.fillStyle=fill;ctx.fill();
    };
    if(stage==='ready'||stage==='placed'||stage==='swallow'){
      const p=stage==='swallow'?progress:0;
      dot([stage==='ready'?-18:p*9,39+p*103,17-Math.sin(Math.PI*p)*17],'#ffe1a1',Math.min(7,2.5*410/focus[organ].span));
    } else if(stage==='stomach'){
      const n=Math.ceil(progress*9);
      if(progress<.32)dot([21,143,9],'#ffe1a1',3);
      for(let i=0;i<n;i++)dot([19+Math.cos(i*2)*4,144+Math.sin(i*2)*5,10],i<2&&progress<.8?'#f9cd7b':'#b5efdc',1.9);
    } else {
      const paths:Record<string,V[]>={intestine:[[1,173,9],[-4,153,6],[-10,138,7]],liver:[[-10,135,7],[1,122,3],[4,108,5]],tissue:[[4,106,6],[4,196,4],[27,236,10]],removal:[[4,106,6],[2,132,5],[0,155,6]]};
      const path=paths[stage];const count=stage==='tissue'?Math.round(15*fractions.tissue):stage==='removal'?Math.round(15*fractions.central):5;
      for(let i=0;i<count;i++){const t=((progress+i/count)%1)*2,a=Math.floor(t),q=t-a;dot(path[a].map((v,k)=>v+(path[a+1][k]-v)*q) as V,'#b5efdc',2)}
    }
  },[scene,organ,stage,progress,fractions]);
  return <div className="nx-mesh"><div className="nx-mesh-viewport">
    <canvas ref={canvas} width="420" height="356" aria-label="Rotatable original three-dimensional cutaway model"/>
    <svg viewBox="0 0 420 356" aria-label="Rotate or select anatomy" role="group"
      onPointerDown={e=>{if((e.target as Element).closest('[role=button]'))return;drag.current={x:e.clientX,angle,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}}
      onPointerMove={e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x;if(Math.abs(dx)>3){drag.current.moved=true;setAngle(((Math.round(drag.current.angle+dx*.8)+180)%360+360)%360-180)}}}
      onPointerCancel={()=>{drag.current=null}} onPointerUp={e=>{
        if(!drag.current)return;const {moved}=drag.current;drag.current=null;if(moved)return;
        const svg=e.currentTarget,ctm=svg.getScreenCTM();if(!ctm)return;
        const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse());
        const found=scene.rendered.slice().reverse().find(face=>face.organ&&inside([p.x,p.y],face.points));
        if(found?.organ)onSelect(found.organ);
      }}>
      {organ==='whole'&&labels.map(({organ:id,name,at,x,y})=>{
        const [ax,ay]=scene.project(at),right=x>210;
        return <g key={id} role="button" tabIndex={0} className="nx-plate-link" aria-label={'Inspect '+name}
          onClick={()=>onSelect(id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(id)}}}>
          <rect x={right?x-108:x} y={y-22} width="108" height="31" fill="transparent"/>
          <g className="nx-atlas-leader"><path d={`M${ax} ${ay} L${right?270:148} ${y} H${x}`}/><circle cx={ax} cy={ay} r="2"/><text x={x} y={y-5} textAnchor={right?'end':'start'}>{name}</text></g>
        </g>;
      })}
      {organ==='removal'&&<text x="210" y="330" textAnchor="middle" className="nx-atlas-meter">Removed · {(100*fractions.removed).toFixed(1)}% of dose</text>}
    </svg>
  </div>
    <label className="nx-mesh-controls" htmlFor={rangeId}><span>Rotate model</span><input id={rangeId} type="range" min="-180" max="180" value={angle} onChange={e=>setAngle(Number(e.target.value))}/><output>{angle}°</output></label>
  </div>;
}
