/* Nationwide ECMWF IFS (single model). 17 representative points, not province-wide observation. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const SVG='http://www.w3.org/2000/svg';
const REGION_DATA=[
 ['11','서울',37.5665,126.9780],
 ['21','부산',35.1796,129.0756],
 ['22','대구',35.8714,128.6014],
 ['23','인천',37.4563,126.7052],
 ['24','광주',35.1595,126.8526],
 ['25','대전',36.3504,127.3845],
 ['26','울산',35.5384,129.3114],
 ['29','세종',36.4801,127.2890],
 ['31','경기',37.4138,127.5183],
 ['32','강원',37.8228,128.1555],
 ['33','충북',36.8000,127.7000],
 ['34','충남',36.6600,126.6700],
 ['35','전북',35.8200,127.1500],
 ['36','전남',34.8200,126.4700],
 ['37','경북',36.5800,128.7200],
 ['38','경남',35.2380,128.6920],
 ['39','제주',33.4996,126.5312]
].map(([code,name,lat,lon])=>({code,name,lat,lon}));
const MAP_LABELS=[
 ['서울',127.01,37.59],['강원',128.36,37.66],['충남',126.60,36.55],
 ['충북',127.85,36.86],['경북',129.01,36.41],['전북',127.05,35.78],
 ['전남',126.94,34.96],['경남',128.22,35.30],['부산',129.21,35.13],['제주',126.61,33.47]
];
const REGIONS=new Map(REGION_DATA.map(r=>[r.code,r]));
let dates=[],forecasts=new Map(),picked='11',running=false,requestId=0;
const makeSvg=(tag,attrs={})=>{
 const node=document.createElementNS(SVG,tag);
 for(const [key,val] of Object.entries(attrs))node.setAttribute(key,String(val));
 return node;
};
const project=([lon,lat])=>[(lon-124.15)*70.5,(38.98-lat)*96];
const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function level(v){
 if(!valid(v))return 'unknown';
 if(v===0)return 'none';
 if(v<1)return 'light';
 if(v<5)return 'medium';
 return 'heavy';
}
function icon(v,code){
 if(!valid(v))return '—';
 if(code>=71&&code<=77||code>=85&&code<=86)return '🌨️';
 return v===0?'☀️':v<1?'🌦️':'🌧️';
}
function statusText(v,code){
 if(!valid(v))return '자료 없음';
 if(code>=71&&code<=77||code>=85&&code<=86)return '눈/강수';
 if(v===0)return '강수 없음';
 return v<1?'미량 강수':v<5?'비 예보':'강수 많음';
}
function wxText(code){
 if(!Number.isFinite(code))return '날씨 확인 불가';
 if(code===0)return '맑음';
 if(code===1||code===2)return '대체로 맑음';
 if(code===3)return '흐림';
 if(code===45||code===48)return '안개';
 if(code>=95)return '뇌우';
 if(code>=71&&code<=77||code>=85&&code<=86)return '눈';
 if(code>=51&&code<=82)return '비 또는 소나기';
 return '기타';
}
function dataFor(code,date){
 return forecasts.get(code)?.get(date)||null;
}
function todayString(){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const p=Object.fromEntries(parts.map(a=>[a.type,a.value]));
 return p.year+'-'+p.month+'-'+p.day;
}
function dateText(str){
 if(!str)return '날짜 확인 중';
 const dow=['일','월','화','수','목','금','토'][new Date(str+'T12:00:00Z').getUTCDay()];
 return str.slice(5,7)+'/'+str.slice(8,10)+' ('+dow+')';
}
function currentDate(){return dates[Number($('koDaySlider').value)]||null;}
function update(){
 const date=currentDate(),idx=Number($('koDaySlider').value);
 $('koDate').textContent=date?dateText(date)+(idx===0?' · 오늘':' · D+'+idx):'예보 날짜를 확인 중입니다';
 $('koDaySlider').setAttribute('aria-valuetext',date?dateText(date):'예보 날짜 없음');
 const ticks=$('koTicks');ticks.replaceChildren();
 for(let i=0;i<14;i++){
  const t=document.createElement('span');
  t.textContent=i===0?'오늘':i===13?'13일':'·';
  if(i===idx)t.className='active';
  ticks.append(t);
 }
 const list=$('koRegionList');list.replaceChildren();
 let rainCount=0,loadedCount=0;
 for(const r of REGION_DATA){
  const d=dataFor(r.code,date),rain=d?.rain??null,wet=level(rain);
  if(valid(rain)){loadedCount++;if(rain>0)rainCount++;}
  const path=$('koProvince-'+r.code);
  if(path){
   path.dataset.level=wet;
   path.classList.toggle('is-picked',r.code===picked);
   const title=path.querySelector('title');
   if(title)title.textContent=r.name+' · '+statusText(rain,d?.code)+' · '+(valid(rain)?rain.toFixed(1)+'mm':'자료 없음');
  }
  const btn=document.createElement('button');
  btn.type='button';btn.className='ko-region'+(r.code===picked?' active':'');
  btn.dataset.level=wet;btn.setAttribute('aria-pressed',String(r.code===picked));
  const name=document.createElement('span');name.className='ko-region-name';name.textContent=r.name;
  const state=document.createElement('span');state.className='ko-region-rain';
  state.textContent=icon(rain,d?.code)+' '+(valid(rain)?rain.toFixed(1)+'mm':'—');
  btn.append(name,state);
  btn.title=r.name+' · '+statusText(rain,d?.code);
  btn.addEventListener('click',()=>{picked=r.code;update();});
  list.append(btn);
 }
 $('koSummary').textContent=date?
  '강수 예보 '+rainCount+'개 시도 · 확인 '+loadedCount+'/17곳 (대표 지점 기준)':
  '전국 17개 시도 예보를 확인하는 중입니다.';
 const r=REGIONS.get(picked),f=r?dataFor(r.code,date):null;
 const value=f?.rain;
 $('koPicked').textContent=r?
  r.name+' · '+statusText(value,f?.code)+
  (valid(value)?' '+value.toFixed(1)+'mm':'')+
  (f&&Number.isFinite(f.hi)&&Number.isFinite(f.lo)?' · '+wxText(f.code)+' · '+f.lo.toFixed(0)+'~'+f.hi.toFixed(0)+'°C':''):
  '지역을 선택하세요.';
}
function decodeGeo(topo){
 if(topo?.type!=='Topology'||!Array.isArray(topo.arcs)||!topo.transform)throw Error('지도 경계 형식 오류');
 const tx=topo.transform;
 const decoded=topo.arcs.map(arc=>{
  let x=0,y=0;
  return arc.map(([dx,dy])=>{
   x+=dx;y+=dy;
   return project([x*tx.scale[0]+tx.translate[0],y*tx.scale[1]+tx.translate[1]]);
  });
 });
 function ringPoints(indices){
  const pts=[];
  indices.forEach((index,i)=>{
   const segment=decoded[index<0?~index:index];
   if(!segment)return;
   let points=index<0?[...segment].reverse():segment;
   if(i)points=points.slice(1);
   pts.push(...points);
  });
  return pts;
 }
 function shape(geometry){
  const polygons=geometry.type==='Polygon'?[geometry.arcs]:geometry.arcs;
  return polygons.map(polygon=>polygon.map(ring=>{
   const pts=ringPoints(ring);
   if(!pts.length)return '';
   return 'M'+pts.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1)).join('L')+'Z';
  }).join('')).join('');
 }
 const geoms=topo.objects?.skorea_provinces_2018_geo?.geometries;
 if(!Array.isArray(geoms)||geoms.length!==17)throw Error('17개 시도 경계를 찾을 수 없습니다');
 const layer=$('koProvinceLayer');layer.replaceChildren();
 geoms.forEach(g=>{
  const code=g.properties?.code;if(!REGIONS.has(code))return;
  const path=makeSvg('path',{id:'koProvince-'+code,d:shape(g),class:'ko-province',tabindex:'0',role:'button','aria-label':g.properties.name+' 예보 보기'});
  path.dataset.level='unknown';
  path.append(makeSvg('title'));
  path.addEventListener('click',()=>{picked=code;update();});
  path.addEventListener('keydown',ev=>{
   if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();picked=code;update();}
  });
  layer.append(path);
 });
 const labelLayer=$('koLabelLayer');labelLayer.replaceChildren();
 MAP_LABELS.forEach(([name,lon,lat])=>{
  const [x,y]=project([lon,lat]);
  const label=makeSvg('text',{x:x.toFixed(1),y:y.toFixed(1),class:'ko-map-label'});
  label.textContent=name;labelLayer.append(label);
 });
}
async function loadJSON(url,timeout=15000){
 const ctrl=new AbortController(),id=setTimeout(()=>ctrl.abort(),timeout);
 try{
  const response=await fetch(url,{signal:ctrl.signal,cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  return await response.json();
 }finally{clearTimeout(id);}
}
async function reload(){
 if(running)return;
 running=true;
 const id=++requestId;
 $('koReload').disabled=true;
 $('koDaySlider').disabled=true;
 $('koLoading').textContent='17개 시도 ECMWF IFS 일별 예보 조회 중…';
 try{
  const params=new URLSearchParams({
   latitude:REGION_DATA.map(r=>r.lat.toFixed(4)).join(','),
   longitude:REGION_DATA.map(r=>r.lon.toFixed(4)).join(','),
   models:'ecmwf_ifs',
   daily:'precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min',
   forecast_days:'14',timezone:'Asia/Seoul'
  });
  const payload=await loadJSON('https://api.open-meteo.com/v1/forecast?'+params,18000);
  const items=Array.isArray(payload)?payload:[payload];
  if(items.length!==REGION_DATA.length)throw Error('17개 시도 예보 건수 불일치');
  const first=items[0]?.daily?.time;
  if(!Array.isArray(first)||first.length<14)throw Error('14일 예보가 누락되었습니다');
  const next=new Map();
  items.forEach((item,i)=>{
   const d=item.daily;
   if(!Array.isArray(d?.time)||!Array.isArray(d.precipitation_sum))throw Error('강수 예보 형식 오류');
   const values=new Map();
   d.time.forEach((date,j)=>{
    const val=d.precipitation_sum[j],code=d.weather_code?.[j],hi=d.temperature_2m_max?.[j],lo=d.temperature_2m_min?.[j];
    values.set(date,{
     rain:valid(val)?val:null,
     code:Number.isFinite(code)?code:null,
     hi:Number.isFinite(hi)?hi:null,
     lo:Number.isFinite(lo)?lo:null
    });
   });
   next.set(REGION_DATA[i].code,values);
  });
  if(id!==requestId)return;
  dates=first.slice(0,14);forecasts=next;
  const slider=$('koDaySlider');
  slider.max=String(dates.length-1);
  slider.disabled=false;
  if(Number(slider.value)>=dates.length)slider.value='0';
  $('koLoading').textContent='✅ ECMWF IFS 예보 조회 완료 · '+dates[0]+'부터 14일 · 한국시간(KST)';
  update();
 }catch(err){
  if(id!==requestId)return;
  $('koLoading').textContent='⚠️ 전국 예보를 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요. ('+err.message+')';
  if(dates.length){$('koDaySlider').disabled=false;update();}
 }finally{
  if(id===requestId){running=false;$('koReload').disabled=false;}
 }
}
async function init(){
 const slider=$('koDaySlider');if(!slider)return;
 slider.addEventListener('input',update);
 $('koReload').addEventListener('click',reload);
 update();
 // Static administrative boundaries are optional; forecast list remains usable if map fails.
 const mapPromise=loadJSON('./korea-provinces-2018.topo.json',12000)
  .then(t=>{decodeGeo(t);update();})
  .catch(()=>{$('koMapMessage').textContent='지도 경계를 불러오지 못했습니다. 지역별 목록을 이용해 주세요.';});
 await Promise.allSettled([mapPromise,reload()]);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();