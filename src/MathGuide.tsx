import React, {useState} from 'react';
import katex from 'katex';
import {Icon} from './Identity';

export type Language='en'|'hi';
interface Equation {tex:string;en:string;hi:string}
const lessons:Record<string,{name:string;unit:string;equations:Equation[]}>={
  body:{name:'Tablet journey',unit:'Amounts in mg · time in hours · all rate constants in h⁻¹',equations:[
    {tex:'\\frac{dA_g}{dt}=-k_a A_g',en:'The absorption site loses a fixed fraction of its remaining amount per hour.',hi:'Har ghante absorption site par bachi dawa ka ek nishchit hissa blood mein jaata hai.'},
    {tex:'\\frac{dA_c}{dt}=k_a A_g-k_{ct} A_c+k_{tc} A_t-k_e A_c',en:'Circulation gains absorbed and returning medicine. It loses medicine to tissue and removal.',hi:'Absorption aur tissue se waapsi circulation mein dawa badhaate hain. Tissue transfer aur removal ise ghataate hain.'},
    {tex:'\\frac{dA_t}{dt}=k_{ct} A_c-k_{tc} A_t',en:'The tissue curve rises while entry exceeds return. At a smooth interior peak the two rates balance.',hi:'Jab tissue mein entry waapsi se zyada hai, curve badhta hai. Andar ke smooth peak par dono rates barabar hote hain.'},
    {tex:'\\frac{dA_r}{dt}=k_e A_c',en:'Cumulative removal counts every milligram that leaves central circulation by elimination.',hi:'Circulation se elimination ke zariye nikli dawa ka total removed amount hai.'},
    {tex:'C_t=\\frac{A_t}{V_t},\\qquad V_t=10\\,\\mathrm L',en:'Divide the tissue amount by the assumed tissue volume to get mg/L.',hi:'Tissue ki dawa ko 10 litre ke maane hue volume se divide karne par mg/L milta hai.'},
    {tex:'E_{\\%}=100\\,\\frac{C_t}{EC_{50}+C_t}',en:'EC50 is the concentration needed for half the maximum modelled effect. Reducing EC50 increases response at a fixed positive concentration.',hi:'EC50 woh concentration hai jis par model ka aadha maximum effect milta hai. Ek hi positive concentration par chhota EC50 response badhaata hai.'}
  ]},
  'pk-iv':{name:'Instant IV dose',unit:'D in mg · V in L · C in ng/mL · t in h',equations:[
    {tex:'\\frac{dC}{dt}=-k_e C,\\qquad C(t)=\\frac{1000D}{V}e^{-k_e t}',en:'The entire dose starts in circulation. Each hour the model removes a fraction of what remains. The factor 1000 converts mg/L to ng/mL.',hi:'Shuru mein poori dose circulation mein hai. Har ghante bachi hui dawa ka ek hissa nikalta hai. 1000 se mg/L ko ng/mL mein badalte hain.'},
    {tex:'t_{1/2}=\\frac{\\ln 2}{k_e}',en:'The elimination half-life is the time needed to halve concentration during exponential decay.',hi:'Exponential decline mein concentration ko aadha hone mein jitna samay lagta hai, woh half-life hai.'}]},
  'pk-oral':{name:'Oral concentration',unit:'A in mg · F is a fraction · C in ng/mL · t in h',equations:[
    {tex:'A_g(0)=D,\\qquad \\frac{dA_g}{dt}=-k_a A_g',en:'An oral dose starts at the absorption site. Its remaining amount falls exponentially.',hi:'Oral dose absorption site par shuru hoti hai. Bachi hui dawa exponential tareeke se kam hoti hai.'},
    {tex:'\\frac{dC}{dt}=\\frac{1000Fk_a A_g}{V}-k_e C',en:'Concentration rises while absorption supplies circulation faster than elimination removes medicine.',hi:'Jab absorption se aane wali dawa removal se zyada ho, concentration badhta hai.'},
    {tex:'t_{1/2,\\,\\mathrm{elimination}}=\\frac{\\ln 2}{k_e}',en:'This is the half-life of elimination. Ongoing absorption also shapes the oral curve.',hi:'Yeh elimination ki half-life hai. Chal raha absorption bhi oral curve ka shape badalta hai.'}]},
  'pd-emax':{name:'Concentration–response',unit:'EC₅₀ and C in matching concentration units · E in model response units',equations:[
    {tex:'E(C)=E_0+E_{\\max}\\frac{C^n}{EC_{50}^{\\,n}+C^n}',en:'At EC50 the added response is half of Emax. The Hill coefficient n changes the steepness.',hi:'EC50 par baseline ke upar ka response Emax ka aadha hai. Hill coefficient n curve ki steepness badalta hai.'}]},
  'ode-comparison':{name:'Euler & RK4',unit:'h is the time step · f gives the instantaneous rate',equations:[
    {tex:'y_{i+1}=y_i+h\\,f(t_i,y_i)',en:'Euler follows the slope at the start of the step. A large step can overshoot the physical range.',hi:'Euler har step ki shuruaat ka slope leta hai. Bada step value ko physical range se baahar le ja sakta hai.'},
    {tex:'y_{i+1}=y_i+\\frac{h}{6}(s_1+2s_2+2s_3+s_4)',en:'RK4 samples the slope at the start, twice at the midpoint, and at the end. Compare both methods with the analytical curve as the step shrinks.',hi:'RK4 shuruaat mein, beech mein do baar, aur ant mein slope leta hai. Step chhota karke dono methods ko exact curve se compare karein.'}]},
  'antibiotic-bacteria':{name:'Antibiotic & bacteria',unit:'t in hours · B and C in illustrative relative units',equations:[
    {tex:'\\frac{dB}{dt}=rB\\left(1-\\frac{B}{K}\\right)-k_{\\max}\\frac{C}{EC_{50}+C}B',en:'Growth slows toward the population limit K. After the chosen start, the example drug level adds a loss term.',hi:'Population limit K ke paas growth dheemi hoti hai. Chune hue start ke baad example drug level ek loss term jodta hai.'},
    {tex:'C(t)=C_s e^{-k_e(t-t_s)}\\quad(t\\geq t_s)',en:'The level is zero before the chosen start time and decays after the illustrative treatment begins.',hi:'Chune hue start time se pehle level zero hai. Uske baad model mein level dheere dheere ghatta hai.'}]},
  sir:{name:'SIR population',unit:'S, I and R in people · t in days',equations:[
    {tex:'\\frac{dS}{dt}=-\\beta SI/N,\\quad \\frac{dI}{dt}=\\beta SI/N-\\gamma I,\\quad \\frac{dR}{dt}=\\gamma I',en:'People move from susceptible to infectious to recovered in a closed population.',hi:'Band population mein log susceptible se infectious aur phir recovered group mein jaate hain.'}]},
  logistic:{name:'Logistic growth',unit:'x and K in population units',equations:[
    {tex:'\\frac{dx}{dt}=rx\\left(1-\\frac{x}{K}\\right)',en:'Growth slows as the population approaches the carrying capacity.',hi:'Population carrying capacity K ke paas pahunchti hai toh growth dheemi hoti hai.'}]}
};
export function EquationNotes({id,language}:{id:string;language:Language}){
 const lesson=lessons[id]??lessons.body;
 return <div className="nx-equations"><p className="nx-units">{lesson.unit}</p>{lesson.equations.map(q=><section key={q.tex}><div className="nx-formula" dangerouslySetInnerHTML={{__html:katex.renderToString(q.tex,{displayMode:true,throwOnError:true,output:'htmlAndMathml'})}}/><p>{q[language]}</p></section>)}</div>;
}
export default function MathGuide({language,openModel}:{language:Language;openModel:(id:string)=>void}){
 const [id,setId]=useState('body');
 return <div className="nx-doc"><header className="nx-doc-head"><span className="nx-kicker"><i/> Equation lab</span><h1>Explore the maths</h1><p>Read the equation, inspect its units, then open the practical to see what changes.</p></header><div className="nx-doc-layout"><aside className="nx-doc-menu" aria-label="Choose an equation">{Object.entries(lessons).map(([key,l])=><button key={key} aria-pressed={key===id} onClick={()=>setId(key)}>{l.name}<Icon name="arrow" size={15}/></button>)}</aside><article className="nx-paper"><h2>{lessons[id].name}</h2><EquationNotes id={id} language={language}/>{id==='body'?<a href="#body" className="nx-button">Follow a tablet <Icon name="arrow" size={16}/></a>:<button className="nx-button" onClick={()=>openModel(id)}>Open practical <Icon name="arrow" size={16}/></button>}</article></div></div>;
}
