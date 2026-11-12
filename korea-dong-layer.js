/* Legal-dong place-name labels (2026-11-02 data, coordinate points only).
 * Source: nash-dir/korea-bjd-shp-to-csv, derived from V-World geospatial data.
 * Dataset stored locally as compact JSON; 읍·면·동 loaded on zoom, 리 loaded at deep zoom.
 * Source records have representative centroids, not precise legal-dong boundaries.
 */
(()=>{
'use strict';
const THRESHOLD=28,RI_THRESHOLD=110,GRID=10,BASE_W=585,BASE_H=580;
window.createKoreaDongLayer=function({svg,layer,onLoaded}){
 let emdReady=false,riReady=false,emdLoading=null,riLoading=null,places=[],visible=[],cells=new Map(),byCode=new Map(),selectedCode=null;
 const key=(x,y)=>Math.floor(x/GRID)+':'+Math.floor(y/GRID);
 function append(records,isRi){
  if(!Array.isArray(records)||records.length<(isRi?14000:4500))throw Error('지역명 목록 수량 오류');
  for(const row of records){
   const [code,full,lat,lon]=row;
   if(typeof full!=='string'||!Number.isFinite(lat)||!Number.isFinite(lon))continue;
   const name=full.trim().split(/\s+/).at(-1);
   if(!name)continue;
   const x=(lon-124.15)*70.5,y=(38.98-lat)*96;
   if(x < -15||x > 650||y < -60||y > 630)continue;
   const place={code,full,name,lat,lon,x,y,ri:isRi};
   places.push(place);
   byCode.set(code,place);
   const k=key(x,y);
   if(!cells.has(k))cells.set(k,[]);
   cells.get(k).push(place);
  }
 }
 function loadLevel(isRi){
  if(isRi){
   if(riReady||riLoading)return;
   riLoading=fetch('./korea-ri-labels.json?v=20261112z',{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();})
    .then(rows=>{append(rows,true);riReady=true;onLoaded();})
    .catch(err=>console.warn('리 지명 자료 로드 실패:',err));
  }else{
   if(emdReady||emdLoading)return;
   emdLoading=fetch('./korea-emd-labels.json?v=20261112z',{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();})
    .then(rows=>{append(rows,false);emdReady=true;onLoaded();})
    .catch(err=>console.warn('읍·면·동 지명 자료 로드 실패:',err));
  }
 }
 function clear(){
  if(layer.childNodes.length)layer.replaceChildren();
  visible=[];
 }
 function update(view){
  if(view.zoom<THRESHOLD){layer.style.display='none';clear();return;}
  if(!emdReady)loadLevel(false);
  if(view.zoom>=RI_THRESHOLD&&!riReady)loadLevel(true);
  if(!emdReady){layer.style.display='none';clear();return;}
  layer.style.display='';
  const rect=svg.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const w=BASE_W/view.zoom,h=BASE_H/view.zoom;
  const scale=Math.min(rect.width/w,rect.height/h);
  const offsetX=(rect.width-w*scale)/2,offsetY=(rect.height-h*scale)/2;
  const fontPx=view.zoom>=RI_THRESHOLD?11:12;
  const padding=2,candidates=[];
  const minX=Math.floor(view.x/GRID)-1,maxX=Math.floor((view.x+w)/GRID)+1;
  const minY=Math.floor(view.y/GRID)-1,maxY=Math.floor((view.y+h)/GRID)+1;
  for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++){
   for(const p of cells.get(gx+':'+gy)||[]){
    if(p.ri&&view.zoom<RI_THRESHOLD)continue;
    const px=offsetX+(p.x-view.x)*scale,py=offsetY+(p.y-view.y)*scale;
    if(px<offsetX+padding||px>offsetX+w*scale-padding||
       py<offsetY+padding||py>offsetY+h*scale-padding)continue;
    const width=p.name.length*fontPx*.95+9;
    const box={left:px-width/2-3,right:px+width/2+3,top:py-fontPx-5,bottom:py+6};
    if(box.left<offsetX+padding||box.right>offsetX+w*scale-padding||
       box.top<offsetY+padding||box.bottom>offsetY+h*scale-padding)continue;
    candidates.push({p,box,centerScore:Math.hypot(px-rect.width/2,py-rect.height/2)});
   }
  }
  candidates.sort((a,b)=>Number(a.p.ri)-Number(b.p.ri)||a.centerScore-b.centerScore);
  const occupied=[],shown=[],maxLabels=rect.width<320?23:38;
  for(const c of candidates){
   if(occupied.some(b=>c.box.left<b.right&&c.box.right>b.left&&
     c.box.top<b.bottom&&c.box.bottom>b.top))continue;
   occupied.push(c.box);shown.push(c.p);
   if(shown.length>=maxLabels)break;
  }
  const fragment=document.createDocumentFragment();
  for(const p of shown){
   const n=document.createElementNS('http://www.w3.org/2000/svg','text');
   n.setAttribute('x',p.x.toFixed(3));n.setAttribute('y',p.y.toFixed(3));
   n.setAttribute('class',p.ri?'ko-locality-label ko-ri-label':'ko-locality-label');
   n.dataset.code=p.code;
   if(p.code===selectedCode)n.classList.add('is-selected');
   n.setAttribute('font-size',(fontPx/scale).toFixed(4));
   n.textContent=p.name;
   fragment.append(n);
  }
  layer.replaceChildren(fragment);visible=shown;
 }
 // Select the actual label on tap, or the nearest local centroid when tapping
 // in the surrounding map. Unlike the old 33px hitbox, hidden labels still count.
 function hit(clientX,clientY,view,point,preferredCode=null){
  if(!emdReady||view.zoom<THRESHOLD)return null;
  const preferred=preferredCode&&byCode.get(preferredCode);
  if(preferred&&(!preferred.ri||view.zoom>=RI_THRESHOLD))return preferred;
  const rect=svg.getBoundingClientRect();
  const scale=Math.min(rect.width/(BASE_W/view.zoom),rect.height/(BASE_H/view.zoom));
  if(!(scale>0))return null;
  const maxDistance=Math.min(118,Math.max(68,rect.width*.3));
  const radius=Math.max(1,Math.ceil(maxDistance/scale/GRID));
  const gx=Math.floor(point.x/GRID),gy=Math.floor(point.y/GRID);
  let nearest=null,nearestPixels=maxDistance;
  for(let ix=gx-radius;ix<=gx+radius;ix++)for(let iy=gy-radius;iy<=gy+radius;iy++){
   for(const p of cells.get(ix+':'+iy)||[]){
    if(p.ri&&view.zoom<RI_THRESHOLD)continue;
    const d=Math.hypot(point.x-p.x,point.y-p.y)*scale;
    if(d<nearestPixels){nearest=p;nearestPixels=d;}
   }
  }
  return nearest;
 }
 function setSelected(place){
  selectedCode=place?.code||null;
  for(const node of layer.querySelectorAll('.ko-locality-label.is-selected')){
   node.classList.remove('is-selected');
  }
  if(selectedCode)for(const node of layer.querySelectorAll('.ko-locality-label')){
   if(node.dataset.code===selectedCode)node.classList.add('is-selected');
  }
 }
 function matching(place){
  if(!emdReady||!place||!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude))return null;
  const x=(place.longitude-124.15)*70.5,y=(38.98-place.latitude)*96;
  return (cells.get(key(x,y))||[]).find(p=>
   p.name===place.name&&Math.abs(p.lat-place.latitude)<.001&&Math.abs(p.lon-place.longitude)<.001)||null;
 }
 return {update,hit,matching,setSelected,get ready(){return emdReady;},get count(){return places.length;}};
};
})();