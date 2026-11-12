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
 ['서울',127.01,37.59],['강원',128.36,37.66],
 ['충남',126.60,36.55],['경북',129.01,36.41],
 ['전남',126.94,34.96],['경남',128.22,35.30],['제주',126.61,33.47]
];
const REGIONS=new Map(REGION_DATA.map(r=>[r.code,r]));
const LABEL_CODE={서울:'11',강원:'32',충남:'34',충북:'33',경북:'37',전북:'35',전남:'36',경남:'38',부산:'21',제주:'39'};
function weatherIcon(code){
 if(!Number.isFinite(code))return '❔';
 if(code===0)return '☀️';
 if(code===1||code===2)return '🌤️';
 if(code===3)return '☁️';
 if(code===45||code===48)return '🌫️';
 if(code>=95)return '⛈️';
 if((code>=71&&code<=77)||(code>=85&&code<=86))return '🌨️';
 if((code>=51&&code<=67)||(code>=80&&code<=82))return '🌧️';
 return '🌥️';
}
let dates=[],forecasts=new Map(),running=false,requestId=0;
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
 $('koDate').textContent=date?dateText(date)+(idx===0?' · 오늘':' · D+'+idx):'전국 예보 날짜 확인 중';
 $('koDaySlider').setAttribute('aria-valuetext',date?dateText(date):'조회 중');
 const ticks=$('koTicks');ticks.replaceChildren();
 for(let i=0;i<14;i++){
  const t=document.createElement('span');
  t.textContent=i===0?'오늘':i===13?'13일':'·';
  if(i===idx)t.className='active';
  ticks.append(t);
 }
 let rainCount=0,clearCount=0,missing=0;
 for(const region of REGION_DATA){
  const item=dataFor(region.code,date),rain=item?.rain??null;
  const path=$('koProvince-'+region.code);
  if(path){
   path.dataset.level=level(rain);
   const title=path.querySelector('title');
   if(title)title.textContent=region.name+' · '+statusText(rain,item?.code)+' · '+(valid(rain)?rain.toFixed(1)+' mm':'자료 없음');
  }
  if(!valid(rain))missing++;
  else if(rain>0)rainCount++;
  else clearCount++;
 }
 $('koSummary').textContent=date?
  '강수 '+rainCount+'곳 · 강수 없음 '+clearCount+'곳'+(missing?' · 미확인 '+missing+'곳':''):
  '전국 17개 시도 자료 확인 중';
 $('koLabelLayer').querySelectorAll('.ko-weather-pin').forEach(pin=>{
  const item=dataFor(pin.dataset.code,date),rain=item?.rain??null;
  pin.querySelector('.ko-map-symbol').textContent=item?weatherIcon(item.code):'';
  pin.querySelector('.ko-map-mm').textContent=valid(rain)&&rain>0?rain.toFixed(1)+'mm':'';
 });
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
  const path=makeSvg('path',{id:'koProvince-'+code,d:shape(g),class:'ko-province'});
  path.dataset.level='unknown';
  path.append(makeSvg('title'));
  layer.append(path);
 });
 const labelLayer=$('koLabelLayer');labelLayer.replaceChildren();
 MAP_LABELS.forEach(([name,lon,lat])=>{
  const [x,y]=project([lon,lat]);
  const pin=makeSvg('g',{class:'ko-weather-pin'});
  pin.dataset.code=LABEL_CODE[name];
  const icon=makeSvg('text',{x:x.toFixed(1),y:(y-13).toFixed(1),class:'ko-map-symbol','aria-hidden':'true'});
  const label=makeSvg('text',{x:x.toFixed(1),y:(y+8).toFixed(1),class:'ko-map-label'});
  label.textContent=name;
  const mm=makeSvg('text',{x:x.toFixed(1),y:(y+24).toFixed(1),class:'ko-map-mm'});
  pin.append(icon,label,mm);labelLayer.append(pin);
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
  $('koLoading').textContent='';
  update();
 }catch(err){
  if(id!==requestId)return;
  $('koLoading').textContent='⚠️ 예보 조회 실패 · ↻ 재시도';
  if(dates.length){$('koDaySlider').disabled=false;update();}
 }finally{
  if(id===requestId){running=false;$('koReload').disabled=false;}
 }
}
/* SVG map zoom/pan: fixed bounds, mouse wheel, pointer drag, pinch, keyboard and controls. */
function setupMapZoom(){
 const svg=$('koMap'),zoomIn=$('koZoomIn'),zoomOut=$('koZoomOut'),reset=$('koZoomReset');
 if(!svg||!zoomIn||!zoomOut||!reset)return;
 const BASE_W=520,BASE_H=580,MAX_ZOOM=5;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const view={x:0,y:0,zoom:1};
 const pointers=new Map();
 const announce=$('koZoomAnnouncement');
 function applyView(nextZoom,nextX,nextY){
  const previousZoom=view.zoom;
  view.zoom=clamp(nextZoom,1,MAX_ZOOM);
  const w=BASE_W/view.zoom,h=BASE_H/view.zoom;
  view.x=clamp(nextX,0,BASE_W-w);
  view.y=clamp(nextY,0,BASE_H-h);
  svg.setAttribute('viewBox',[view.x,view.y,w,h].map(n=>n.toFixed(3)).join(' '));
  zoomIn.disabled=view.zoom>=MAX_ZOOM-0.001;
  zoomOut.disabled=view.zoom<=1.001;
  reset.disabled=view.zoom<=1.001;
  reset.textContent=Math.round(view.zoom*100)+'%';
  if(announce&&Math.abs(previousZoom-view.zoom)>0.001){
   announce.textContent='지도 확대율 '+Math.round(view.zoom*100)+'%';
  }
 }
 function mapPoint(clientX,clientY){
  const p=svg.createSVGPoint();
  p.x=clientX;p.y=clientY;
  const matrix=svg.getScreenCTM();
  return matrix?p.matrixTransform(matrix.inverse()):{
   x:view.x+BASE_W/(2*view.zoom),y:view.y+BASE_H/(2*view.zoom)
  };
 }
 function zoomAt(nextZoom,clientX,clientY){
  const zoom=clamp(nextZoom,1,MAX_ZOOM);
  if(Math.abs(zoom-view.zoom)<0.0001)return;
  const pivot=mapPoint(clientX,clientY);
  const oldW=BASE_W/view.zoom,oldH=BASE_H/view.zoom;
  const ratioX=(pivot.x-view.x)/oldW,ratioY=(pivot.y-view.y)/oldH;
  applyView(zoom,pivot.x-ratioX*BASE_W/zoom,pivot.y-ratioY*BASE_H/zoom);
 }
 function centerZoom(factor){
  const rect=svg.getBoundingClientRect();
  zoomAt(view.zoom*factor,rect.left+rect.width/2,rect.top+rect.height/2);
 }
 function panBy(dx,dy){
  if(view.zoom<=1)return;
  const matrix=svg.getScreenCTM();
  const pxPerUnit=matrix?Math.hypot(matrix.a,matrix.b):1;
  if(!pxPerUnit)return;
  applyView(view.zoom,view.x-dx/pxPerUnit,view.y-dy/pxPerUnit);
 }
 const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 zoomIn.addEventListener('click',()=>centerZoom(1.35));
 zoomOut.addEventListener('click',()=>centerZoom(1/1.35));
 reset.addEventListener('click',()=>applyView(1,0,0));
 svg.addEventListener('wheel',e=>{
  e.preventDefault();
  zoomAt(view.zoom*(e.deltaY<0?1.22:1/1.22),e.clientX,e.clientY);
 },{passive:false});
 svg.addEventListener('dblclick',e=>{
  e.preventDefault();zoomAt(view.zoom*1.5,e.clientX,e.clientY);
 });
 svg.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  svg.setPointerCapture(e.pointerId);
  svg.classList.add('ko-map-dragging');
  e.preventDefault();
 });
 svg.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  const prev=[...pointers.values()];
  const old=pointers.get(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const next=[...pointers.values()];
  if(next.length>=2){
   const oldMid=mid(prev[0],prev[1]),newMid=mid(next[0],next[1]);
   panBy(newMid.x-oldMid.x,newMid.y-oldMid.y);
   const oldDistance=distance(prev[0],prev[1]);
   if(oldDistance>0)zoomAt(view.zoom*distance(next[0],next[1])/oldDistance,newMid.x,newMid.y);
  }else if(next.length===1){
   panBy(e.clientX-old.x,e.clientY-old.y);
  }
  e.preventDefault();
 });
 function endPointer(e){
  pointers.delete(e.pointerId);
  if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
  if(!pointers.size)svg.classList.remove('ko-map-dragging');
 }
 svg.addEventListener('pointerup',endPointer);
 svg.addEventListener('pointercancel',endPointer);
 svg.addEventListener('lostpointercapture',endPointer);
 svg.addEventListener('keydown',e=>{
  if(e.key==='+'||e.key==='='||e.code==='NumpadAdd')centerZoom(1.35);
  else if(e.key==='-'||e.key==='_'||e.code==='NumpadSubtract')centerZoom(1/1.35);
  else if(e.key==='0')applyView(1,0,0);
  else if(e.key==='ArrowLeft')panBy(35,0);
  else if(e.key==='ArrowRight')panBy(-35,0);
  else if(e.key==='ArrowUp')panBy(0,35);
  else if(e.key==='ArrowDown')panBy(0,-35);
  else return;
  e.preventDefault();
 });
 applyView(1,0,0);
}

async function init(){
 const slider=$('koDaySlider');if(!slider)return;
 setupMapZoom();
 slider.addEventListener('input',update);
 $('koReload').addEventListener('click',reload);
 update();
 const mapPromise=loadJSON('./korea-provinces-2018.topo.json',12000)
  .then(t=>{decodeGeo(t);update();})
  .catch(()=>{$('koMapMessage').textContent='지도 표시 실패';});
 await Promise.allSettled([mapPromise,reload()]);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();