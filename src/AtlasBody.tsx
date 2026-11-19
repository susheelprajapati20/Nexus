import React, { useId } from 'react';

// Original front-facing anatomical plate. Coordinates are shared with the
// selectable atlas and the close-up locator, so landmarks stay aligned.
const torsoHalf = 'M220 70 C213 70 210 68 208 65 L207 73 C202 79 183 80 173 87 C160 94 160 109 157 121 L149 151 Q148 162 142 173 L131 213 Q127 219 126 229 L126 239 Q127 242 129 236 L132 226 L131 241 Q132 245 134 238 L137 226 L136 239 Q137 241 139 237 L143 220 Q148 214 146 209 L159 181 Q166 171 167 159 L176 135 Q177 152 181 162 C183 175 176 188 178 207 Q180 221 182 229 L201 242 L220 230';
const legHalf = 'M182 208 C177 227 180 247 186 264 Q195 294 194 310 C191 324 190 339 195 359 L198 395 Q199 404 195 412 L189 423 Q186 430 194 429 L205 428 Q212 427 211 422 L209 413 Q209 401 210 396 L214 361 Q220 331 214 315 L216 277 Q218 251 220 233 L220 213 Z';
const arteries = [
  'M223 52 Q220 60 221 78 Q215 102 222 119 Q225 134 222 153 L221 200 Q220 214 219 222',
  'M219 79 Q204 85 187 88 Q176 91 170 110 L158 152 Q160 161 149 181 L138 215',
  'M222 78 Q236 83 252 88 Q264 96 270 117 L282 155 Q284 166 293 184 L304 218',
  'M220 220 Q203 229 200 250 Q197 269 204 294 L202 325 Q196 349 203 370 L203 409',
  'M220 220 Q238 228 240 249 Q244 270 236 294 L237 325 Q245 344 238 371 L237 409',
  'M219 143 C207 137 196 139 188 146 M224 157 Q238 151 247 153',
];
const branches = [
  'M168 117q-5-6-6-13m4 23 8-15m-15 41-7-9m1 26 9-9m-18 29-6 5m-1 11-4 6',
  'M184 90q-3 9-6 14m15-20-4 13m-23 60 5-8m-27 51-6 9',
  'M212 74l-4-17m2 23-10-7m4 159-14 15m10 5-10 11m11-2 7 13m-7 4-6 10m9 13-8 13m7 5 5 12m-8 5-5 14m8 7 5 9m-5 15-4 10m3 8-5 9',
  'M202 230q-5-4-10-4m13 13 4 13m-10 11-6 6m10 18 6 5m-7 31-6 8m4 22 6 12m-4 18 4 7',
];
const muscles = [
  'M170 91 Q160 105 162 123 Q174 114 177 103 M161 126 Q154 139 156 153 Q166 147 171 123',
  'M152 169 Q143 185 137 211 M149 177 Q147 193 141 208 M140 217 L132 232',
  'M185 222 Q181 245 195 277 Q199 288 196 298 M187 233 Q203 250 206 288 M211 245 Q214 266 207 304 M197 307 Q202 301 210 310',
  'M195 325 Q192 342 201 361 M205 326 Q212 339 203 367 L204 395 M199 404 Q202 412 195 422',
  'M197 85 Q204 90 214 88 M184 155 Q190 162 196 164 M183 192 Q191 199 198 202',
];
const bowel = [
  'M204 175 C195 175 192 178 197 182 C202 186 209 182 215 182 S229 184 227 187 C225 190 212 185 205 188 S198 193 204 195',
  'M215 174 C223 173 235 174 237 178 S225 180 225 182 S239 184 239 190 C239 195 228 191 224 195 S235 199 229 202',
  'M210 178 C217 176 222 180 218 182 M201 197 C204 202 220 192 222 197 S209 203 207 205 C205 209 216 210 222 206',
  'M199 184 C190 188 192 194 197 198 M233 194 C243 199 232 206 225 208',
];
const kidneys = 'M193 160 C183 159 184 177 192 179 C196 180 200 174 196 171 Q192 168 197 166 Q200 163 193 160Z';

