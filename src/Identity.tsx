import React from 'react';

export type IconName = 'arrow' | 'external' | 'play' | 'pause' | 'book' | 'globe' | 'cap' | 'clock' | 'compass' | 'layers' | 'pulse' | 'drop' | 'target' | 'microbe' | 'close' | 'menu' | 'chart' | 'chevron';
const icons: Record<IconName, React.ReactNode> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>,
  external: <path d="M5 19 18 6M6 6h12v12"/>,
  play: <path d="m8 4 12 8-12 8z"/>,
  pause: <path d="M8 4v16m8-16v16"/>,
  book: <><path d="M12 6c-3-3-7-3-10-2v14c4-1 7 0 10 2 3-2 6-3 10-2V4c-4-1-7-1-10 2Zm0 0v14"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
  cap: <><path d="m2 9 10-5 10 5-10 5zM6 11v5q6 5 12 0v-5M22 9v7"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  compass:<><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/></>,
  layers:<path d="m2 8 10-5 10 5-10 5zM2 12l10 5 10-5M2 16l10 5 10-5"/>,
  pulse:<path d="M2 12h5l3-8 4 15 3-7h5"/>,
  drop:<path d="M12 2C10 6 4 11 4 15a8 8 0 0 0 16 0c0-4-6-9-8-13Z"/>,
  target:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  microbe:<><rect x="4" y="7" width="16" height="10" rx="5" transform="rotate(-35 12 12)"/><path d="m6 4 2 3m4-6 1 3m8 4-3 1M3 14l-2 1m6 3 1 3m6-6 2 3"/><circle cx="13" cy="10" r="1"/></>,
  close:<path d="m5 5 14 14M19 5 5 19"/>,menu:<path d="M3 6h18M3 12h18M3 18h18"/>,
  chart:<path d="M3 3v18h18M6 16c3-1 4-11 7-10 3 0 3 7 8 8"/>,chevron:<path d="m7 10 5 5 5-5"/>
};
export function Icon({name,size=20}:{name:IconName;size?:number}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}
export function Logo(){return <a href="#home" className="nx-brand" aria-label="Nexus overview"><img src="./nexus.svg" width="42" height="42" alt=""/><strong>Nexus</strong></a>}
export const team=['Susheel Prajapati','Suraj Prajapati','Prashil Verma','Nikhil Sharma'];
export const projectTitle='Mathematical Modelling of Drug Concentration and Response Using ODEs and PK–PD Models';
