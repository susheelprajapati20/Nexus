import React, { useId } from 'react';
import { Tablet } from './AtlasBody';
import type { AnatomyProps } from './Anatomy';

const mint = '#a4e7d5';
const gold = '#ffd98f';
const coral = '#e09d85';
const tints = ['#b87569','#df9e83','#ca8877','#e6b596'];
type Point = [number,number];

function Leader({ from, via, to, label, end = false }: {from:Point;via:Point;to:Point;label:string;end?:boolean}) {
  return <g className="nx-atlas-leader"><path d={`M${from} L${via} L${to}`}/><circle cx={from[0]} cy={from[1]} r="2"/><text x={to[0]+(end?0:1)} y={to[1]-6} textAnchor={end?'end':'start'}>{label}</text></g>;
}
export { Leader };

function Dissolved({x,y,r=2.6}:{x:number;y:number;r?:number}) {
  return <circle cx={x} cy={y} r={r} fill={mint} stroke="#305b57" strokeWidth=".65"/>;
}
function Fragment({x,y,angle}:{x:number;y:number;angle:number}) {
  return <path transform={`translate(${x} ${y}) rotate(${angle})`} d="M-3-3 4-2 2 3-4 2Z" fill={gold} stroke="#ae8356" strokeWidth=".7"/>;
}
function position(path:Point[], fraction:number):Point {
  const t=Math.max(0,Math.min(.99999,fraction))*(path.length-1), i=Math.floor(t), f=t-i;
  return [path[i][0]+(path[i+1][0]-path[i][0])*f,path[i][1]+(path[i+1][1]-path[i][1])*f];
}
function Tracers({path,phase,count=6}:{path:Point[];phase:number;count?:number}) {
  return <>{Array.from({length:count},(_,i)=>{const [x,y]=position(path,(phase+i/count)%1);return <Dissolved key={i} x={x} y={y}/>})}</>;
}
const oralRoute:Point[]=[[147,110],[157,108],[171,108],[186,111],[195,126],[200,155],[204,184],[206,214],[210,248]];
function Mouth({stage,progress:p}:AnatomyProps){
  const active=stage==='swallow', tablet=stage==='placed'||active;
  const [x,y]=position(oralRoute,active?p:0);
  return <>
    <path d="M257 22 Q225 7 192 16 C157 25 150 49 146 66 L130 87 Q128 91 139 93 L137 102 L125 109 Q123 113 131 116 L127 121 Q129 126 139 128 C139 142 149 149 165 149 Q181 151 180 178 L173 239 Q207 260 265 247 Q249 219 254 178 L272 101 Q284 50 257 22Z" fill="#83a799" stroke="#c2d2b7" strokeWidth="2"/>
    <path d="M151 80 C158 66 170 63 187 65 Q212 63 223 78 Q213 83 208 96 L201 110 Q183 92 158 96 L140 99Z" fill="#c9a98b" stroke="#715d54" strokeWidth="1.4"/>
    <path d="M149 84Q169 72 189 78Q197 80 207 76m-57 13q21-7 46-3" fill="none" stroke="#987867" strokeWidth="2.5"/>
    <path d="M132 107Q158 99 181 99Q201 100 203 116 Q212 153 213 180 L221 245 L204 246 L196 187Q193 149 183 128Q170 117 135 120Z" fill="#c08778" stroke="#5d5d56" strokeWidth="1.5"/>
    <path d="M132 111Q158 104 181 104Q199 106 200 120Q207 154 207 183L212 245" fill="none" stroke="#604b49" strokeWidth="7"/>
    <path d="M137 116 C151 112 169 109 182 117 Q191 122 188 127 Q168 129 140 122Z" fill="#dfa38e" stroke="#946862" strokeWidth="1.3"/>
    <path d="M182 140Q178 129 178 127Q187 128 193 144L192 180L188 243L172 242L178 175Z" fill="#75aba4" stroke="#b5d4c6" strokeWidth="1.4"/>
    <path d="M179 151L188 152L183 240L176 239Z" fill="#517f7e"/>
    {Array.from({length:11},(_,i)=><path key={i} d={`M176 ${151+i*8}q6 4 14 1`} fill="none" stroke="#b7ccba" strokeWidth="2.3"/>)}
    <path d="M220 84Q234 88 236 101Q231 163 241 224" fill="none" stroke="#5c8277" strokeWidth="7"/>
    {Array.from({length:11},(_,i)=><path key={i} d={`M226 ${96+i*12}l12 2 2 7-13-1Z`} fill="#acbba0" stroke="#65857a"/>)}
    {active&&<>{p<.25&&<g opacity={1-p*4}><path d="M85 102Q105 94 122 105Q135 111 149 109" fill="none" stroke="#93d4df" strokeWidth="3.5"/>
      <path d="M58 87l13 27 22-7-2-28Z" fill="#8fceda33" stroke="#b9e0df" strokeWidth="1.5"/><path d="M63 96l9 15 18-6-.3-11Z" fill="#9bd5de"/></g>}
      <path d={`M${x-11} ${y-4} q9 4 16 1`} fill="none" stroke="#b4e8f1" strokeWidth="4"/><path d={`M${x-8} ${y+3}q7 6 15-1`} stroke="#96cfce" strokeWidth="2.8" fill="none"/>
      {Array.from({length:6},(_,i)=>{const [wx,wy]=position(oralRoute,Math.max(0,p-.012*i));return <circle key={i} cx={wx-2+(i%2)*3} cy={wy-3} r="3" fill="#8fd0de" opacity=".85"/>})}</>}
    {tablet&&<Tablet x={x} y={y} size={.85}/>}
    <Leader from={[181,186]} via={[133,192]} to={[43,192]} label="Airway"/>
    <Leader from={[208,170]} via={[280,151]} to={[400,151]} end label="Oesophagus"/>
    <Leader from={[181,119]} via={[259,80]} to={[401,80]} end label="Tongue"/>
  </>;
}

