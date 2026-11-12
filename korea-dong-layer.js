/* Neighborhood label layer — 2026-11-02 legal-dong centroids (V-World-derived).
 * Source: https://github.com/nash-dir/korea-bjd-shp-to-csv
 * Attribution: nash-dir; underlying geographic centers derived from V-World.
 * Lazy-loaded: one ~1.9 MB CSV request only after neighborhood zoom.
 */
(()=>{
'use strict';
const DATA_URL='https://raw.githubusercontent.com/nash-dir/korea-bjd-shp-to-csv/ae0ac8359f42e44670d44571f8d87a453fae13d6/results/261102/dongnaeKR_261102.csv';
const THRESHOLD=28,RI_THRESHOLD=110,GRID=10,BASE_W=585,BASE_H=580;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
window.createKoreaDongLayer=function({svg,layer,onLoaded}){
 let ready=false,loading=null,failed=false,places=[],visible=[],cells=new Map();
 const key=(x,y)=>Math.floor(x/GRID)+':'+Math.floor(y/GRID);
 function parse(text){
  const data=[],buckets=new Map();
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);
  if(!lines[0]?.startsWith('dnid,dnname,dnlatitude,dnlongitude'))throw Error('지명 데이터 헤더 오류');
  for(let i=1;i<lines.length;i++){
   if(!lines[i])continue;
   const row=lines[i].split(',');
   if(row.length<5)continue;
   const code=row[0].trim(),full=row[1].trim(),lat=Number(row[2]),lon=Number(row[3]);
   if(!/^\d{10}$/.test(code)||!full||!Number.isFinite(lat)||!Number.isFinite(lon))continue;
   if(code.endsWith('00000'))continue; // upper administrative levels
   const ri=!code.endsWith('00');
   const name=full.split(/\s+/).at(-1);
   if(!name||!/[읍면동리]$/.test(name))continue;
   const x=(lon-124.15)*70.5,y=(38.98-lat)*96;
   if(x < -15||x>650||y < -60||y>630)continue;
   const place={code,full,name,lat,lon,x,y,ri};
   data.push(place);
   const k=key(x,y);if(!buckets.has(k))buckets.set(k,[]);
   buckets.get(k).push(place);
  }
  if(data.filter(p=>!p.ri).length<2000)throw Error('지명 데이터 수량 부족');
  return {data,buckets};
 }
 function ensureData(){
  if(ready||loading||failed)return;
  loading=fetch(DATA_URL,{mode:'cors',cache:'force-cache'})
   .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.text();})
   .then(text=>{
    const parsed=parse(text);
    places=parsed.data;cells=parsed.buckets;ready=true;
    onLoaded();
   })
   .catch(err=>{
    failed=true;
    console.warn('법정동 지명 데이터를 불러오지 못했습니다:',err);
   });
 }
 function clear(){
  if(layer.childNodes.length)layer.replaceChildren();
  visible=[];
 }
 function update(view){
  if(view.zoom<THRESHOLD){layer.style.display='none';clear();return;}
  if(!ready){ensureData();layer.style.display='none';return;}
  layer.style.display='';
  const rect=svg.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const w=BASE_W/view.zoom,h=BASE_H/view.zoom;
  const scale=Math.min(rect.width/w,rect.height/h);
  const offsetX=(rect.width-w*scale)/2,offsetY=(rect.height-h*scale)/2;
  const fontPx=view.zoom>=RI_THRESHOLD?11:12;
  const buffer=2,candidates=[];
  const minX=Math.floor(view.x/GRID)-1,maxX=Math.floor((view.x+w)/GRID)+1;
  const minY=Math.floor(view.y/GRID)-1,maxY=Math.floor((view.y+h)/GRID)+1;
  for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
   for(const p of cells.get(gx+':'+gy)||[]){
    if(p.ri&&view.zoom<RI_THRESHOLD)continue;
    const px=offsetX+(p.x-view.x)*scale,py=offsetY+(p.y-view.y)*scale;
    if(px<offsetX+buffer||px>offsetX+w*scale-buffer||
       py<offsetY+buffer||py>offsetY+h*scale-buffer)continue;
    const textWidth=p.name.length*fontPx*.95+9;
    const box={left:px-textWidth/2-3,right:px+textWidth/2+3,
      top:py-fontPx-5,bottom:py+6};
    if(box.left<offsetX+buffer||box.right>offsetX+w*scale-buffer||
       box.top<offsetY+buffer||box.bottom>offsetY+h*scale-buffer)continue;
    const centerScore=Math.hypot(px-rect.width/2,py-rect.height/2);
    candidates.push({p,box,centerScore});
   }
  }
  candidates.sort((a,b)=>Number(a.p.ri)-Number(b.p.ri)||a.centerScore-b.centerScore);
  const occupied=[],items=[],maxLabels=rect.width<320?23:38;
  for(const c of candidates){
   if(occupied.some(b=>c.box.left<b.right&&c.box.right>b.left&&
     c.box.top<b.bottom&&c.box.bottom>b.top))continue;
   occupied.push(c.box);items.push(c.p);
   if(items.length>=maxLabels)break;
  }
  const fragment=document.createDocumentFragment();
  for(const p of items){
   const n=document.createElementNS('http://www.w3.org/2000/svg','text');
   n.setAttribute('x',p.x.toFixed(3));n.setAttribute('y',p.y.toFixed(3));
   n.setAttribute('class',p.ri?'ko-locality-label ko-ri-label':'ko-locality-label');
   n.setAttribute('font-size',(fontPx/(rect.width/BASE_W)/view.zoom).toFixed(4));
   n.textContent=p.name;
   fragment.append(n);
  }
  layer.replaceChildren(fragment);visible=items;
 }
 function hit(clientX,clientY,view,point){
  if(!ready||view.zoom<THRESHOLD||!visible.length)return null;
  const rect=svg.getBoundingClientRect();
  const scale=Math.min(rect.width/(BASE_W/view.zoom),rect.height/(BASE_H/view.zoom));
  let best=null,bestD=Infinity;
  for(const p of visible){
   const distance=Math.hypot(point.x-p.x,point.y-p.y)*scale;
   if(distance<bestD){best=p;bestD=distance;}
  }
  return bestD<=33?best:null;
 }
 function matching(place){
  if(!ready||!place||!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude))return null;
  const x=(place.longitude-124.15)*70.5,y=(38.98-place.latitude)*96;
  const row=cells.get(key(x,y))||[];
  return row.find(p=>p.name===place.name&&Math.abs(p.lat-place.latitude)<.001&&Math.abs(p.lon-place.longitude)<.001)||null;
 }
 return {update,hit,matching,get ready(){return ready;},get count(){return places.length;}};
};
})();