/* Nationwide ECMWF IFS (single model). 17 provincial sample points, with Dokdo as a zoom-only Ulleung-gun sublocation; not area-wide observations. */
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
const DOKDO={name:'독도',lat:37.2408,lon:131.8696,admin:'경상북도 울릉군 울릉읍 독도리'};
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
// Symbolic outlines of Dokdo; under Ulleung-gun (not a separate administrative region).
function drawDokdo(){
 const layer=$('koDokdoLayer'),labels=$('koDokdoLabelLayer');
 if(!layer||!labels)return;
 const [x,y]=project([DOKDO.lon,DOKDO.lat]);
 // East/West islet locations and schematic footprints at real map scale.
 // Approximate radii correspond to ~150-170 m, not the earlier 10-unit icons.
 const west=project([131.8651667,37.2418333]),east=project([131.8695556,37.2407778]);
 const tinyIslet=([cx,cy],rx,ry)=>
  'M'+(cx-rx).toFixed(3)+','+cy.toFixed(3)+
  'a'+rx+','+ry+' 0 1 0 '+(2*rx)+',0'+
  'a'+rx+','+ry+' 0 1 0 '+(-2*rx)+',0Z';
 const d=tinyIslet(west,.145,.14)+tinyIslet(east,.13,.12);
 const shape=makeSvg('path',{id:'koDokdoIslands',d,class:'ko-province ko-dokdo-islets'});
 const tip=makeSvg('title');tip.textContent=DOKDO.admin;shape.append(tip);
 // A screen-size point marker makes the islands findable without distorting their outlines.
 const marker=makeSvg('circle',{id:'koDokdoPoint',cx:x.toFixed(3),cy:y.toFixed(3),r:'2.4',class:'ko-dokdo-point'});
 layer.replaceChildren(shape,marker);
 const text=makeSvg('text',{x:x.toFixed(2),y:(y+25).toFixed(2),class:'ko-city-label ko-dokdo-label'});
 text.textContent='독도';labels.replaceChildren(text);
 layer.style.display='none';labels.style.display='none';
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
  if(items.length!==REGION_DATA.length)throw Error('전국 17개 시도 예보 건수 불일치');
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
/* Interactive Korean region selection. Detail boundaries originate in simplified 2023 admin polygons. */
function setupMapZoom(){
 const svg=$('koMap'),zoomIn=$('koZoomIn'),zoomOut=$('koZoomOut'),reset=$('koZoomReset');
 const provinceLabels=$('koLabelLayer'),cityLabels=$('koCityLabelLayer');
 const dokdoLayer=$('koDokdoLayer'),dokdoLabels=$('koDokdoLabelLayer');
 const selectedArea=$('koSelectedArea'),selectedPin=$('koSelectedPin'),hoverArea=$('koHoverArea');
 if(!svg||!zoomIn||!zoomOut||!reset||!cityLabels||!selectedArea||!selectedPin||!hoverArea||!dokdoLayer||!dokdoLabels)return null;
 const BASE_W=585,BASE_H=580,MAX_ZOOM=5,DETAIL_THRESHOLD=1.65;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const view={x:0,y:0,zoom:1},pointers=new Map();
 const announcement=$('koZoomAnnouncement');
 const provincesByFull=new Map(Object.entries({
  '서울특별시':'11','부산광역시':'21','대구광역시':'22','인천광역시':'23',
  '광주광역시':'24','대전광역시':'25','울산광역시':'26','세종특별자치시':'29',
  '경기도':'31','강원특별자치도':'32','강원도':'32','충청북도':'33','충청남도':'34',
  '전라북도':'35','전북특별자치도':'35','전라남도':'36',
  '경상북도':'37','경상남도':'38','제주특별자치도':'39'
 }));
 const fullByCode=new Map([...provincesByFull].map(([name,code])=>[code,name]));
 let subregions=[],placeNodes=[],highlighted=null,hovered=null,lastPlace=null,selectionTimer=null,ulleungCounty=null;
 function isInsideRing(pt,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];
   if((a[1]>pt.y)!==(b[1]>pt.y) &&
     pt.x<(b[0]-a[0])*(pt.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
 }
 function insideCity(pt,p){return p.rings?.some(r=>isInsideRing(pt,r))||false;}
 function provinceAt(pt){
  for(const r of REGION_DATA){
   const path=$('koProvince-'+r.code);
   if(path?.isPointInFill && path.isPointInFill(pt))return r;
  }
  return null;
 }
 function closestCity(pt,provinceCode){
  let best=null,d=Infinity;
  for(const p of subregions){
   if(p.provinceCode!==provinceCode)continue;
   const dx=p.x-pt.x,dy=p.y-pt.y,score=dx*dx+dy*dy;
   if(score<d){best=p;d=score;}
  }
  return best;
 }
 function findCity(pt,code){
  for(const p of subregions)if(p.provinceCode===code&&insideCity(pt,p))return p;
  // Islands too small to survive polygon simplification: use nearest representative point within province.
  return closestCity(pt,code);
 }
 function cityPath(p){
  return (p?.rings||[]).map(r=>'M'+r.map(([x,y])=>x+','+y).join('L')+'Z').join('');
 }
 function dokdoPath(){return $('koDokdoIslands')?.getAttribute('d')||'';}
 function shapeForRegion(province,city,isDokdo=false){
  if(!province)return '';
  if(isDokdo)return view.zoom>=DETAIL_THRESHOLD?dokdoPath():'';
  if(view.zoom>=DETAIL_THRESHOLD&&city?.rings?.length){
   return cityPath(city)+(city.full==='경상북도 울릉군'?dokdoPath():'');
  }
  return $('koProvince-'+province.code)?.getAttribute('d')||'';
 }
 function regionAt(clientX,clientY){
  const point=mapPoint(clientX,clientY);
  if(view.zoom>=DETAIL_THRESHOLD){
   const [x,y]=project([DOKDO.lon,DOKDO.lat]);
   // Click/touch target 9 screen pixels: generous for usability, not a geographic radius.
   const screenScale=svg.getScreenCTM(),unitPx=screenScale?Math.hypot(screenScale.a,screenScale.b):1;
   if(Math.hypot(point.x-x,point.y-y)<=9/unitPx){
    return {province:REGIONS.get('37'),city:ulleungCounty,isDokdo:true};
   }
  }
  const province=provinceAt(point);
  return province?{province,city:view.zoom>=DETAIL_THRESHOLD?findCity(point,province.code):null,isDokdo:false}:null;
 }
 function setHover(region){
  const key=region?(region.isDokdo?'dokdo':region.city?'city:'+region.city.full:'province:'+region.province.code):'';
  const oldKey=hovered?(hovered.isDokdo?'dokdo':hovered.city?'city:'+hovered.city.full:'province:'+hovered.province.code):'';
  if(key===oldKey)return;
  hovered=region;
  $('koDokdoPoint')?.classList.toggle('is-hovered',!!region?.isDokdo);
  hoverArea.setAttribute('d',region?shapeForRegion(region.province,region.city,region.isDokdo):'');
 }
 function hoverAt(clientX,clientY){
  setHover(regionAt(clientX,clientY));
 }
 function showSelection(){
  if(!highlighted){
   selectedArea.setAttribute('d','');selectedPin.setAttribute('r','0');
   $('koDokdoPoint')?.classList.remove('is-selected');
   return;
  }
  const p=highlighted.province;
  $('koDokdoPoint')?.classList.toggle('is-selected',!!highlighted.isDokdo);
  selectedArea.setAttribute('d',shapeForRegion(p,highlighted.city,highlighted.isDokdo));
  // Replaying the flash acknowledges a newly selected region without scaling the map text.
  const center=highlighted.isDokdo?DOKDO:(highlighted.city||p);
  const x=center.x??project([center.lon,center.lat])[0];
  const y=center.y??project([center.lon,center.lat])[1];
  selectedPin.setAttribute('cx',x.toFixed(2));
  selectedPin.setAttribute('cy',y.toFixed(2));
  selectedPin.setAttribute('r',highlighted.isDokdo&&view.zoom<DETAIL_THRESHOLD?'0':(5/view.zoom).toFixed(2));
  selectedArea.style.animation='none';
  void selectedArea.getBoundingClientRect();
  selectedArea.style.animation='';
 }
 function setSelected(province,city,isDokdo=false){
  highlighted=province?{province,city:city||null,isDokdo}:null;
  showSelection();
 }
 function buildSubregions(places){
  subregions=places.filter(p=>Number.isFinite(p.lon)&&Number.isFinite(p.lat)&&typeof p.name==='string').map(p=>{
   const prefix=p.full?.split(' ')[0]||'';
   const [x,y]=project([p.lon,p.lat]);
   return {...p,provinceCode:provincesByFull.get(prefix),admin:prefix,x,y};
  });
  ulleungCounty=subregions.find(p=>p.full==='경상북도 울릉군')||null;
  cityLabels.replaceChildren();placeNodes=[];
  for(const place of subregions){
   const node=makeSvg('text',{x:place.x.toFixed(2),y:place.y.toFixed(2),class:'ko-city-label'});
   node.textContent=place.name==='세종특별자치시'?'세종시':place.name;
   node.setAttribute('aria-label',place.full||place.name);
   node.style.display='none';cityLabels.append(node);
   placeNodes.push({name:node.textContent,x:place.x,y:place.y,node,
    priority:place.name.endsWith('시')?3:place.name.endsWith('군')?2:1});
  }
  showDetailLabels();
  syncPlace(lastPlace);
 }
 function showDetailLabels(){
  const detailed=view.zoom>=DETAIL_THRESHOLD&&placeNodes.length>0;
  provinceLabels.style.display=detailed?'none':'';
  cityLabels.style.display=detailed?'':'none';
  dokdoLayer.style.display=view.zoom>=DETAIL_THRESHOLD?'':'none';
  dokdoLabels.style.display=view.zoom>=DETAIL_THRESHOLD?'':'none';
  if(!detailed)return;
  const rect=svg.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const w=BASE_W/view.zoom,h=BASE_H/view.zoom;
  const unit=Math.min(rect.width/w,rect.height/h);
  const offsetX=(rect.width-w*unit)/2,offsetY=(rect.height-h*unit)/2;
  const fontPx=27*unit/view.zoom,visible=[],candidates=[];
  for(const p of placeNodes){
   p.node.style.display='none';
   const px=offsetX+(p.x-view.x)*unit,py=offsetY+(p.y-view.y)*unit;
   const textWidth=p.name.length*fontPx*.96+6;
   const box={left:px-textWidth/2-5,right:px+textWidth/2+5,top:py-fontPx*1.05-3,bottom:py+4};
   if(box.left<offsetX+2||box.right>offsetX+w*unit-2||
      box.top<offsetY+2||box.bottom>offsetY+h*unit-2)continue;
   candidates.push({...p,box});
  }
  candidates.sort((a,b)=>b.priority-a.priority||a.y-b.y||a.x-b.x);
  for(const p of candidates){
   if(visible.some(o=>p.box.left<o.right&&p.box.right>o.left&&
    p.box.top<o.bottom&&p.box.bottom>o.top))continue;
   p.node.style.display='';visible.push(p.box);
  }
 }
 function applyView(nextZoom,nextX,nextY){
  const old=view.zoom;
  view.zoom=clamp(nextZoom,1,MAX_ZOOM);
  const w=BASE_W/view.zoom,h=BASE_H/view.zoom;
  view.x=clamp(nextX,0,BASE_W-w);
  view.y=clamp(nextY,0,BASE_H-h);
  svg.setAttribute('viewBox',[view.x,view.y,w,h].map(n=>n.toFixed(3)).join(' '));
  svg.style.setProperty('--ko-symbol-size',(29/view.zoom)+'px');
  svg.style.setProperty('--ko-province-size',(19/view.zoom)+'px');
  svg.style.setProperty('--ko-mm-size',(17/view.zoom)+'px');
  svg.style.setProperty('--ko-city-size',(27/view.zoom)+'px');
  svg.style.setProperty('--ko-text-stroke',(4/view.zoom)+'px');
  const dokdoPoint=$('koDokdoPoint');
  if(dokdoPoint)dokdoPoint.setAttribute('r',(2.4/view.zoom).toFixed(3));
  zoomIn.disabled=view.zoom>=MAX_ZOOM-.001;
  zoomOut.disabled=view.zoom<=1.001;
  reset.disabled=view.zoom<=1.001;
  reset.textContent=Math.round(view.zoom*100)+'%';
  if(announcement&&Math.abs(old-view.zoom)>.001)announcement.textContent='지도 확대율 '+Math.round(view.zoom*100)+'%';
  showDetailLabels();showSelection();
  // Any previous hovered region is interpreted at the old zoom level.
  // Re-evaluate it on the next pointer move instead of showing a stale outline.
  hovered=null;hoverArea.setAttribute('d','');
 }
 function mapPoint(x,y){
  const pt=svg.createSVGPoint();pt.x=x;pt.y=y;
  const m=svg.getScreenCTM();
  return m?pt.matrixTransform(m.inverse()):{x:view.x+BASE_W/(2*view.zoom),y:view.y+BASE_H/(2*view.zoom)};
 }
 function zoomAt(next,x,y){
  const z=clamp(next,1,MAX_ZOOM);
  if(Math.abs(z-view.zoom)<.0001)return;
  const pivot=mapPoint(x,y);
  const rx=(pivot.x-view.x)/(BASE_W/view.zoom),ry=(pivot.y-view.y)/(BASE_H/view.zoom);
  applyView(z,pivot.x-rx*BASE_W/z,pivot.y-ry*BASE_H/z);
 }
 function centerZoom(factor){
  const r=svg.getBoundingClientRect();
  zoomAt(view.zoom*factor,r.left+r.width/2,r.top+r.height/2);
 }
 function panBy(dx,dy){
  if(view.zoom<=1)return;
  const m=svg.getScreenCTM(),u=m?Math.hypot(m.a,m.b):0;
  if(u)applyView(view.zoom,view.x-dx/u,view.y-dy/u);
 }
 function syncPlace(place){
  lastPlace=place;
  if(!place||!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude))return;
  if(place.name==='독도'&&Math.abs(place.latitude-DOKDO.lat)<.05&&Math.abs(place.longitude-DOKDO.lon)<.05){
   setSelected(REGIONS.get('37'),ulleungCounty,true);return;
  }
  const [x,y]=project([place.longitude,place.latitude]);
  const point={x,y};
  const province=provinceAt(point);
  if(!province){setSelected(null,null);return;}
  const matching=subregions.find(p=>p.provinceCode===province.code&&insideCity(point,p));
  setSelected(province,matching||null);
 }
 function selectAt(clientX,clientY){
  const region=regionAt(clientX,clientY);
  if(!region)return;
  const {province,city,isDokdo}=region;
  setSelected(province,city,isDokdo);
  setHover(null);
  const place=isDokdo?{
   name:DOKDO.name,admin:DOKDO.admin,latitude:DOKDO.lat,longitude:DOKDO.lon
  }:city?{
   name:city.name,admin:city.admin,latitude:city.lat,longitude:city.lon
  }:{
   name:fullByCode.get(province.code)||province.name,
   admin:'대한민국',
   latitude:province.lat,longitude:province.lon
  };
  if(announcement)announcement.textContent='선택한 지역: '+place.name;
  if(typeof window.ridingWeatherSelectMapPlace==='function'){
   window.ridingWeatherSelectMapPlace(place);
  }
 }
 const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 zoomIn.addEventListener('click',()=>centerZoom(1.35));
 zoomOut.addEventListener('click',()=>centerZoom(1/1.35));
 reset.addEventListener('click',()=>applyView(1,0,0));
 svg.addEventListener('wheel',e=>{
  e.preventDefault();
  zoomAt(view.zoom*(e.deltaY<0?1.22:1/1.22),e.clientX,e.clientY);
  hoverAt(e.clientX,e.clientY);
 },{passive:false});
 svg.addEventListener('pointerenter',e=>{
  if(e.pointerType==='mouse'&&!pointers.size)hoverAt(e.clientX,e.clientY);
 });
 svg.addEventListener('pointerleave',()=>{if(!pointers.size)setHover(null);});
 svg.addEventListener('dblclick',e=>{
  if(selectionTimer!==null){clearTimeout(selectionTimer);selectionTimer=null;}
  e.preventDefault();zoomAt(view.zoom*1.5,e.clientX,e.clientY);
 });
 svg.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  const p={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};
  if(pointers.size||selectionTimer!==null){
   if(selectionTimer!==null){clearTimeout(selectionTimer);selectionTimer=null;}
   for(const old of pointers.values())old.moved=true;
   if(pointers.size)p.moved=true;
  }
  pointers.set(e.pointerId,p);
  svg.setPointerCapture(e.pointerId);
  svg.classList.add('ko-map-dragging');
  // Touch devices do not have persistent mouse hover: highlight on initial press.
  if(pointers.size===1)hoverAt(e.clientX,e.clientY);
  else setHover(null);
  e.preventDefault();
 });
 svg.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)){
   if(e.pointerType==='mouse')hoverAt(e.clientX,e.clientY);
   return;
  }
  const before=[...pointers.values()],old=pointers.get(e.pointerId);
  const updated={...old,x:e.clientX,y:e.clientY};
  if(distance(updated,{x:old.sx,y:old.sy})>8)updated.moved=true;
  pointers.set(e.pointerId,updated);
  if(updated.moved||pointers.size>1)setHover(null);
  const after=[...pointers.values()];
  if(after.length>=2){
   for(const p of after)p.moved=true;
   const a=midpoint(before[0],before[1]),b=midpoint(after[0],after[1]);
   panBy(b.x-a.x,b.y-a.y);
   const prev=distance(before[0],before[1]);
   if(prev>0)zoomAt(view.zoom*distance(after[0],after[1])/prev,b.x,b.y);
  }else if(after.length===1)panBy(e.clientX-old.x,e.clientY-old.y);
  e.preventDefault();
 });
 function endPointer(e){
  const p=pointers.get(e.pointerId);
  const wasSingle=pointers.size===1;
  pointers.delete(e.pointerId);
  if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
  if(!pointers.size){
   svg.classList.remove('ko-map-dragging');
   if(p?.pointerType==='touch'||e.pointerType==='touch'||e.type==='pointercancel')setHover(null);
   else if(e.pointerType==='mouse')hoverAt(e.clientX,e.clientY);
  }
  if(e.type==='pointerup'&&p&&wasSingle&&!p.moved&&distance({x:e.clientX,y:e.clientY},{x:p.sx,y:p.sy})<9){
   const x=e.clientX,y=e.clientY;
   selectionTimer=setTimeout(()=>{selectionTimer=null;selectAt(x,y);},220);
  }
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
  else if(e.key==='Enter'||e.key===' '){
   const r=svg.getBoundingClientRect();
   selectAt(r.left+r.width/2,r.top+r.height/2);
  }else return;
  e.preventDefault();
 });
 document.addEventListener('riding-weather:place-selected',e=>syncPlace(e.detail));
 applyView(1,0,0);
 return {setSubregions:buildSubregions,refresh:showDetailLabels,refreshSelection:()=>syncPlace(lastPlace)};
}

async function init(){
 const slider=$('koDaySlider');if(!slider)return;
 drawDokdo();
 const mapZoom=setupMapZoom();
 slider.addEventListener('input',update);
 $('koReload').addEventListener('click',reload);
 update();
 const mapPromise=loadJSON('./korea-provinces-2018.topo.json',12000)
  .then(t=>{decodeGeo(t);mapZoom?.refreshSelection();update();})
  .catch(()=>{$('koMapMessage').textContent='지도 표시 실패';});
 const subregionPromise=loadJSON('./korea-sigungu-labels.json',12000)
  .then(data=>{
   if(!Array.isArray(data.places)||data.places.length<200)throw Error('시군구 데이터 형식 오류');
   mapZoom?.setSubregions(data.places);
  })
  .catch(()=>{$('koMapMessage').textContent='세부 지역명 조회 실패 · 시도명만 표시';});
 await Promise.allSettled([mapPromise,subregionPromise,reload()]);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();