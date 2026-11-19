import React, { useEffect, useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, Tooltip, Legend, type ChartOptions, type Plugin } from 'chart.js';

Chart.register(LineElement, PointElement, LinearScale, Tooltip, Legend);
export type PracticalCurve = {label:string; values:number[]; color:string; dash?:number[]};
type PlotProps = {
  series:PracticalCurve[]; x:number[]; xLabel:string; yLabel:string; selected:number;
  onSelect:(index:number)=>void; concentrationAxis?:boolean; primary?:boolean;
  beforeJump?:Map<number,number[]>;
  timeCaption?:string;
};

const strokes=[[],[8,4],[2,3],[10,3,2,3]];
const cursorPlugin:Plugin<'line'>={
  id:'nexusSelection',
  afterDatasetsDraw(chart) {
    const selection=cursorState.get(chart);
    if(!selection)return;
    const {x:scaleX,y:scaleY}=chart.scales;
    const {top,bottom}=chart.chartArea;
    const px=scaleX.getPixelForValue(selection.x);
    const ctx=chart.ctx;
    ctx.save();
    ctx.strokeStyle='#364e48';ctx.lineWidth=1.4;ctx.setLineDash([4,3]);
    ctx.beginPath();ctx.moveTo(px,top);ctx.lineTo(px,bottom);ctx.stroke();
    ctx.setLineDash([]);
    selection.series.forEach((curve,i)=>{
      const value=curve.values[selection.index];
      if(!chart.isDatasetVisible(i)||!Number.isFinite(value))return;
      const py=scaleY.getPixelForValue(value);
      ctx.fillStyle=curve.color;ctx.strokeStyle='white';ctx.lineWidth=1.15;
      ctx.beginPath();ctx.arc(px,py,4,0,2*Math.PI);ctx.fill();ctx.stroke();
    });
    ctx.restore();
  }
};
const cursorState=new WeakMap<object,{x:number;index:number;series:PracticalCurve[]}>();
const format=(n:number)=>Number(n.toPrecision(4)).toLocaleString('en',{maximumFractionDigits:6});

export default function PracticalPlot({series,x,xLabel,yLabel,selected,onSelect,concentrationAxis=false,primary=false,beforeJump,timeCaption}:PlotProps){
  const chart=useRef<Chart<'line'>|null>(null);
  const selection=Math.max(0,Math.min(x.length-1,selected));
  const latest=useRef({selection,onSelect});
  latest.current={selection,onSelect};
  const ordered=useMemo(()=>{
    const indices=x.map((_,i)=>i);
    if(concentrationAxis) indices.sort((a,b)=>x[a]-x[b]||a-b);
    return indices;
  },[x,concentrationAxis]);
  const data=useMemo(()=>({datasets:series.map((s,k)=>{
    const points:{x:number;y:number}[]=[];
    for(const index of ordered){
      const preceding=beforeJump?.get(index)?.[k];
      if(preceding!==undefined)points.push({x:x[index],y:preceding});
      points.push({x:x[index],y:s.values[index]});
    }
    return {label:s.label,data:points,borderColor:s.color,backgroundColor:s.color,
      order:series.length-k,borderWidth:k===0?2.5:2,borderDash:s.dash??strokes[k%strokes.length],
      pointRadius:0,pointHoverRadius:3,tension:0};
  })}),[series,x,ordered,beforeJump]);
  const options=useMemo<ChartOptions<'line'>>(()=>({
    responsive:true,maintainAspectRatio:false,animation:false,parsing:false,
    interaction:{intersect:false,mode:'nearest',axis:'x'},
    onClick:(event,_elements,chart)=>{
      if(event.x===null||event.y===null||!chart.isPointInArea({x:event.x,y:event.y}))return;
      const target=chart.scales.x.getValueForPixel(event.x);
      if(target===undefined)return;
      // Equal concentrations can occur on both sides of the peak. Stay on
      // the branch nearest the current sample when the x values coincide.
      let best=ordered[0],d=Infinity;
      for(const i of ordered){
        const dist=Math.abs(x[i]-target);
        if(dist<d||(dist===d&&Math.abs(i-latest.current.selection)<Math.abs(best-latest.current.selection))){best=i;d=dist}
        if(x[i]>target&&dist>d)break;
      }
      latest.current.onSelect(best);
    },
    plugins:{
      legend:{position:'bottom',labels:{boxWidth:28,boxHeight:2,color:'#30483f',font:{size:12},padding:12,sort:(a,b)=>(a.datasetIndex??0)-(b.datasetIndex??0)}},
      tooltip:{callbacks:{
        title:items=>items.length?xLabel+' · '+format(items[0].parsed.x??0):'',
        label:item=>item.dataset.label+' · '+format(item.parsed.y??0),
      }},
    },
    scales:{
      x:{type:'linear',min:x[ordered[0]],max:x[ordered[x.length-1]]||1,grid:{color:'#e2e9e3'},ticks:{maxTicksLimit:6},title:{display:true,text:xLabel,color:'#263e34',font:{size:13}}},
      y:{type:'linear',beginAtZero:true,grid:{color:'#e2e9e3'},ticks:{maxTicksLimit:6},title:{display:true,text:yLabel,color:'#263e34',font:{size:13}}},
    }
  }),[x,xLabel,yLabel,ordered]);
  useEffect(()=>{
    const instance=chart.current;
    if(!instance)return;
    cursorState.set(instance,{x:x[selection],index:selection,series});instance.draw();
  },[x,selection,series]);
  return <><div className={primary?'main-chart':'chart-box'}>
    <Line ref={chart} data={data} options={options} plugins={[cursorPlugin]} role="img"
      aria-label={yLabel+' versus '+xLabel+'. Selected '+xLabel+' '+format(x[selection])+'.'}/>
  </div><p className="small-copy nx-selected-sample"><b>{concentrationAxis?'Selected concentration':'Selected time'}</b> · {format(x[selection])} {xLabel.match(/\(([^)]+)\)$/)?.[1]}{timeCaption&&' at '+timeCaption}<br/>
    {series.map(curve=>curve.label+' '+format(curve.values[selection])+' '+(yLabel.match(/\(([^)]+)\)$/)?.[1]??'')).join(' · ')}</p></>;
}