function Tablet({ x, y, size = 1 }: { x:number; y:number; size?:number }) {
  return <g transform={`translate(${x} ${y}) rotate(-22) scale(${size})`}>
    <rect x="-8" y="-4" width="16" height="8" rx="4" fill="#fff0c7" stroke="#e9b866" strokeWidth="1.2"/>
    <path d="M0 -3v6" stroke="#957345" strokeWidth="1.1"/>
  </g>;
}
export { Tablet };

export function AtlasBody({ tablet, central = 0, tissue = 0 }:{ tablet?:{x:number;y:number};central?:number;tissue?:number }) {
  const id = useId().replace(/:/g, '');
  const pigment = (name:string) => 'url(#' + id + name + ')';
  return <g strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id={id+'skin'} x1="0" x2="1" y1=".1" y2=".8" gradientUnits="objectBoundingBox">
        <stop stopColor="#c5d5c4"/><stop offset=".20" stopColor="#8baea3"/><stop offset=".52" stopColor="#6c9891"/><stop offset=".83" stopColor="#3f726e"/><stop offset="1" stopColor="#94b3a6"/>
      </linearGradient>
      <linearGradient id={id+'glaze'} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f8c7a1"/><stop offset=".4" stopColor="#cf8c73"/><stop offset="1" stopColor="#9b5d59"/></linearGradient>
      <linearGradient id={id+'lung'} x1="0" x2="1" y1="0" y2=".9"><stop stopColor="#b4c0a9"/><stop offset=".55" stopColor="#80a59c"/><stop offset="1" stopColor="#527d7a"/></linearGradient>
      <linearGradient id={id+'liver'} x1="0" x2=".85" y1="0" y2="1"><stop stopColor="#d9a179"/><stop offset=".45" stopColor="#bd8065"/><stop offset="1" stopColor="#785856"/></linearGradient>
      <linearGradient id={id+'heart'} x1="0" x2=".8" y1="0" y2="1"><stop stopColor="#eea58a"/><stop offset=".5" stopColor="#bf756c"/><stop offset="1" stopColor="#864e53"/></linearGradient>
      <pattern id={id+'etch'} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(23)"><path d="M0 0v4" stroke="#d8e6cf" strokeWidth=".55" opacity=".5"/></pattern>
      <radialGradient id={id+'head'} cx="38%" cy="29%" r="80%"><stop stopColor="#bdcdb6"/><stop offset=".45" stopColor="#96b4a5"/><stop offset=".8" stopColor="#628d83"/><stop offset="1" stopColor="#486f69"/></radialGradient>
    </defs>
    {[false,true].map(mirror=><g key={String(mirror)} transform={mirror?'translate(440 0) scale(-1 1)':undefined}>
      <path d={legHalf} fill={pigment('skin')} stroke="#aac6b5" strokeWidth=".9"/><path d={legHalf} fill={pigment('etch')} opacity=".43"/>
      <path d={torsoHalf} fill={pigment('skin')} stroke="#b6d1be" strokeWidth=".9"/><path d={torsoHalf} fill={pigment('etch')} opacity=".38"/>
      <g fill="none" stroke="#476e67" strokeWidth="1.1" opacity=".65">{muscles.map(d=><path key={d} d={d}/>)}</g>
      <g fill="none" stroke="#d5dec6" strokeWidth=".65" opacity=".7"><path d="M166 109q-5 12-6 21m-8 41-12 31m48 44q2 15 8 27m9 59-4 31"/><path d="M189 86Q203 78 215 86 M209 69l7 13"/></g>
    </g>)}
    <path d="M220 80 C196 78 176 91 179 114 L181 150 Q184 165 184 181 L181 202 Q191 221 207 223 Q226 231 246 215 L257 202 Q254 187 254 170 L257 144 Q266 109 253 94 Q242 84 220 80Z" fill="#416d67" opacity=".73"/>
    <g fill="none" stroke="#8bbeb0" strokeWidth="2.1" opacity=".85">
      {arteries.map(d=><path key={d} d={d} transform="translate(2.4 -.3)"/>)}
    </g>
    <g fill="none" stroke="#bd7971" strokeWidth={1.8+central*.75}>{arteries.map(d=><path key={d} d={d}/>)}</g>
    {[false,true].map(mirror=><g key={String(mirror)} transform={mirror?'translate(440 0) scale(-1 1)':undefined}>
      <g fill="none" stroke="#416e73" strokeWidth=".85" opacity=".94">{branches.map(d=><path key={d} d={d} transform="translate(1.1 .8)"/>)}</g>
      <g fill="none" stroke="#b5736d" strokeWidth=".65">{branches.map(d=><path key={d} d={d}/>)}</g>
    </g>)}
    <path d="M215 82Q205 80 193 93 Q182 104 181 123 Q178 140 184 146 Q194 140 209 142 Q219 134 215 120 Q218 102 215 82Z" fill={pigment('lung')} stroke="#b9c7ab" strokeWidth=".9"/>
    <path d="M225 83Q236 79 249 96 Q260 110 258 138 Q258 148 251 144 Q243 139 235 140 Q230 138 232 131 Q235 124 227 119 Q223 98 225 83Z" fill={pigment('lung')} stroke="#b9c7ab" strokeWidth=".9"/>
    {[false,true].map(mirror=><g key={String(mirror)} fill="none" transform={mirror?'translate(440 0) scale(-1 1)':undefined}>
      <path d="M218 91q-4 11-17 20t-10 25m14-28 2-12m-8 19-11-4m7 10 6 6m-7 2-8 1m28-31-1-9" stroke="#426c68" strokeWidth="2.2"/>
      <path d="M218 91q-4 11-17 20t-10 25m14-28 2-12m-8 19-11-4m7 10 6 6m-7 2-8 1" stroke="#b7c8b2" strokeWidth="1"/>
      {Array.from({length:7},(_,i)=><path key={i} d={`M214 ${90+i*6.5} Q199 ${89+i*6.6} 185 ${103+i*5.9}`} stroke="#d7dbc1" strokeWidth="1.35" opacity=".33"/>)}
    </g>)}
    <path d="M215 66q4 11 3 25l-11 15m11-15 12 13" stroke="#466b67" fill="none" strokeWidth="5"/>
    <path d="M215 66q4 11 3 25l-11 15m11-15 12 13" stroke="#b7bca4" fill="none" strokeWidth="3.3" strokeDasharray="1.5 1.1"/>
    <path d="M221 50Q225 64 222 80Q225 113 225 132L236 148" fill="none" stroke="#815c54" strokeWidth="4.5"/>
    <path d="M221 50Q225 64 222 80Q225 113 225 132L236 148" fill="none" stroke="#d2a68a" strokeWidth="2"/>
    <path d="M219 111 Q216 108 216 103L219 103L221 108Q225 105 227 110Q233 108 236 115Q242 127 232 140Q229 143 221 133Q210 125 211 119Q211 114 219 111Z" fill={pigment('heart')} stroke="#d2a58c" strokeWidth=".8"/>
    <path d="M223 112q-3-10 0-13q6-4 7 7m-8-5-4-3m9 1 2-5" fill="none" stroke="#c48e7c" strokeWidth="2.8"/>
    <path d="M230 114q3 9-1 21m2-12-8-4m7 6 4 4" stroke="#e2b397" strokeWidth=".9" fill="none"/>
    <path d={kidneys} fill="#ac7569" stroke="#d0a590"/><path d={kidneys} transform="translate(440 3) scale(-1 1)" fill="#ac7569" stroke="#d0a590"/>
    <path d="M193 174q4 11 15 25l6 12m30-38q-4 16-17 33" fill="none" stroke="#ccbc87" strokeWidth="1.2"/>
    <path d="M233 140 Q243 133 250 142 Q256 153 247 163 Q239 172 224 165 Q218 162 214 169 L209 166Q214 154 227 158 Q236 156 233 148Z" fill={pigment('glaze')} stroke="#efc4a3"/>
    <path d="M236 145q16-4 12 7t-20 9m9-11q9-2 8 3t-10 6" fill="none" stroke="#935f56" strokeWidth=".8"/>
    <path d="M181 146 Q187 134 205 135 Q219 135 233 140 Q235 144 225 149 Q212 152 205 161 Q199 164 182 161 Q177 158 181 146Z" fill={pigment('liver')} stroke="#ebbb93" strokeWidth="1"/>
    <path d="M212 138q0 7-6 16m-3-11-11 10" fill="none" stroke="#8a5e57" strokeWidth="1.2"/>
    <path d="M210 154q0 8-6 10q-3 0-2-3l5-7" fill="#99b079"/>
    <path d="M219 182Q219 168 210 154L199 148m11 6 7-9m-3 16 16 4" stroke="#72aaa1" strokeWidth="2.3" fill="none"/>
    <path d="M194 202 C188 193 188 177 192 173 Q197 169 204 172 Q219 174 232 169 C244 165 250 170 248 180 L244 198 Q245 207 235 211 Q219 213 221 222" fill="none" stroke="#876b5d" strokeWidth="7"/>
    <path d="M194 202 C188 193 188 177 192 173 Q197 169 204 172 Q219 174 232 169 C244 165 250 170 248 180 L244 198 Q245 207 235 211 Q219 213 221 222" fill="none" stroke="#ccb094" strokeWidth="5.5" strokeDasharray="3.5 1"/>
    {bowel.map(d=><path key={d} d={d} stroke="#8c6c5c" strokeWidth="5" fill="none"/>)}
    {bowel.map(d=><path key={d} d={d} stroke="#d6ab88" strokeWidth="3.8" fill="none"/>)}
    {bowel.map(d=><path key={d} d={d} stroke="#f0cfab" strokeWidth="1" fill="none" transform="translate(0 -.8)"/>)}
    <g>
      <path d="M206 47q2 13-1 23q9 12 18 12q8-3 12-8q-4-13-1-26Z" fill={pigment('skin')} stroke="#9cb5a6" strokeWidth=".7"/>
      <path d="M208 54q2 14 12 23m12-23q-4 12-9 21m-9-14q5 3 10 1" stroke="#567c72" fill="none"/>
      <path d="M200 29Q201 11 218 10Q237 8 240 27L238 43Q235 55 227 61Q221 67 215 62Q204 57 201 45Z" fill={pigment('head')} stroke="#c1d0ba" strokeWidth="1"/>
      <path d="M200 33q-5-5-3 4q1 7 5 7m37-11q5-5 4 3q-2 9-5 8" fill={pigment('head')} stroke="#aac2ae" strokeWidth=".7"/>
      <path d="M201 30Q197 11 212 8Q227 3 236 14Q243 22 239 31Q239 23 231 18Q221 13 212 17Q205 19 201 30Z" fill="#62877b" stroke="#aac2ad" strokeWidth=".8"/>
      <g fill="none" stroke="#56766b" strokeWidth=".9"><path d="M204 31q5-4 11-1m9 0q5-4 11 0m-30 4q5 2 9 0m11 0q5 2 9-1m-15 0-2 10 5 1m-10 7q6-3 14-1m-11 3q5 2 9 0m-20-14q2 6 6 9m22-9-4 8"/></g>
      <g stroke="#d8deca" strokeWidth=".6" opacity=".8" fill="none"><path d="M206 23q4-6 15-7m2 18 1 8m-15-5 5 0m11 0 6-1m-16 20q5 2 9-1"/></g>
    </g>
    {tissue>0&&<path d="M238 233q8 7 6 24l-7 17q-4-10-3-24Z" fill="#f5bb74" opacity={Math.min(.7,tissue*2)}/>}
    {tablet&&<Tablet {...tablet} size={.81}/>}
  </g>;
}