const stomachShape='M209 22 L222 22 C222 42 218 65 230 69 C240 71 247 47 273 48 C317 49 330 87 325 126 C318 178 276 216 220 215 Q185 214 164 194 Q150 181 139 196 L128 213 L111 202 Q123 180 133 172 C151 158 168 164 186 173 Q202 181 215 166 C230 148 224 133 216 121 C207 108 205 95 207 78 Z';
function Stomach({stage,progress:p}:AnatomyProps) {
  const clip=useId().replace(/:/g,'')+'lumen', active=stage==='stomach';
  return <>
    <defs><clipPath id={clip}><path d={stomachShape}/></clipPath></defs>
    <path d={stomachShape} fill="#c88778" stroke="#efb69b" strokeWidth="4"/>
    <g clipPath={`url(#${clip})`}>
      <path d="M95 138Q142 128 191 138T272 139T340 127V249H95Z" fill="#698e87" opacity=".8"/>
      <path d="M100 138Q144 128 191 138T272 139T340 127" stroke="#bed2b8" strokeWidth="2" fill="none"/>
      {Array.from({length:6},(_,i)=><path key={i} d={`M${252+i*9} ${65+i*1.2} C${306+i*4} ${60+i*13} ${298+i*5} ${173+i*4} ${222+i*4} ${194+i*2} Q${197+i*3} ${198+i*2} 179 ${181+i*3}`} fill="none" stroke="#895f58" strokeWidth="1.45" opacity=".8"/>)}
      {active&&p<.32&&<Tablet x={260+p*10} y={110+p*105} size={1.55}/>}
      {active&&p>=.32&&Array.from({length:Math.ceil((1-p)*12)},(_,i)=><Fragment key={i} x={248+(i%4)*8+8*p} y={147+Math.floor(i/4)*7+p*9} angle={33*i}/>)}
      {active&&Array.from({length:Math.floor(Math.max(0,(p-.33))*50)},(_,i)=><Dissolved key={i} x={247+Math.cos(i*2.4)*(8+i*.9)} y={153+Math.sin(i*2.4)*(5+i*.65)+p*4}/>)}
    </g>
    <Leader from={[305,87]} via={[345,60]} to={[414,60]} end label="Stomach wall"/>
    <Leader from={[241,151]} via={[161,125]} to={[40,125]} label="Gastric fluid"/>
    <Leader from={[123,198]} via={[99,232]} to={[43,232]} label="To intestine"/>
  </>;
}
const villus='M100 236 C132 238 141 230 143 207 C146 173 151 137 164 100 C180 50 194 28 215 26 C243 23 260 65 267 110 C276 154 275 186 282 210 Q288 236 322 235 L323 252 L98 252Z';
function Intestine({stage,progress:p}:AnatomyProps) {
  const active=stage==='intestine';
  return <>
    <path d={villus} fill="#c2937b" stroke="#f4c2a0" strokeWidth="3"/>
    <path d="M148 236 Q156 173 172 113 Q190 47 215 42 Q240 44 253 110 Q262 169 269 232Z" fill="#d4af91"/>
    <path d="M196 250 C206 195 198 146 211 93 Q219 71 222 102 C223 158 224 203 231 251" stroke="#8a9f79" strokeWidth="10" fill="none"/>
    <path d="M152 247Q167 190 177 129Q189 62 212 57Q240 49 250 129Q263 206 278 247" stroke="#95685f" strokeWidth="10" fill="none"/>
    <path d="M152 247Q167 190 177 129Q189 62 212 57" fill="none" stroke="#db8b78" strokeWidth="6"/>
    <path d="M212 57Q240 49 250 129Q263 206 278 247" fill="none" stroke="#75a9a3" strokeWidth="6"/>
    {[0,1,2,3,4,5].map(i=><path key={i} d={`M${187-i*3.2} ${84+i*22} Q${210+i*2} ${69+i*24} ${239+i*4.2} ${93+i*22}`} stroke={i%2?'#a9816e':'#9aa396'} strokeWidth="2.6" fill="none"/>)}
    {Array.from({length:17},(_,i)=>{const q=i/16, y=220-q*181,x=145+Math.pow(q,1.58)*56;return <g key={i}>
      <ellipse cx={x+6} cy={y} rx="5.7" ry="6.7" transform={`rotate(${q*30} ${x+6} ${y})`} fill={tints[i%4]} stroke="#bb846c"/>
      <path d={`M${x-1} ${y}l-5-2m5 5-6-1`} stroke="#eabda1" strokeWidth="1.6"/>
      <ellipse cx={277-(x-145)*.85-5} cy={y} rx="5.4" ry="6.5" fill={tints[(i+1)%4]} stroke="#b3806b"/>
    </g>})}
    {active&&<><Tracers count={9} phase={p*.82} path={[[88,152],[113,145],[142,140],[160,133],[178,128],[187,101],[203,69],[225,62],[242,101],[249,132],[261,199],[272,239]]}/>
      <path d="M109 151l41-14m-9-1 9 1-5 7" fill="none" stroke={mint} strokeWidth="2"/></>}
    <Leader from={[183,62]} via={[146,48]} to={[41,48]} label="Villus lining"/>
    <Leader from={[248,126]} via={[298,96]} to={[403,96]} label="Capillary" end/>
    <Leader from={[98,170]} via={[82,191]} to={[39,191]} label="Gut lumen"/>
  </>;
}

function Liver({stage,progress:p}:AnatomyProps) {
  const portal:Point[]=[[114,244],[146,226],[161,206],[185,190],[202,166],[214,143],[218,121],[229,113],[253,97],[275,83],[293,57],[304,29]];
  return <>
    <g fill="none" stroke="#a17e69" strokeWidth="8">{[0,1,2].map(i=><path key={i} d={`M82 ${222+i*9}q8-16 25-9t24-2t19 6t-20 12q-12 5-20 0t-22 2`}/>)}</g>
    <path d="M266 175Q288 131 287 100L305 27" fill="none" stroke="#80aca1" strokeWidth="12"/>
    <path d="M118 92 Q145 57 194 53 Q234 50 274 66 Q293 72 313 71 Q324 74 310 92 Q294 111 261 120 Q233 125 219 143 Q197 165 176 166 Q130 161 115 143 Q104 123 118 92Z" fill="#bc846c" stroke="#efbea0" strokeWidth="2.5"/>
    <path d="M234 56Q234 80 220 104Q214 122 205 143 M123 121Q142 137 175 139" fill="none" stroke="#865c52" strokeWidth="2.4"/>
    {Array.from({length:8},(_,i)=><path key={i} d={`M${128+i*9} ${89-i*1.8}q17-12 30-13`} fill="none" stroke="#d8a486" opacity=".75"/>)}
    <path d="M112 243Q153 233 161 206Q198 186 210 150Q222 125 215 117 Q202 100 169 95m45 26q20-15 49-22" fill="none" stroke="#537f79" strokeWidth="9"/>
    <path d="M112 243Q153 233 161 206Q198 186 210 150Q222 125 215 117 Q202 100 169 95m45 26q20-15 49-22" fill="none" stroke="#8cbcb1" strokeWidth="4.5"/>
    <path d="M169 95l-16-9m21 10-3-18m88 22 13-11m-58 33-25 6m22 24-16 10m51-44 5-12" fill="none" stroke="#89b1a5" strokeWidth="2.3"/>
    <path d="M184 88Q223 107 242 97 Q282 87 292 61" stroke="#b9d1bc" strokeWidth="4" fill="none"/>
    {stage==='liver'&&<Tracers phase={p} path={portal} count={9}/>}
    <Leader from={[288,70]} via={[323,49]} to={[414,49]} end label="To circulation"/>
    <Leader from={[190,182]} via={[256,196]} to={[407,196]} end label="Portal vein"/>
    <Leader from={[154,95]} via={[124,69]} to={[38,69]} label="Liver"/>
  </>;
}

function Tissue({fractions:f,progress:p,stage}:AnatomyProps) {
  const centralCount=Math.min(16,Math.round(f.central*34)),tissueCount=Math.min(26,Math.round(f.tissue*60));
  return <>
    <path d="M49 69Q129 39 220 68T404 65L408 111Q322 145 220 114T53 117Z" fill="#ca867b" stroke="#efb5a2" strokeWidth="2.5"/>
    <path d="M52 83Q132 52 221 82T405 80L407 95Q321 129 220 99T53 102Z" fill="#925d5b"/>
    {[0,1,2,3].map(i=><ellipse key={i} cx={89+i*83} cy={[81,82,103,97][i]} rx="11" ry="4.4" transform={`rotate(${i%2?12:-11} ${89+i*83} ${[81,82,103,97][i]})`} fill="#e8ab93" stroke="#ac7365"/>)}
    {Array.from({length:13},(_,i)=>{const x=82+(i%6)*49+(i>=6?12:0),y=170+Math.floor(i/6)*34+Math.sin(i*2)*5;return <g transform={`translate(${x} ${y}) rotate(${i%3*7-8})`} key={i}><path d="M-22 0Q-20-14-7-16Q10-20 19-7Q30 5 14 14Q-3 20-17 13Z" fill={['#849e88','#96a98f','#779b89'][i%3]} stroke="#c1c9a8" strokeWidth="1.2"/><ellipse cx="2" cy="-1" rx="8" ry="4.6" fill="#678c7c"/><path d="M-13 3q-4-5 0-9m23 12 4-3" fill="none" stroke="#c2c3a3" strokeWidth=".8"/></g>})}
    <path d="M146 113C139 133 147 143 156 153m-9-3 9 3-1-9m124 13c11-10 14-21 9-32m-4 8 4-8 7 5" fill="none" stroke={mint} strokeWidth="2.4"/>
    <Tracers path={[[62,92],[131,76],[206,88],[277,106],[366,94],[399,90]]} phase={stage==='tissue'?p:0} count={centralCount}/>
    {Array.from({length:tissueCount},(_,i)=><Dissolved key={i} x={79+(i*43)%277} y={169+(i*13)%66} r={2.7}/>)}
    <Leader from={[181,77]} via={[152,42]} to={[42,42]} label="Circulation"/>
    <Leader from={[350,202]} via={[365,222]} to={[411,222]} end label="Tissue"/>
    <g className="nx-atlas-microtext"><text x="96" y="144">Entry</text><text x="301" y="148">Return</text></g>
  </>;
}
function Removal({fractions:f}:AnatomyProps) {
  const fraction=Math.max(0,Math.min(1,f.removed));
  return <>
    <path d="M47 100Q95 67 178 92T292 93L291 137Q225 158 173 135T47 145Z" fill="#a98279" stroke="#e8b19a" strokeWidth="2.2"/>
    <path d="M48 114Q97 83 178 107T291 108L291 123Q231 147 173 120T47 130Z" fill="#795956"/>
    <Tracers path={[[59,118],[100,103],[154,106],[206,121],[272,120]]} phase={0} count={Math.ceil(f.central*28)}/>
    <path d="M245 130 Q240 157 264 166L292 175m-8-9 8 9-11 4" fill="none" stroke={mint} strokeWidth="2.6"/>
    <rect x="303" y="88" width="61" height="107" rx="5" fill="#2c504b" stroke="#92b6a2" strokeWidth="1.5"/>
    <rect x="308" y={189-fraction*95} width="51" height={fraction*95} rx="2" fill="#80b8a3"/>
    {[0,1,2,3,4].map(i=><path key={i} d={`M351 ${94+i*23}h8`} stroke="#c9d6c4"/>)}
    <Leader from={[138,99]} via={[124,62]} to={[39,62]} label="Central amount"/>
    <Leader from={[334,190]} via={[303,224]} to={[134,224]} label="Cumulative removal"/>
    <text className="nx-atlas-meter" x="333" y="73" textAnchor="middle">{(fraction*100).toFixed(1)}%</text>
  </>;
}
export default function OrganSections(props:AnatomyProps) {
  switch(props.organ){
    case 'mouth':return <Mouth {...props}/>;
    case 'stomach':return <Stomach {...props}/>;
    case 'intestine':return <Intestine {...props}/>;
    case 'liver':return <Liver {...props}/>;
    case 'tissue':return <Tissue {...props}/>;
    case 'removal':return <Removal {...props}/>;
    default:return null;
  }
}
