'use strict';
const el = id => document.getElementById(id);
const status = (message, kind = '') => {
  el('status').className = 'status' + (kind ? ' ' + kind : '');
  el('status').textContent = message;
};

// 한국의 자주 검색하는 지역에 대한 대표 지점(도심 또는 군청 소재지) 좌표.
// Open-Meteo 지명 검색에 등록되지 않은 시·군도 우선 처리하기 위한 보완 목록.
const LOCAL_PLACES = [
  ['고흥군','전라남도',34.6112,127.2845,['고흥','고흥군']],
  ['경주시','경상북도',35.8562,129.2247,['경주','경주시']],
  ['광양시','전라남도',34.9407,127.6959,['광양','광양시']],
  ['고창군','전북특별자치도',35.4358,126.7021,['고창','고창군']],
  ['서울특별시','대한민국',37.5665,126.9780,['서울','서울시','서울특별시']],
  ['부산광역시','대한민국',35.1796,129.0756,['부산','부산시','부산광역시']],
  ['대구광역시','대한민국',35.8714,128.6014,['대구','대구시','대구광역시']],
  ['인천광역시','대한민국',37.4563,126.7052,['인천','인천시','인천광역시']],
  ['광주광역시','대한민국',35.1595,126.8526,['광주','광주광역시']],
  ['광주시','경기도',37.4295,127.2550,['광주','경기광주','경기도광주','광주시']],
  ['대전광역시','대한민국',36.3504,127.3845,['대전','대전시','대전광역시']],
  ['울산광역시','대한민국',35.5384,129.3114,['울산','울산시','울산광역시']],
  ['세종특별자치시','대한민국',36.4800,127.2890,['세종','세종시','세종특별자치시']],
  ['제주시','제주특별자치도',33.4996,126.5312,['제주','제주시','제주도']],
  ['서귀포시','제주특별자치도',33.2541,126.5600,['서귀포','서귀포시']],
  ['강릉시','강원특별자치도',37.7519,128.8761,['강릉','강릉시']],
  ['춘천시','강원특별자치도',37.8813,127.7298,['춘천','춘천시']],
  ['속초시','강원특별자치도',38.2070,128.5918,['속초','속초시']],
  ['원주시','강원특별자치도',37.3422,127.9202,['원주','원주시']],
  ['수원시','경기도',37.2636,127.0286,['수원','수원시']],
  ['평택시','경기도',36.9920,127.1127,['평택','평택시']],
  ['안성시','경기도',37.01083,127.27028,['안성','안성시']],
  ['용인시','경기도',37.2411,127.1776,['용인','용인시']],
  ['전주시','전북특별자치도',35.8242,127.1480,['전주','전주시']],
  ['목포시','전라남도',34.8118,126.3922,['목포','목포시']],
  ['여수시','전라남도',34.7604,127.6622,['여수','여수시']],
  ['순천시','전라남도',34.9506,127.4873,['순천','순천시']],
  ['포항시','경상북도',36.0190,129.3435,['포항','포항시']],
  ['안동시','경상북도',36.5684,128.7294,['안동','안동시']],
  ['청주시','충청북도',36.6424,127.4890,['청주','청주시']],
  ['충주시','충청북도',36.9910,127.9259,['충주','충주시']],
  ['단양군','충청북도',36.9840,128.3650,['단양','단양군']],
  ['천안시','충청남도',36.8151,127.1139,['천안','천안시']],
  ['아산시','충청남도',36.7898,127.0019,['아산','아산시']],
  ['창원시','경상남도',35.2281,128.6811,['창원','창원시']],
  ['진주시','경상남도',35.1802,128.1076,['진주','진주시']],
  ['거제시','경상남도',34.8806,128.6211,['거제','거제시']],
  ['통영시','경상남도',34.8544,128.4332,['통영','통영시']],
  ['김해시','경상남도',35.2285,128.8894,['김해','김해시']],
  ['무주군','전북특별자치도',36.0068,127.6608,['무주','무주군']]
].map(([name,admin,latitude,longitude,aliases]) => ({
  name, admin, latitude, longitude, aliases, timezone:'Asia/Seoul', countryCode:'KR'
}));

const FOREIGN_CITIES = [["뉴욕","New York","US","미국","뉴요크","뉴욕시"],["로스앤젤레스","Los Angeles","US","미국","엘에이","로스엔젤레스","로스앤젤리스","LA"],["샌프란시스코","San Francisco","US","미국","샌프란","센프란시스코"],["시카고","Chicago","US","미국"],["보스턴","Boston","US","미국"],["워싱턴","Washington DC","US","미국","워싱턴디시","워싱턴DC","워싱턴D.C."],["라스베이거스","Las Vegas","US","미국","라스베가스"],["시애틀","Seattle","US","미국"],["샌디에이고","San Diego","US","미국","샌디에고"],["마이애미","Miami","US","미국"],["올랜도","Orlando","US","미국"],["휴스턴","Houston","US","미국"],["댈러스","Dallas","US","미국","달라스"],["애틀랜타","Atlanta","US","미국","아틀란타"],["덴버","Denver","US","미국"],["필라델피아","Philadelphia","US","미국"],["포틀랜드","Portland","US","미국"],["호놀룰루","Honolulu","US","미국"],["오클랜드","Oakland","US","미국","오클랜드미국"],["밴쿠버","Vancouver","CA","캐나다","벤쿠버"],["토론토","Toronto","CA","캐나다"],["몬트리올","Montreal","CA","캐나다"],["오타와","Ottawa","CA","캐나다"],["퀘벡","Quebec City","CA","캐나다","퀘벡시"],["캘거리","Calgary","CA","캐나다","켈거리"],["런던","London","GB","영국","론돈"],["맨체스터","Manchester","GB","영국"],["리버풀","Liverpool","GB","영국"],["에든버러","Edinburgh","GB","영국","에딘버러"],["글래스고","Glasgow","GB","영국","글라스고"],["옥스퍼드","Oxford","GB","영국","옥스포드"],["케임브리지","Cambridge","GB","영국","캠브리지"],["브리스틀","Bristol","GB","영국","브리스톨"],["파리","Paris","FR","프랑스"],["니스","Nice","FR","프랑스"],["리옹","Lyon","FR","프랑스","리용"],["마르세유","Marseille","FR","프랑스","마르세이유"],["보르도","Bordeaux","FR","프랑스"],["칸","Cannes","FR","프랑스"],["스트라스부르","Strasbourg","FR","프랑스","스트라스부르그"],["베를린","Berlin","DE","독일"],["뮌헨","Munich","DE","독일","뮨헨","뮌센"],["프랑크푸르트","Frankfurt am Main","DE","독일","프랑크푸르트암마인"],["함부르크","Hamburg","DE","독일"],["쾰른","Cologne","DE","독일","퀼른","콜론"],["드레스덴","Dresden","DE","독일"],["슈투트가르트","Stuttgart","DE","독일","슈트트가르트"],["뒤셀도르프","Dusseldorf","DE","독일","뒤셀도르프"],["로마","Rome","IT","이탈리아"],["밀라노","Milan","IT","이탈리아"],["베네치아","Venice","IT","이탈리아","베니스"],["피렌체","Florence","IT","이탈리아","플로렌스"],["나폴리","Naples","IT","이탈리아"],["볼로냐","Bologna","IT","이탈리아"],["토리노","Turin","IT","이탈리아"],["베로나","Verona","IT","이탈리아"],["마드리드","Madrid","ES","스페인"],["바르셀로나","Barcelona","ES","스페인","바르샤","바셀로나"],["세비야","Seville","ES","스페인","세비아"],["발렌시아","Valencia","ES","스페인"],["그라나다","Granada","ES","스페인"],["말라가","Malaga","ES","스페인"],["빌바오","Bilbao","ES","스페인"],["리스본","Lisbon","PT","포르투갈","리쓰본"],["포르투","Porto","PT","포르투갈","포르토"],["암스테르담","Amsterdam","NL","네덜란드","암스텔담"],["로테르담","Rotterdam","NL","네덜란드"],["헤이그","The Hague","NL","네덜란드","덴하흐"],["브뤼셀","Brussels","BE","벨기에","브뤼쎌"],["브뤼헤","Bruges","BE","벨기에","브루헤"],["취리히","Zurich","CH","스위스","쮜리히"],["제네바","Geneva","CH","스위스"],["인터라켄","Interlaken","CH","스위스"],["베른","Bern","CH","스위스"],["루체른","Lucerne","CH","스위스","루체른"],["빈","Vienna","AT","오스트리아","비엔나"],["잘츠부르크","Salzburg","AT","오스트리아","짤츠부르크"],["인스브루크","Innsbruck","AT","오스트리아"],["그라츠","Graz","AT","오스트리아"],["프라하","Prague","CZ","체코","프라그"],["브르노","Brno","CZ","체코"],["부다페스트","Budapest","HU","헝가리"],["바르샤바","Warsaw","PL","폴란드","바르샤와"],["크라쿠프","Krakow","PL","폴란드","크라코프"],["코펜하겐","Copenhagen","DK","덴마크","코펜하근"],["스톡홀름","Stockholm","SE","스웨덴"],["예테보리","Gothenburg","SE","스웨덴","고텐부르크"],["오슬로","Oslo","NO","노르웨이"],["베르겐","Bergen","NO","노르웨이"],["트롬쇠","Tromso","NO","노르웨이","트롬소"],["헬싱키","Helsinki","FI","핀란드"],["로바니에미","Rovaniemi","FI","핀란드"],["레이캬비크","Reykjavik","IS","아이슬란드","레이캬빅"],["아테네","Athens","GR","그리스"],["산토리니","Fira","GR","그리스","피라"],["이스탄불","Istanbul","TR","튀르키예","이스탄블"],["앙카라","Ankara","TR","튀르키예"],["안탈리아","Antalya","TR","튀르키예"],["카이로","Cairo","EG","이집트"],["알렉산드리아","Alexandria","EG","이집트"],["마라케시","Marrakesh","MA","모로코","마라케쉬"],["카사블랑카","Casablanca","MA","모로코"],["케이프타운","Cape Town","ZA","남아프리카공화국","케이프타운"],["요하네스버그","Johannesburg","ZA","남아프리카공화국"],["두바이","Dubai","AE","아랍에미리트"],["아부다비","Abu Dhabi","AE","아랍에미리트"],["예루살렘","Jerusalem","IL","이스라엘"],["텔아비브","Tel Aviv","IL","이스라엘"],["암만","Amman","JO","요르단"],["도쿄","Tokyo","JP","일본","동경","토쿄"],["오사카","Osaka","JP","일본"],["교토","Kyoto","JP","일본","쿄토"],["고베","Kobe","JP","일본"],["나고야","Nagoya","JP","일본"],["후쿠오카","Fukuoka","JP","일본","후쿠오까"],["삿포로","Sapporo","JP","일본","삿뽀로"],["나하","Naha","JP","일본","오키나와","오키나와나하"],["히로시마","Hiroshima","JP","일본"],["나라","Nara","JP","일본"],["가나자와","Kanazawa","JP","일본"],["하코다테","Hakodate","JP","일본"],["센다이","Sendai","JP","일본"],["요코하마","Yokohama","JP","일본"],["하코네","Hakone","JP","일본"],["구마모토","Kumamoto","JP","일본"],["나가사키","Nagasaki","JP","일본"],["다카마쓰","Takamatsu","JP","일본","다카마츠","타카마츠","타카마쓰","다카마스","타카마스","다까마쓰","다카마투"],["베이징","Beijing","CN","중국","북경"],["상하이","Shanghai","CN","중국","상해"],["광저우","Guangzhou","CN","중국","광주중국"],["선전","Shenzhen","CN","중국","심천","심센"],["청두","Chengdu","CN","중국","성도"],["충칭","Chongqing","CN","중국","중경"],["시안","Xi'an","CN","중국","서안"],["칭다오","Qingdao","CN","중국","청도"],["다롄","Dalian","CN","중국","대련"],["항저우","Hangzhou","CN","중국","항주"],["난징","Nanjing","CN","중국","남경"],["우한","Wuhan","CN","중국"],["타이베이","Taipei","TW","대만","타이페이"],["타이중","Taichung","TW","대만","타이쭝"],["가오슝","Kaohsiung","TW","대만","카오슝"],["타이난","Tainan","TW","대만"],["홍콩","Hong Kong","HK","홍콩","향항"],["마카오","Macau","MO","마카오"],["싱가포르","Singapore","SG","싱가포르","싱가폴"],["방콕","Bangkok","TH","태국","방콕시"],["치앙마이","Chiang Mai","TH","태국","치앙마이시"],["푸껫","Phuket","TH","태국","푸켓"],["파타야","Pattaya","TH","태국","파타야시"],["끄라비","Krabi","TH","태국","크라비"],["하노이","Hanoi","VN","베트남"],["호찌민","Ho Chi Minh City","VN","베트남","호치민","사이공"],["다낭","Da Nang","VN","베트남","다낭시"],["나트랑","Nha Trang","VN","베트남","냐짱","나짱"],["달랏","Da Lat","VN","베트남","다랏"],["하이퐁","Haiphong","VN","베트남"],["후에","Hue","VN","베트남"],["프놈펜","Phnom Penh","KH","캄보디아"],["시엠립","Siem Reap","KH","캄보디아","씨엠립"],["비엔티안","Vientiane","LA","라오스","비안티안"],["루앙프라방","Luang Prabang","LA","라오스","루앙프라방"],["쿠알라룸푸르","Kuala Lumpur","MY","말레이시아","쿠알라룸프르"],["코타키나발루","Kota Kinabalu","MY","말레이시아"],["조호르바루","Johor Bahru","MY","말레이시아"],["조지타운","George Town","MY","말레이시아","페낭"],["자카르타","Jakarta","ID","인도네시아"],["덴파사르","Denpasar","ID","인도네시아","발리","발리섬"],["욕야카르타","Yogyakarta","ID","인도네시아","족자카르타"],["수라바야","Surabaya","ID","인도네시아"],["마닐라","Manila","PH","필리핀"],["세부","Cebu City","PH","필리핀","세부시"],["다바오","Davao","PH","필리핀"],["뉴델리","New Delhi","IN","인도","뉴델히"],["델리","Delhi","IN","인도"],["뭄바이","Mumbai","IN","인도","봄베이"],["벵갈루루","Bengaluru","IN","인도","방갈로르"],["콜카타","Kolkata","IN","인도","캘커타"],["첸나이","Chennai","IN","인도","마드라스"],["자이푸르","Jaipur","IN","인도"],["카트만두","Kathmandu","NP","네팔","카트만두시"],["포카라","Pokhara","NP","네팔"],["시드니","Sydney","AU","호주"],["멜버른","Melbourne","AU","호주","멜번"],["브리즈번","Brisbane","AU","호주"],["퍼스","Perth","AU","호주"],["애들레이드","Adelaide","AU","호주","아들레이드"],["캔버라","Canberra","AU","호주"],["골드코스트","Gold Coast","AU","호주"],["케언스","Cairns","AU","호주"],["호바트","Hobart","AU","호주"],["오클랜드","Auckland","NZ","뉴질랜드","오클랜드뉴질랜드"],["웰링턴","Wellington","NZ","뉴질랜드"],["크라이스트처치","Christchurch","NZ","뉴질랜드"],["퀸스타운","Queenstown","NZ","뉴질랜드"],["로토루아","Rotorua","NZ","뉴질랜드"],["모스크바","Moscow","RU","러시아"],["상트페테르부르크","Saint Petersburg","RU","러시아","상트페테르스부르크"],["블라디보스토크","Vladivostok","RU","러시아"],["상파울루","Sao Paulo","BR","브라질","상파울로"],["리우데자네이루","Rio de Janeiro","BR","브라질","리우"],["부에노스아이레스","Buenos Aires","AR","아르헨티나"],["멕시코시티","Mexico City","MX","멕시코","멕시코시"],["칸쿤","Cancun","MX","멕시코"],["리마","Lima","PE","페루"],["쿠스코","Cusco","PE","페루"],["산티아고","Santiago","CL","칠레"],["보고타","Bogota","CO","콜롬비아"]].map(([ko,en,cc,countryKo,...aliases])=>({ko,en,cc,countryKo,aliases:[ko,...aliases]}));

// 한글 한두 글자/현지 표기 차이로 실패하는 검색을 보완하는 로컬 후보 사전.
// 사전은 지명만 연결하고 좌표는 API 조회 결과에서만 가져옵니다.
function levenshtein(a,b){
  const prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let last=prev[0];prev[0]=i;
    for(let j=1;j<=b.length;j++){
      const prior=prev[j];
      prev[j]=Math.min(prev[j]+1,prev[j-1]+1,last+(a[i-1]===b[j-1]?0:1));
      last=prior;
    }
  }
  return prev[b.length];
}
function scoreCityAlias(input,alias){
  const q=normalizeName(input),a=normalizeName(alias);
  if(!q || !a)return -1;
  if(q===a)return 100;
  if(q.length>=2&&a.startsWith(q))return 79-Math.max(0,a.length-q.length)*2;
  if(q.length>=3&&a.includes(q))return 70-Math.max(0,a.length-q.length)*2;
  if(a.length>=3&&q.startsWith(a))return 65-Math.max(0,q.length-a.length)*2;
  if(q.length>=3&&a.length>=3){
    const distance=levenshtein(q,a);
    const maxDist=Math.min(q.length,a.length)>=6?3:Math.min(q.length,a.length)>=4?2:1;
    if(distance<=maxDist)return 66-distance*12-Math.abs(q.length-a.length)*3;
  }
  return -1;
}
function foreignSuggestions(query){
  const tokens=query.trim().split(/\s+/).filter(Boolean);
  const countryHint=tokens.length>1?tokens.slice(0,-1).join(''):'';
  const search=countryHint?tokens[tokens.length-1]:query;
  const isHangul=/[가-힣]/.test(search);
  if(!isHangul)return [];
  return FOREIGN_CITIES.map((city,index)=>{
    const score=Math.max(...city.aliases.map(a=>scoreCityAlias(search,a)));
    const countryBonus=countryHint&&city.countryKo.includes(countryHint)?20:0;
    return {...city,score:score<0?score:score+countryBonus,index};
  }).filter(city=>city.score>0 && (!countryHint||city.countryKo.includes(countryHint)))
    .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,8);
}
function showForeignSuggestions(cities,query,live=false){
  const items=el('resultItems');items.replaceChildren();
  el('resultsHead').textContent=(live?'🔎 입력 중 · ':'🌏 해외 도시 추천 · ')+`“${query}” · ${cities.length}개 후보`;
  cities.forEach(city=>{
    const btn=document.createElement('button');btn.className='result';btn.type='button';
    const title=document.createElement('span');title.textContent=`${city.ko} (${city.en}) · ${city.countryKo}`;
    const tip=document.createElement('small');
    tip.textContent=city.score>=100?'한글 지명 일치 · 선택하면 실제 위치 조회': '유사 지명 후보 · 선택하면 실제 위치 조회';
    btn.append(title,tip);
    btn.addEventListener('click',()=>lookupForeignCity(city,query));items.append(btn);
  });
  el('results').style.display='block';
}
// 지도 검색 데이터의 위치/국가를 확인하고 해당 해외 도시의 예보를 조회.
async function lookupForeignCity(city,query){
  const url='https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({
    name:city.en,count:'50',language:'en',format:'json'});
  let data=await geoJsonSilent(url,7500);
  let places=((data&&data.results)||[])
    .filter(p=>p.country_code===city.cc&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude))
    .map(p=>({...mapOpenMeteoPlace(p),ko:city.ko,country:city.countryKo}));
  let usedFallback=false;
  if(!places.length){
    // 지원되지 않는 영문 표기·해외 소도시도 OSM 기반 보조 검색으로 재확인.
    const photon='https://photon.komoot.io/api/?'+new URLSearchParams({q:city.en,limit:'12'});
    data=await geoJsonSilent(photon,8000);
    places=mapPhotonPlaces(data).filter(p=>p.countryCode===city.cc);
    usedFallback=true;
  }
  places=uniqueGeocodedPlaces(places);
  if(!places.length){
    showForeignSuggestions(foreignSuggestions(query),query);
    status('“'+city.ko+'” 위치를 확인하지 못했습니다. 다른 도시 표기를 입력해 주세요.','fail');
    return;
  }
  const simplified=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const target=simplified(city.en);
  places.sort((a,b)=>{
    const score=p=>simplified(p.name)===target?3:simplified(p.name).startsWith(target)?2:1;
    return score(b)-score(a) || b.population-a.population;
  });
  if(!usedFallback && (places.length===1 ||
      (simplified(places[0].name)===target && simplified(places[1]?.name)!==target))){
    return selectPlace(places[0],true);
  }
  showResults(places.slice(0,10),query);
  status(usedFallback?'해외 도시 보조 검색 결과입니다. 좌표를 확인하고 선택하세요. (© OpenStreetMap contributors)':
    '국가 및 좌표를 확인하고 원하는 도시를 선택하세요.','ok');
}
// 목록에 없는 한글 지명에 대한 영문 음역 재검색 (정확하지 않을 수 있어 선택 확인).
function romanizeHangul(text){
  const initials=['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const vowels=['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const finals=['','k','k','ks','n','nj','nh','t','l','lk','lm','lb','ls','lt','lp','lh','m','p','ps','t','t','ng','t','t','k','t','p','t'];
  return Array.from(text).map(ch=>{
    const code=ch.charCodeAt(0)-0xAC00;
    if(code<0||code>=11172)return ch;
    return initials[Math.floor(code/588)]+vowels[Math.floor(code%588/28)]+finals[code%28];
  }).join('');
}

function normalizeName(name) {
  return String(name || '').toLocaleLowerCase('ko').replace(/\s+/g,'').replace(/[·,._-]/g,'');
}
// 시·도 축약형과 정식 행정명칭을 동일하게 취급하고, 동명 지명의 시·도를 검증합니다.
const KOREAN_REGION_HINTS=[
  ['서울특별시',['서울특별시','서울시','서울'],'seoul'],
  ['부산광역시',['부산광역시','부산시','부산'],'busan'],
  ['대구광역시',['대구광역시','대구시','대구'],'daegu'],
  ['인천광역시',['인천광역시','인천시','인천'],'incheon'],
  ['광주광역시',['광주광역시'],'gwangju'],
  ['대전광역시',['대전광역시','대전시','대전'],'daejeon'],
  ['울산광역시',['울산광역시','울산시','울산'],'ulsan'],
  ['세종특별자치시',['세종특별자치시','세종시','세종'],'sejong'],
  ['경기도',['경기도','경기'],'gyeonggi'],
  ['강원특별자치도',['강원특별자치도','강원도','강원'],'gangwon'],
  ['충청북도',['충청북도','충북'],'chungbuk'],
  ['충청남도',['충청남도','충남'],'chungnam'],
  ['전북특별자치도',['전북특별자치도','전라북도','전북'],'jeonbuk'],
  ['전라남도',['전라남도','전남'],'jeonnam'],
  ['경상북도',['경상북도','경북'],'gyeongbuk'],
  ['경상남도',['경상남도','경남'],'gyeongnam'],
  ['제주특별자치도',['제주특별자치도','제주도'],'jeju']
];
function koreanRegionHint(query){
  const compact=normalizeName(query);
  for(const [canonical,aliases,english] of KOREAN_REGION_HINTS){
    for(const alias of aliases){
      const prefix=normalizeName(alias);
      if(compact.startsWith(prefix)&&compact.length>prefix.length){
        // '광주' 자체만으로 광역시/경기도 광주시를 단정하지 않음.
        return {canonical,english,alias,rest:String(query).trim().startsWith(alias) ? String(query).trim().slice(alias.length).trim() : compact.slice(prefix.length)};
      }
    }
  }
  return null;
}
function koreanPlaceTerms(query){
  const full=String(query||'').trim().replace(/\s+/g,' ');
  const region=koreanRegionHint(full);
  const rest=region?region.rest:full;
  const last=rest.trim().split(/\s+/).pop();
  const withoutSuffix=last&&/[가-힣]{2,}(?:시|군|구|읍|면|동|리)$/.test(last)?last.slice(0,-1):last;
  return [...new Set([full,rest,last,withoutSuffix].filter(Boolean))];
}
function matchingLocalPlaces(query) {
  const region=koreanRegionHint(query);
  const norms=koreanPlaceTerms(query).map(normalizeName);
  return LOCAL_PLACES.filter(p=>
    (!region || normalizeName(p.admin)===normalizeName(region.canonical) ||
      normalizeName(p.name)===normalizeName(region.canonical)) &&
    p.aliases.some(alias=>norms.includes(normalizeName(alias)))
  );
}
function isInRequestedRegion(place,region){
  if(!region)return true;
  if(place.countryCode!=='KR')return false;
  const admin=normalizeName(place.admin||'');
  const name=normalizeName(place.name||'');
  return admin.includes(normalizeName(region.canonical)) ||
    admin.includes(region.english) || region.aliases?.some(alias=>admin.includes(normalizeName(alias))) ||
    KOREAN_REGION_HINTS.find(item=>item[0]===region.canonical)?.[1].some(alias=>admin.includes(normalizeName(alias))) ||
    name===normalizeName(region.canonical);
}
function uniqueGeocodedPlaces(places){
  const used=new Set();
  return places.filter(p=>{
    if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return false;
    const key=[normalizeName(p.name),p.countryCode||'',p.latitude.toFixed(3),p.longitude.toFixed(3)].join('|');
    if(used.has(key))return false;
    used.add(key);return true;
  });
}
async function geoJsonSilent(url,timeoutMs=7000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('Geocoder HTTP '+response.status);
    return await response.json();
  }catch(error){
    return null;
  }finally{clearTimeout(timer);}
}
function mapOpenMeteoPlace(p){
  return {name:p.name,admin:[p.admin1,p.admin2,p.admin3].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · '),
    country:p.country,countryCode:p.country_code,latitude:Number(p.latitude),longitude:Number(p.longitude),
    timezone:p.timezone||'auto',population:p.population||0};
}
function mapPhotonPlaces(json){
  return (json&&Array.isArray(json.features)?json.features:[]).map(feature=>{
    const prop=feature.properties||{};
    const coords=feature.geometry&&feature.geometry.coordinates||[];
    return {name:prop.name||prop.city||prop.county||prop.district||'검색 지역',
      admin:[prop.state,prop.county,prop.city,prop.district].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · '),
      country:prop.country,countryCode:String(prop.countrycode||'').toUpperCase(),
      latitude:Number(coords[1]),longitude:Number(coords[0]),timezone:'auto',population:0,
      geocodeSource:'Photon / OpenStreetMap'};
  });
}
function placeLabel(p) {
  if(p.currentLocation){
    // 역지오코딩 전이나 실패 시에도 단순한 "현재 위치" 대신 GPS 좌표를 표시합니다.
    return p.identifiedName || ('GPS 좌표 ' + Number(p.latitude).toFixed(4) + '°, ' + Number(p.longitude).toFixed(4) + '°');
  }
  return (p.ko?p.ko+' ('+p.name+')':p.name) + (p.admin && p.admin !== '대한민국' ? ' · ' + p.admin : '') + (p.countryCode && p.countryCode !== 'KR' ? ' · ' + (p.country || p.countryCode) : '');
}
function formatCoords(p) { return Math.abs(p.latitude).toFixed(3)+'°'+(p.latitude>=0?'N':'S')+' · '+Math.abs(p.longitude).toFixed(3)+'°'+(p.longitude>=0?'E':'W'); }
function showResults(places, query) {
  const wrapper=el('results'), items=el('resultItems');
  items.replaceChildren();
  el('resultsHead').textContent='“'+query+'” 검색 결과 · 지역을 선택하세요 ('+places.length+'개)';
  places.forEach(p=>{
    const btn=document.createElement('button');btn.type='button';btn.className='result';
    const title=document.createElement('span');title.textContent=placeLabel(p);
    const coords=document.createElement('small');coords.textContent=formatCoords(p);
    btn.append(title,coords);btn.addEventListener('click',()=>{locationSelectionSerial++;selectPlace(p,true);});items.appendChild(btn);
  });
  wrapper.style.display='block';
}
function hideResults(){el('results').style.display='none';el('resultItems').replaceChildren();}

const wx=c=>{
  if(c===0)return ['☀️','맑음'];
  if([1,2].includes(c))return ['🌤️','대체로 맑음'];
  if(c===3)return ['☁️','흐림'];
  if([45,48].includes(c))return ['🌫️','안개'];
  if(c>=95)return ['⛈️','뇌우'];
  if(c>=71&&c<=86&&![80,81,82].includes(c))return ['🌨️','눈'];
  if(c>=51&&c<=82)return ['🌧️','비 또는 소나기'];
  return ['🌥️','기타'];
};
// 기상학적 풍향은 바람이 '불어오는' 방향: 0°=북풍, 90°=동풍, 180°=남풍.
function windLabel(degrees){
  if(!(typeof degrees==='number'&&Number.isFinite(degrees)))return '자료 없음';
  const names=['북풍','북동풍','동풍','남동풍','남풍','남서풍','서풍','북서풍'];
  const bearing=((degrees%360)+360)%360;
  return names[Math.floor((bearing+22.5)/45)%8];
}
function renderWind(direction,speed){
  const dirValid=typeof direction==='number'&&Number.isFinite(direction);
  const speedValid=typeof speed==='number'&&Number.isFinite(speed)&&speed>=0;
  const dirName=dirValid?windLabel(direction):'—';
  const bearing=dirValid?((direction%360)+360)%360:0;
  // 북풍(0°) ↓, 동풍(90°) ←, 남풍(180°) ↑, 서풍(270°) →.
  // 데이터는 바람이 불어오는 방위(From)이므로 실제 이동 방향(To)은 180° 반전.
  const travelBearing=(bearing+180)%360;
  const directionMarkup=dirValid
    ? `<span class="wind-arrow" aria-hidden="true" style="--wind-deg:${travelBearing.toFixed(1)}deg">↑</span>`
    : `<span class="wind-icon" aria-hidden="true">🧭</span>`;
  return `<div class="wind-line" aria-label="주풍향 ${dirValid?dirName:'자료 없음'}, 일 최대풍속 ${speedValid?speed.toFixed(1)+'미터 매 초':'자료 없음'}"><span class="wind-direction">${directionMarkup}${dirName}</span><span class="wind-speed"><span class="wind-icon" aria-hidden="true">💨</span><span>최대 <strong>${speedValid?speed.toFixed(1):'—'}</strong></span><span class="unit">m/s</span></span></div>`;
}

function rating(lo,hi,rain,code){
  if([95,96,99].includes(code)||rain>=8||hi>=33||lo<=0)return ['bad','⛔ 비추천'];
  if(rain<=1&&hi>=14&&hi<=26&&lo>=5&&![45,48].includes(code))return ['good','🚴 좋음'];
  return ['mid','⚠️ 주의'];
}
function getRainScaleInfo(rainValues){
  const finiteRain=rainValues.filter(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0);
  const maxRain=Math.max(10,...finiteRain);
  const scaleMax=Math.ceil(maxRain/5)*5;
  return {finiteRain,maxRain,scaleMax};
}
// 14일 최대 강수량을 기준으로 10칸 눈금 생성. 0mm는 0칸, 양수는 최소 1칸.
function rainFilledCells(value, scaleMax){
  if(!(typeof value==='number'&&Number.isFinite(value)&&value>0))return 0;
  return Math.min(10,Math.max(1,Math.ceil(value/scaleMax*10)));
}
function rainSegmentHTML(filled){
  return Array.from({length:10},(_,i)=>`<span class="rain-segment${i<filled?' filled':''}"></span>`).join('');
}
function renderRainChart(d){
  const days=d.time.slice(0,14);
  const rainValues=days.map((_,i)=>d.precipitation_sum[i]);
  const {scaleMax}=getRainScaleInfo(rainValues);
  const perCell=scaleMax/10;
  el('rainAxisMax').textContent=String(scaleMax);
  el('rainAxisHalf').textContent=String(scaleMax/2);
  el('rainLegend').innerHTML=`□ 빈칸 · ■ 채워진 칸 · <strong>1칸 ≈ ${perCell.toFixed(1)}mm</strong> · 전체 10칸 = ${scaleMax}mm`;
  el('weekScale1').textContent=`1칸 ≈ ${perCell.toFixed(1)}mm`;
  el('weekScale2').textContent=`1칸 ≈ ${perCell.toFixed(1)}mm`;
  const weekday=['일','월','화','수','목','금','토'];
  el('rainBars').innerHTML=days.map((dateStr,i)=>{
    const value=rainValues[i];
    const valid=typeof value==='number'&&Number.isFinite(value)&&value>=0;
    const amount=valid?value.toFixed(1):'—';
    const filled=valid?rainFilledCells(value,scaleMax):0;
    const dow=new Date(dateStr+'T12:00:00Z').getUTCDay();
    const cls=dow===6?'sat':dow===0?'sun':'';
    const label=valid?amount+' mm':'자료 없음';
    return `<div class="rain-column ${cls}" role="listitem" aria-label="${dateStr}, ${label}, 10칸 중 ${filled}칸" title="${dateStr}: ${label}" ><span class="rain-value">${amount}</span><div class="rain-segments" aria-hidden="true">${rainSegmentHTML(filled)}</div><span class="rain-day"><strong>${dateStr.slice(5).replace('-','/')}</strong>(${weekday[dow]})</span></div>`;
  }).join('');
}

function renderForecast(json){
  const d=json.daily;
  if(!d||!Array.isArray(d.time)||!d.time.length)throw Error('일별 예보 데이터가 없습니다.');
  const keys=['temperature_2m_max','temperature_2m_min','precipitation_sum','weather_code'];
  if(keys.some(k=>!Array.isArray(d[k])))throw Error('필요한 ECMWF 일별 항목이 없습니다.');
  const chunks=[[],[]];
  const days=d.time.slice(0,14);
  const rainValues=days.map((_,i)=>d.precipitation_sum[i]);
  const {scaleMax}=getRainScaleInfo(rainValues);
  for(let i=0;i<Math.min(14,d.time.length);i++){
    const dateStr=d.time[i];
    if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))throw Error('날짜 응답 형식이 올바르지 않습니다.');
    const hi=d.temperature_2m_max[i],lo=d.temperature_2m_min[i],rain=d.precipitation_sum[i],code=d.weather_code[i];
    const windDir=Array.isArray(d.wind_direction_10m_dominant)?d.wind_direction_10m_dominant[i]:null;
    const windMax=Array.isArray(d.wind_speed_10m_max)?d.wind_speed_10m_max[i]:null;
    const valid=[hi,lo,rain,code].every(v=>typeof v==='number'&&Number.isFinite(v));
    const day=new Date(dateStr+'T12:00:00Z').getUTCDay(),cls=day===6?'sat':day===0?'sun':'';
    const [emoji,desc]=valid?wx(code):['❔','확인 불가'];
    const [rcls,rtxt]=valid?rating(lo,hi,rain,code):['mid','판정 불가'];
    const rainValid=typeof rain==='number'&&Number.isFinite(rain)&&rain>=0;
    const rainAmount=rainValid?rain.toFixed(1):'—';
    const filled=rainValid?rainFilledCells(rain,scaleMax):0;
    chunks[i<7?0:1].push(`<article class="day ${cls}" role="button" tabindex="0" data-date="${dateStr}" aria-label="${dateStr} 시간별 상세 예보 열기"><div class="head"><div class="head-main"><span class="date">${dateStr.slice(5)} (${['일','월','화','수','목','금','토'][day]})</span><p class="desc"><span class="desc-emoji" aria-hidden="true">${emoji}</span>${desc}</p></div><div class="rain-mini" aria-label="일강수량 ${rainAmount}mm, 10칸 중 ${filled}칸"><div class="rain-mini-track" aria-hidden="true">${rainSegmentHTML(filled)}</div><span class="rain-mini-value">${rainAmount}</span><span class="rain-mini-unit">mm</span></div></div><div class="temps"><span class="high">최고 ${valid?hi.toFixed(1):'—'}°</span> / <span class="low">최저 ${valid?lo.toFixed(1):'—'}°</span></div><p class="rain-line">강수량 ${rainAmount} mm</p>${renderWind(windDir,windMax)}<span class="rating ${rcls}">${rtxt}</span><span class="day-detail-hint">▤ 시간별 상세 보기</span></article>`);
  }
  el('week1').innerHTML=chunks[0].join('');
  el('week2').innerHTML=chunks[1].join('');
  hourlyForecast=json.hourly && Array.isArray(json.hourly.time)?json.hourly:null;
  // 'auto' 요청에서는 API 응답의 실제 IANA 시간대를 사용합니다.
  forecastTimeZone=typeof json.timezone==='string' && json.timezone.trim()?json.timezone.trim():null;
  forecastUtcOffsetSeconds=Number.isFinite(json.utc_offset_seconds)?json.utc_offset_seconds:null;
  renderRainChart(d);
  renderNowPanel(json);
  el('weeks').style.display='block';
  return Math.min(14,d.time.length);
}


// 하루 최저·최고기온을 모두 반영하되, 추운 출발 시간대를 조금 더 보수적으로 반영합니다.
// Rapha Guide to Layering (2026): <6 / 6–12 / 12–18 / 18–25 / >=25 °C.
// The five existing visual tiers are retained to preserve front/back avatar animations.
function riderOutfitTier(temp){
 if(!Number.isFinite(temp))return 'mild';
 return temp<6?'winter':temp<12?'cold':temp<18?'cool':temp<25?'mild':'hot';
}
function riderOutfitPlan(low,high,currentTemp){
 const labels={
  winter:'방한 재킷 · 기모 빕타이츠 · 방한 장갑',
  cold:'긴팔 져지 · 베이스레이어 · 보온 빕타이츠',
  cool:'져지 · 질렛 · 빕숏 + 레그워머',
  mild:'반팔 져지 · 빕숏',
  hot:'경량 반팔 져지 · 통기성 빕숏'
 };
 const hasDaily=Number.isFinite(low)&&Number.isFinite(high)&&low<=high;
 // Prefer current riding conditions for the avatar, while using the daily range
 // to advise on removable layers; avoid dressing for an afternoon high at dawn.
 const effectiveTemp=Number.isFinite(currentTemp)?currentTemp:
  hasDaily?low*0.6+high*0.4:NaN;
 const tier=riderOutfitTier(effectiveTemp);
 const spread=hasDaily?high-low:0;
 let tip;
 if(tier==='winter'){
  tip='보온 베이스레이어·방풍 방한 재킷·기모 빕타이츠를 착용하고 방한 장갑·슈커버를 준비하세요.';
 }else if(tier==='cold'){
  tip='메리노 베이스레이어와 긴팔 져지에 질렛 또는 경량 재킷을 더하세요. 추우면 보온 빕타이츠를 선택하세요.';
 }else if(tier==='cool'){
  tip='반팔 져지+암워머 또는 얇은 긴팔 져지를 선택하세요. 빕숏+레그워머와 탈착 가능한 질렛을 권장합니다.';
 }else if(tier==='mild'){
  tip='통기성 반팔 져지와 빕숏을 기본으로 하고 필요하면 얇은 메쉬 베이스레이어를 착용하세요.';
 }else{
  tip='초경량 통풍 져지와 빕숏을 착용하세요. 베이스레이어는 선택 사항이며 수분·전해질 보충에 유의하세요.';
 }
 if(hasDaily&&spread>=10){
  tip+=' 일교차가 '+spread.toFixed(1)+'°이므로 탈착 가능한 겉옷을 준비하세요.';
 }
 return {
  tier,label:labels[tier],
  range:hasDaily?'오늘 최저 '+low.toFixed(1)+'° · 최고 '+high.toFixed(1)+'°'+(spread>=10?' · 일교차 '+spread.toFixed(1)+'°':''):
   Number.isFinite(currentTemp)?'현재 시간대 기온 기준 · 당일 최저·최고기온 자료 없음':'기온 자료 확인 후 착장을 추천합니다.',
  tip
 };
}
function syncRiderView(avatar){
 if(!avatar)return;
 const isBack=avatar.classList.contains('avatar-back-active');
 const front=avatar.querySelector(':scope > .avatar-bob');
 const back=avatar.querySelector(':scope > .avatar-back-view');
 if(front)front.setAttribute('aria-hidden',String(isBack));
 if(back)back.setAttribute('aria-hidden',String(!isBack));
 const turn=document.getElementById('avatarTurn');
 if(turn){
  turn.setAttribute('aria-label',isBack?'캐릭터 정면 보기':'캐릭터 뒷모습 보기');
  turn.setAttribute('aria-pressed',String(isBack));
 }
 const currentOutfit=document.getElementById('avatarOutfit')?.textContent||'라이딩 복장';
 avatar.setAttribute('aria-label',(isBack?'라이더 뒷모습':'라이더 정면')+' · '+currentOutfit);
}
function updateRiderOutfit(low,high,currentTemp){
 const avatar=document.getElementById('riderAvatar');
 const label=document.getElementById('avatarOutfit');
 const stage=avatar?.closest('.avatar-stage');
 if(!avatar||!label||!stage)return;
 const plan=riderOutfitPlan(low,high,currentTemp);
 stage.dataset.outfit=plan.tier;
 label.textContent=plan.label;
 syncRiderView(avatar);
 const range=document.getElementById('nowOutfitRange');
 const tip=document.getElementById('nowOutfitTip');
 if(range)range.textContent=plan.range;
 if(tip)tip.textContent=plan.tip;
}
let riderStartleTimer;
function riderTapFeedback(){
 // Keep native iOS switch haptics and Android vibration.
 if(typeof navigator.vibrate==='function')navigator.vibrate(12);
 const avatar=document.getElementById('riderAvatar');
 if(!avatar)return;
 clearTimeout(riderStartleTimer);
 avatar.classList.remove('avatar-confident');
 // Restart animation even for rapid repeated taps.
 void avatar.getBoundingClientRect();
 avatar.classList.add('avatar-confident');
 riderStartleTimer=setTimeout(()=>avatar.classList.remove('avatar-confident'),1180);
}
document.addEventListener('DOMContentLoaded',()=>{
 const button=document.getElementById('avatarTurn'),avatar=document.getElementById('riderAvatar');
 document.getElementById('avatarHaptic')?.addEventListener('change',riderTapFeedback);
 button?.addEventListener('click',()=>{
  if(!avatar)return;
  // Turning the rider should never trigger a victory pose or warp a sleeve.
  clearTimeout(riderStartleTimer);
  avatar.classList.remove('avatar-confident');
  avatar.classList.toggle('avatar-back-active');
  syncRiderView(avatar);
});
});
function renderNowPanel(json){
 const h=json.hourly, d=json.daily;
 const clock=forecastLocalClock();
 const key=clock.date+'T'+clock.hour;
 const time=Array.isArray(h?.time)?h.time:[];
 let index=time.findIndex(t=>typeof t==='string'&&t.slice(0,13)===key);
 if(index<0){
   const clockMs=Date.parse(key+':00Z');
   let min=Infinity;
   time.forEach((t,i)=>{const delta=Math.abs(Date.parse(t+'Z')-clockMs);if(Number.isFinite(delta)&&delta<min){min=delta;index=i;}});
 }
 const valid=index>=0&&time[index]&&time[index].slice(0,10)===clock.date;
 const get=(k)=>valid?hourlyValue(h,k,index):null;
 const temp=get('temperature_2m'), feels=get('apparent_temperature'), rain=get('precipitation');
 const humidity=get('relative_humidity_2m'), wind=get('wind_speed_10m'), direction=get('wind_direction_10m'), code=get('weather_code');
 const weather=code===null?['🌤️','날씨 확인 불가']:wx(code);
 el('nowPlace').textContent=placeLabel(selectedPlace);
 el('nowTime').textContent=clock.date.slice(5).replace('-','/')+' '+clock.hour+':'+(valid?time[index].slice(14,16):'00')+' 현지시간';
 el('nowTemp').innerHTML=(temp===null?'--':Math.round(temp))+'<span>°</span>';
 el('nowDesc').textContent=weather[1];
 el('nowIcon').textContent=weather[0];
 const todayIndex=Array.isArray(d?.time)?d.time.indexOf(clock.date):-1;
 const todayLow=todayIndex>=0&&Array.isArray(d?.temperature_2m_min)?d.temperature_2m_min[todayIndex]:null;
 const todayHigh=todayIndex>=0&&Array.isArray(d?.temperature_2m_max)?d.temperature_2m_max[todayIndex]:null;
 updateRiderOutfit(todayLow,todayHigh,temp);
 el('nowFeels').textContent='체감온도 '+(feels===null?'--':feels.toFixed(1))+'°';
 el('nowRain').textContent=rain===null?'-- mm':rain.toFixed(1)+' mm';
 el('nowHumidity').textContent=humidity===null?'--%':Math.round(humidity)+'%';
 const windDirectionEl=el('nowWindDirection');
 if(direction===null){
  windDirectionEl.textContent='—';
  windDirectionEl.setAttribute('aria-label','풍향 자료 없음');
 }else{
  const from=((direction%360)+360)%360;
  const toward=(from+180)%360;
  const name=windLabel(direction);
  windDirectionEl.innerHTML='<span class="wind-arrow" aria-hidden="true" style="--wind-deg:'+toward.toFixed(1)+'deg">↑</span>'+name;
  windDirectionEl.setAttribute('aria-label',name+' · 바람이 불어오는 방향');
 }
 el('nowWind').textContent=wind===null?'-- m/s':wind.toFixed(1)+' m/s';
 el('nowDisclaimer').textContent=valid?'※ ECMWF IFS '+time[index].slice(11,16)+' 현지시간 예보(관측값 아님) · 강수량은 1시간 기준 · 풍향명은 불어오는 방향, 화살표는 불어가는 방향':'현재 시간대 ECMWF 예보값을 확인할 수 없습니다. 아래 14일 예보를 참고하세요.';
}
document.addEventListener('DOMContentLoaded',()=>{
 const btn=document.getElementById('toggleSearch'), panel=document.getElementById('searchPanel');
 btn?.addEventListener('click',()=>{
  const closed=panel.classList.toggle('search-collapsed');
  btn.setAttribute('aria-expanded',String(!closed));
  if(!closed)document.getElementById('placeInput')?.focus();
 });
});


// Use the exact selected forecast coordinates, not the browser's current position.
function updateWindyRadarLink(place){
  const link=document.getElementById('windyRadarLink');
  if(!link)return;
  const lat=Number(place?.latitude),lon=Number(place?.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return;
  // Windy supports radar overlay, latitude, longitude and map zoom in its URL.
  const coords=[lat,lon].map(n=>n.toFixed(4));
  link.href='https://www.windy.com/-Weather-radar-radar?radar,'+coords.join(',')+',9';
  link.setAttribute('aria-label',placeLabel(place)+' 지역의 Windy 기상 레이더 열기');
}

function buildForecastUrl(p){
  const params=new URLSearchParams({
    latitude:String(p.latitude),longitude:String(p.longitude),models:'ecmwf_ifs',
    daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
    hourly:'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,cloud_cover',
    wind_speed_unit:'ms',
    forecast_days:'14',timezone:p.timezone || 'auto'
  });
  return 'https://api.open-meteo.com/v1/forecast?'+params.toString();
}
const DEFAULT_PLACE=LOCAL_PLACES.find(place=>place.name==='서울특별시');
let selectedPlace=DEFAULT_PLACE, activeController=null, retryAction=null, operationId=0;

// 최근 검색은 사용자가 직접 확정해 조회한 지역 1곳만 브라우저에 보관.
// 자동 GPS 위치/권한 거부 시 기본 서울은 이력을 덮어쓰지 않습니다.
const RECENT_PLACE_STORAGE_KEY='ridingWeather.recentSearchedPlace.v1';
function normalizedRecentPlace(place){
  if(!place || place.currentLocation || typeof place.name!=='string' || !place.name.trim())return null;
  const lat=Number(place.latitude),lon=Number(place.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
  const safeString=v=>typeof v==='string'?v.slice(0,100):'';
  return {
    name:safeString(place.name),ko:safeString(place.ko),admin:safeString(place.admin),
    country:safeString(place.country),countryCode:safeString(place.countryCode),
    latitude:lat,longitude:lon,timezone:safeString(place.timezone)||'auto'
  };
}
function loadRecentPlace(){
  try{return normalizedRecentPlace(JSON.parse(localStorage.getItem(RECENT_PLACE_STORAGE_KEY)||'null'));}
  catch(_){return null;}
}
let recentSearchedPlace=loadRecentPlace();
function renderRecentPlaceButton(){
  const button=el('recentPlaceButton');
  button.hidden=!recentSearchedPlace;
  if(!recentSearchedPlace)return;
  button.textContent='🕘 최근 · '+(recentSearchedPlace.ko||recentSearchedPlace.name);
  button.title='최근 검색: '+placeLabel(recentSearchedPlace);
  button.setAttribute('aria-label','최근 검색 지역 '+placeLabel(recentSearchedPlace)+'의 날씨 조회');
}
function rememberRecentPlace(place){
  const saved=normalizedRecentPlace(place);
  if(!saved)return;
  recentSearchedPlace=saved;
  renderRecentPlaceButton();
  try{localStorage.setItem(RECENT_PLACE_STORAGE_KEY,JSON.stringify(saved));}
  catch(_){/* 저장소 사용 불가 환경에서는 현재 탭에서만 최근 검색 표시 */}
}
renderRecentPlaceButton();
let hourlyForecast=null, previousModalFocus=null;
let forecastTimeZone=null, forecastUtcOffsetSeconds=null;
// 사용자가 직접 검색/지역 선택을 시작하면 대기 중인 자동 위치 탐지 결과로 덮어쓰지 않습니다.
let locationSelectionSerial=0, locationRequestSerial=0;
function hideDialog(){el('retryDialog').classList.remove('open');}
function showDialog(message){el('dialogDesc').textContent=message;el('retryDialog').classList.add('open');}
function setBusy(busy){el('searchButton').disabled=busy;}

function hourlyValue(data,key,i){
 const v=Array.isArray(data[key])?data[key][i]:null;
 return typeof v==='number'&&Number.isFinite(v)?v:null;
}

function hourlyWindHTML(direction){
 if(direction===null)return '—';
 const fromBearing=((direction%360)+360)%360;
 const toBearing=(fromBearing+180)%360;
 return `<span class="hour-wind"><span class="wind-arrow" aria-hidden="true" style="--wind-deg:${toBearing.toFixed(1)}deg">↑</span>${windLabel(direction)}</span>`;
}

function fmtHourly(value,digits=1,suffix=''){
 return value===null?'—':value.toFixed(digits)+suffix;
}

// 현재 시각은 선택한 도시의 현지시간을 기준으로 계산합니다.
function forecastLocalClock(now=new Date()){
 const tz=forecastTimeZone || (selectedPlace.timezone && selectedPlace.timezone!=='auto' ? selectedPlace.timezone : null);
 if(tz){
  try{
   const parts=new Intl.DateTimeFormat('en-US',{
    timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
   }).formatToParts(now);
   const p={};
   for(const part of parts)if(part.type!=='literal')p[part.type]=part.value;
   if(p.year&&p.month&&p.day&&p.hour){
    return {date:p.year+'-'+p.month+'-'+p.day,hour:p.hour,minute:p.minute||'00'};
   }
  }catch(error){
   // 잘못된 시간대 식별자는 API의 UTC 오프셋으로 대체합니다.
  }
 }
 if(Number.isFinite(forecastUtcOffsetSeconds)){
  const shifted=new Date(now.getTime()+forecastUtcOffsetSeconds*1000);
  return {date:shifted.toISOString().slice(0,10),hour:shifted.toISOString().slice(11,13),
   minute:shifted.toISOString().slice(14,16)};
 }
 // API에 시간대 정보가 없으면 기기 현지시간으로 안전하게 대체합니다.
 const two=v=>String(v).padStart(2,'0');
 return {date:now.getFullYear()+'-'+two(now.getMonth()+1)+'-'+two(now.getDate()),
  hour:two(now.getHours()),minute:two(now.getMinutes())};
}

function hourlyRainLevel(value){
 if(value===null||!Number.isFinite(value))return 0;
 const mm=Math.max(0,Math.round(value*10)/10);
 if(mm<=0)return 0;
 if(mm<0.5)return 1;
 if(mm<2)return 2;
 if(mm<5)return 3;
 if(mm<10)return 4;
 return 5;
}
function buildHourlyRows(data,dateStr,currentHourKey=null){
 if(!data||!Array.isArray(data.time))return {count:0,html:''};
 const rows=[];
 for(let i=0;i<data.time.length;i++){
  const time=data.time[i];
  if(typeof time!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)||!time.startsWith(dateStr+'T'))continue;
  const temp=hourlyValue(data,'temperature_2m',i);
  const feels=hourlyValue(data,'apparent_temperature',i);
  const rain=hourlyValue(data,'precipitation',i);
  const direction=hourlyValue(data,'wind_direction_10m',i);
  const speed=hourlyValue(data,'wind_speed_10m',i);
  const gust=hourlyValue(data,'wind_gusts_10m',i);
  const humidity=hourlyValue(data,'relative_humidity_2m',i);
  const cloud=hourlyValue(data,'cloud_cover',i);
  const code=hourlyValue(data,'weather_code',i);
  const w=code===null?['❔','자료 없음']:wx(code);
  const rainLevel=hourlyRainLevel(rain);
  const wet=rainLevel>0;
  const isNow=currentHourKey!==null&&time.slice(0,13)===currentHourKey;
  const classes=[wet?'hour-wet hour-rain-'+rainLevel:'',isNow?'hour-current':''].filter(Boolean).join(' ');
  rows.push(`<tr${classes?' class="'+classes+'"':''}${isNow?' aria-current="time"':''}><td>${time.slice(11,16)}${isNow?'<span class="hour-now-badge">지금</span>':''}</td>`+
  `<td title="${w[1]}"><span class="hour-wx">${w[0]}</span>${w[1]}</td>`+
  `<td>${fmtHourly(temp,1,'°C')}</td><td>${fmtHourly(feels,1,'°C')}</td>`+
  `<td${wet?' class="hour-rain" title="1시간 강수량 '+fmtHourly(rain,1,' mm')+' · 색상 '+rainLevel+'/5단계"':''}>${fmtHourly(rain,1,' mm')}</td>`+
  `<td>${hourlyWindHTML(direction)}</td><td>${fmtHourly(speed,1,' m/s')}</td>`+
  `<td>${fmtHourly(gust,1,' m/s')}</td><td>${fmtHourly(humidity,0,'%')}</td>`+
  `<td>${fmtHourly(cloud,0,'%')}</td></tr>`);
 }
 return {count:rows.length,html:rows.join('')};
}

function closeHourlyModal(){
 const modal=el('hourlyDialog');
 if(!modal.classList.contains('open'))return;
 modal.classList.remove('open');
 modal.setAttribute('aria-hidden','true');
 document.body.classList.remove('hourly-open');
 if(previousModalFocus&&previousModalFocus.isConnected)previousModalFocus.focus();
 previousModalFocus=null;
}

function setHourlyView(compact){
 const dialog=el('hourlyDialog').querySelector('.hour-dialog');
 dialog.classList.toggle('hour-compact',!!compact);
 const toggle=el('hourViewToggle');
 toggle.textContent=compact?'전체 10항목 보기':'핵심 4항목 보기';
 toggle.setAttribute('aria-pressed',compact?'true':'false');
 el('hourlyDialog').querySelector('.hour-table-viewport').scrollLeft=0;
}
function openHourlyModal(dateStr,trigger){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))return;
 const date=new Date(dateStr+'T12:00:00Z');
 const weekdays=['일','월','화','수','목','금','토'];
 const clock=forecastLocalClock();
 const isToday=dateStr===clock.date;
 const currentHourKey=isToday?clock.date+'T'+clock.hour:null;
 const result=buildHourlyRows(hourlyForecast,dateStr,currentHourKey);
 setHourlyView(window.matchMedia('(max-width:600px)').matches);
 el('hourlyDialogTitle').textContent='🕒 '+dateStr.slice(5).replace('-','/')+' ('+weekdays[date.getUTCDay()]+') 시간별 예보';
 el('hourlyDialogDesc').textContent='📍 '+placeLabel(selectedPlace)+' · ECMWF IFS · 현지시간 기준';
 el('hourlySummary').textContent=result.count?
   result.count+'개 시간대'+(isToday?' · 현재 '+clock.hour+':'+clock.minute+' (현지시간) 강조':'')+' · 강수량이 많을수록 행 배경색이 진해집니다.':
   '선택한 날짜의 시간별 자료가 제공되지 않습니다.';
 el('hourlyBody').innerHTML=result.count?result.html:'<tr><td colspan="10">시간별 자료가 없습니다. 다른 날짜를 선택하거나 다시 조회해 주세요.</td></tr>';
 const modal=el('hourlyDialog');
 previousModalFocus=trigger||document.activeElement;
 modal.classList.add('open');
 modal.setAttribute('aria-hidden','false');
 document.body.classList.add('hourly-open');
 const view=modal.querySelector('.hour-table-viewport');
 view.scrollTop=0;view.scrollLeft=0;
 // 오늘을 열었을 때 현재 시간 행이 화면에 보이도록 세로 스크롤합니다.
 const nowRow=view.querySelector('.hour-current');
 if(nowRow && typeof nowRow.offsetTop==='number'){
  view.scrollTop=Math.max(0,nowRow.offsetTop-view.clientHeight/2+nowRow.offsetHeight/2);
 }
 el('closeHourly').focus();
}

function activateDayCard(event){
 const target=event.target.closest('.day[data-date]');
 if(!target||!event.currentTarget.contains(target))return;
 if(event.type==='keydown'&&event.key!=='Enter'&&event.key!==' ')return;
 if(event.type==='keydown')event.preventDefault();
 openHourlyModal(target.dataset.date,target);
}

function initHourlyModalEvents(){
 ['week1','week2'].forEach(id=>{
  const box=el(id);
  box.addEventListener('click',activateDayCard);
  box.addEventListener('keydown',activateDayCard);
 });
 el('closeHourly').addEventListener('click',closeHourlyModal);
 el('hourViewToggle').addEventListener('click',()=>{
  const dialog=el('hourlyDialog').querySelector('.hour-dialog');
  setHourlyView(!dialog.classList.contains('hour-compact'));
 });
 el('hourlyDialog').addEventListener('click',event=>{
  if(event.target===el('hourlyDialog'))closeHourlyModal();
 });
 el('hourlyDialog').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeHourlyModal();return;}
  if(event.key!=='Tab')return;
  const focusables=[el('closeHourly'),el('hourViewToggle'),el('hourlyDialog').querySelector('.hour-table-viewport')];
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
}

async function requestJson(url, action, loadingText){
  if(activeController)activeController.abort();
  hideDialog();setBusy(true);status(loadingText);
  const controller=new AbortController();activeController=controller;
  const thisOperation=++operationId;let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},10000);
  retryAction=action;
  try{
    const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json();
    if(controller.signal.aborted || thisOperation!==operationId)return null;
    return data;
  }catch(error){
    if(thisOperation!==operationId)return null;
    const detail=timedOut?'10초 안에 서버 응답이 완료되지 않았습니다. 다시 시도하시겠습니까?':
      '외부 날씨 서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도하시겠습니까?';
    status(timedOut?'⏱️ 10초 초과 — 데이터 수신 실패':'⚠️ 데이터 수신 실패 — 다시 시도 가능','fail');
    showDialog(detail);
    return null;
  }finally{
    clearTimeout(timer);
    if(thisOperation===operationId){activeController=null;setBusy(false);}
  }
}


async function selectPlace(place,rememberRecent=false){
  closeHourlyModal();
  hourlyForecast=null;
  forecastTimeZone=null;
  forecastUtcOffsetSeconds=null;
  selectedPlace=place;hideResults();
  document.dispatchEvent(new CustomEvent('riding-weather:place-selected',{
    detail:{name:place.name,admin:place.admin||'',latitude:Number(place.latitude),longitude:Number(place.longitude)}
  }));
  updateWindyRadarLink(place);
  el('placeInput').value=place.currentLocation?placeLabel(place):place.ko || place.name;
  el('location').textContent='📍 '+placeLabel(place);
  el('locationDetails').textContent=formatCoords(place)+' · ECMWF IFS · 좌표 기준 모델 예보(행정구역 실측 아님) · 14일 · '+(place.timezone==='auto'?'현지시간 자동':place.timezone || '현지시간');
  el('weeks').style.display='none';
  el('nowPlace').textContent=placeLabel(place);
  el('nowTemp').innerHTML='--<span>°</span>';
  el('nowDesc').textContent='현재 시간대 예보 조회 중';
  const url=buildForecastUrl(place);
  el('source').href=url;
  const action=()=>selectPlace(place,rememberRecent);
  const json=await requestJson(url,action,placeLabel(place)+' · ECMWF IFS 예보 조회 중… (최대 10초)');
  if(!json)return false;
  try{
    const count=renderForecast(json);
    if(rememberRecent && selectedPlace===place)rememberRecentPlace(place);
    status('✅ '+placeLabel(place)+' · '+count+'일 예보 조회 완료','ok');
    el('searchPanel').classList.add('search-collapsed');
    el('toggleSearch').setAttribute('aria-expanded','false');
    return true;
  }catch(error){
    status('⚠️ 수신 데이터에 오류가 있어 예보를 표시하지 못했습니다.','fail');
    retryAction=action;
    showDialog('기상 데이터 형식이 올바르지 않습니다. 다시 시도하시겠습니까?');
    return false;
  }
}

// 지도 선택을 날씨 조회와 동기화: 지도 자체의 시·도/시군구 좌표를 바로 사용.
window.ridingWeatherSelectMapPlace=function(mapPlace){
  if(!mapPlace || !Number.isFinite(mapPlace.latitude) || !Number.isFinite(mapPlace.longitude))return false;
  locationSelectionSerial++;
  const place={
    name:mapPlace.name,admin:mapPlace.admin||'대한민국',
    country:'대한민국',countryCode:'KR',
    latitude:mapPlace.latitude,longitude:mapPlace.longitude,timezone:'Asia/Seoul'
  };
  return selectPlace(place,true);
};

// 브라우저 위치 권한을 받은 뒤 현재 좌표를 ECMWF 예보 API에 직접 적용합니다.
// GitHub Pages의 HTTPS 주소에서 실행하며, 위치 정보를 별도 서버에 저장하지 않습니다.
// 사용자가 동의하여 얻은 실시간 브라우저 좌표만 별도 역지오코딩 API에 전달합니다.
// 브라우저와 API 간에 직접 통신하며 GitHub 저장소에는 좌표를 저장하지 않습니다.
function locationNameFromReverseData(data){
  if(!data || typeof data!=='object')return '';
  const clean=v=>typeof v==='string'?v.trim():'';
  const unique=parts=>{
    const seen=new Set();
    return parts.map(clean).filter(v=>{
      const key=v.toLocaleLowerCase();
      if(!v || seen.has(key))return false;
      seen.add(key);return true;
    });
  };
  const province=clean(data.principalSubdivision);
  const city=clean(data.city);
  const locality=clean(data.locality || data.localityName);
  const country=clean(data.countryName);
  // 대한민국은 시/도 → 시/군/구 → 읍/면/동 순으로 표시합니다.
  if(data.countryCode==='KR'){
    // "서울특별시 · 서울", "부산광역시 · 부산"처럼 상위 행정구역의 중복 표기를 제거합니다.
    const administrativeCity=province && city && province.startsWith(city) &&
      /(?:특별시|광역시|특별자치시|특별자치도)$/.test(province) ? '' : city;
    const names=unique([province,administrativeCity,locality]);
    // 시/군/구가 상위 필드에 없는 경우, 제공되는 행정구역 계층에서 보충합니다.
    if(!names.some(v=>/[가-힣](구|군)$/.test(v))){
      const administrative=Array.isArray(data.localityInfo && data.localityInfo.administrative)?data.localityInfo.administrative:[];
      const district=administrative.map(x=>clean(x && x.name)).find(x=>/[가-힣](구|군)$/.test(x));
      if(district && !names.includes(district)){
        // 시/군/구는 동/읍/면보다 앞에 위치해야 합니다.
        const localityIndex=locality?names.indexOf(locality):-1;
        names.splice(localityIndex>=0?localityIndex:Math.min(1,names.length),0,district);
      }
    }
    return names.slice(0,4).join(' · ') || country;
  }
  return unique([city||locality,province,country]).join(' · ');
}
async function resolveCurrentLocationName(place){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const query=new URLSearchParams({
      latitude:String(place.latitude),
      longitude:String(place.longitude),
      localityLanguage:'ko'
    });
    const response=await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?'+query.toString(),
      {signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('역지오코딩 HTTP '+response.status);
    const data=await response.json();
    const name=locationNameFromReverseData(data);
    if(!name || selectedPlace!==place)return;
    place.identifiedName=name;
    el('location').textContent='📍 '+name;
    // 사용자가 직접 검색어를 입력하는 동안에는 검색창 내용을 덮어쓰지 않습니다.
    if(el('placeInput').value===place.name || el('placeInput').value.startsWith('GPS 좌표 ')){
      el('placeInput').value=name;
    }
    if(el('status').classList.contains('ok') && el('status').textContent.startsWith('✅ ')){
      status('✅ '+name+' · 14일 예보 조회 완료','ok');
    }
  }catch(error){
    // 지명 API 접속 실패 시 기상예보는 유지하며 GPS 좌표로 위치를 식별합니다.
    if(selectedPlace===place && el('status').classList.contains('ok') && el('status').textContent.startsWith('✅ ')){
      status('✅ GPS 좌표 기준 14일 예보 조회 완료 · 지명 확인 실패 (좌표 표시 중)','ok');
    }
  }finally{
    clearTimeout(timer);
  }
}

function locateCurrentWeather(){
  const requestId=++locationRequestSerial;
  const selectionId=locationSelectionSerial;
  const isCurrentRequest=()=>requestId===locationRequestSerial && selectionId===locationSelectionSerial;
  hideResults();
  el('location').textContent='📍 현재 위치 확인 중…';
  status('📍 브라우저 위치 접근을 허용하면 현재 위치의 14일 예보를 불러옵니다. 위치 확인 중…');
  async function showDefault(reason){
    if(!isCurrentRequest())return;
    const ok=await selectPlace(DEFAULT_PLACE);
    if(ok && isCurrentRequest()){
      status('⚠️ '+reason+' 현재 위치 대신 기본 지역인 서울특별시의 예보를 표시합니다. 도시를 직접 검색하거나 📍 현재 위치 버튼으로 다시 시도할 수 있습니다.');
    }
  }
  if(!window.isSecureContext || !navigator.geolocation){
    showDefault('이 브라우저에서는 위치정보를 사용할 수 없습니다. HTTPS 접속 및 위치 권한을 확인하세요.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position=>{
      if(!isCurrentRequest())return;
      const latitude=position.coords.latitude;
      const longitude=position.coords.longitude;
      if(!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180){
        showDefault('위치 좌표가 올바르지 않습니다.');
        return;
      }
      const currentPlace={name:'GPS 좌표',latitude,longitude,timezone:'auto',currentLocation:true};
      // 예보와 지명 변환을 병렬로 시작하여 지명 API가 지연되어도 날씨 조회가 멈추지 않도록 합니다.
      selectPlace(currentPlace);
      resolveCurrentLocationName(currentPlace);
    },
    error=>{
      if(!isCurrentRequest())return;
      const reason=error.code===1?'위치 접근이 허용되지 않았습니다.':
        error.code===2?'현재 위치를 확인할 수 없습니다.':
        error.code===3?'위치 확인 시간이 초과되었습니다.':'위치정보를 가져오지 못했습니다.';
      showDefault(reason);
    },
    {enableHighAccuracy:false,timeout:10000,maximumAge:0}
  );
}

async function searchPlace(query){
  const currentSerial=++locationSelectionSerial;
  const name=String(query||'').trim();
  if(name==='현재 위치')return locateCurrentWeather();
  if(selectedPlace.currentLocation &&
     (name===placeLabel(selectedPlace) || name===selectedPlace.name))return selectPlace(selectedPlace);
  if(!name){status('지역 이름을 입력해 주세요.','fail');el('placeInput').focus();return;}
  hideResults();
  const locals=matchingLocalPlaces(name);
  if(locals.length===1)return selectPlace(locals[0],true);
  if(locals.length>1){showResults(locals,name);status('동명이 지역이 있습니다. 정확한 지역을 선택하세요.');return;}
  const guesses=foreignSuggestions(name);
  if(guesses.length){
    showForeignSuggestions(guesses,name);
    status('유사한 해외 도시 후보를 찾았습니다. 정확한 위치를 선택하세요.','ok');
    return;
  }

  // 도시명만 가능한 단일 API 검색 대신, 광역 행정구역/시·군·구 변형을 병렬 검색.
  // 보조 OSM 기반 Photon 검색은 사용자가 검색 버튼을 누른 경우에만 호출합니다.
  const region=koreanRegionHint(name);
  const korean=/[가-힣]/.test(name);
  const candidates=koreanPlaceTerms(name);
  const searches=[];
  for(const term of candidates.slice(0,3)){
    searches.push({term,language:korean?'ko':'en'});
  }
  if(korean){
    const core=candidates[candidates.length-1];
    const latin=romanizeHangul(core).replace(/\s+/g,' ').trim();
    if(latin&&latin!==core)searches.push({term:latin,language:'en'});
  }
  const current=()=>currentSerial===locationSelectionSerial;
  let handedToForecast=false;
  setBusy(true);
  status('“'+name+'” 지명을 확인하는 중…');
  try{
    const payloads=await Promise.all(searches.slice(0,4).map(async entry=>{
      const url='https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({
        name:entry.term,count:'20',language:entry.language,format:'json'
      });
      return geoJsonSilent(url,7000);
    }));
    if(!current())return;
    let places=uniqueGeocodedPlaces(payloads.flatMap(data=>
      ((data&&data.results)||[]).map(mapOpenMeteoPlace)));
    if(region)places=places.filter(place=>isInRequestedRegion(place,region));
    // 한글 행정구역 검색을 엉뚱한 외국 동명이 지역으로 연결하지 않음.
    if(korean&&!region)places.sort((a,b)=>Number(b.countryCode==='KR')-Number(a.countryCode==='KR'));

    let fromPhoton=false;
    if(!places.length){
      // Photon: OpenStreetMap 기반 시·군·구/읍·면·동/해외 소도시 보완.
      // 자동완성·주기적 호출 없음. 외부 API 부담을 줄이기 위해 마지막 수단으로만 사용.
      for(const term of [...new Set([name,region?region.rest:candidates[candidates.length-1]])]){
        if(!current())return;
        const params=new URLSearchParams({q:term,limit:'15'});
        if(region)params.set('bbox','124,33,132,39');
        const data=await geoJsonSilent('https://photon.komoot.io/api/?'+params.toString(),8000);
        const found=uniqueGeocodedPlaces(mapPhotonPlaces(data));
        places=region?found.filter(place=>isInRequestedRegion(place,region)):found;
        if(places.length){fromPhoton=true;break;}
      }
    }
    if(!current())return;
    if(!places.length){
      retryAction=()=>searchPlace(name);
      status('“'+name+'”의 위치를 확인하지 못했습니다. 행정구역을 포함하거나 다른 표기로 검색해 주세요.','fail');
      return;
    }
    places.sort((a,b)=>Number(b.countryCode==='KR')-Number(a.countryCode==='KR') ||
      Number(b.population||0)-Number(a.population||0));
    // 보조 검색 결과는 자동으로 확정하지 않음(동명이 지명/유사 이름 방지).
    if(places.length===1&&!fromPhoton){
      handedToForecast=true;
      return selectPlace(places[0],true);
    }
    showResults(places.slice(0,12),name);
    status(fromPhoton?'보조 지명 검색 결과입니다. 위치·좌표를 확인하고 선택하세요. (© OpenStreetMap contributors)':
      '지명 후보를 찾았습니다. 시·도와 좌표를 확인하고 선택하세요.','ok');
  }finally{
    if(current()&&!handedToForecast)setBusy(false);
  }
}

// 입력 중에도 해외 도시 유사 후보를 즉시 제시 (추가 API 요청 없음).
el('placeInput').addEventListener('input',()=>{
  locationSelectionSerial++;
  const q=el('placeInput').value.trim();
  if(!q||!/[가-힣]/.test(q)){hideResults();return;}
  // 기존 국내 정확 일치 도시는 빠른 검색 흐름을 방해하지 않습니다.
  if(matchingLocalPlaces(q).length)return;
  const matches=foreignSuggestions(q);
  if(matches.length)showForeignSuggestions(matches,q,true);
  else hideResults();
});
el('searchForm').addEventListener('submit',event=>{event.preventDefault();searchPlace(el('placeInput').value);});
document.querySelectorAll('[data-place]').forEach(button=>button.addEventListener('click',()=>{
  el('placeInput').value=button.dataset.place;searchPlace(button.dataset.place);
}));
el('currentLocationButton').addEventListener('click',()=>{locationSelectionSerial++;locateCurrentWeather();});
el('recentPlaceButton').addEventListener('click',()=>{
  if(!recentSearchedPlace)return;
  locationSelectionSerial++; // 대기 중인 자동 위치 확인이나 이전 검색 결과는 무효화
  selectPlace({...recentSearchedPlace},true); // 저장 좌표로 직접 조회하여 동명이 지역 재검색 방지
});
el('dismiss').addEventListener('click',hideDialog);
el('retryDialogButton').addEventListener('click',()=>{if(retryAction)retryAction();});
initHourlyModalEvents();
// 첫 실행은 브라우저 위치 권한을 요청하여 현재 좌표 기준 예보 조회. 거부/실패 시 서울로 대체.
locateCurrentWeather();

/* UCI 남녀 월드투어 2026: 공식 발표 일정. 경기별 출발 시간 미확인 시 표시하지 않음. */
const UCI_EVENTS=[
 {id:'lombardia26',name:'일 롬바르디아',start:'2026-10-10',end:'2026-10-10',city:'베르가모',country:'이탈리아',lat:45.6983,lon:9.6773,tz:'Europe/Rome',startTime:null,url:'https://www.ilombardia.it/en/',riders:[['Remco Evenepoel','Red Bull–BORA–hansgrohe'],['Isaac del Toro','UAE Team Emirates–XRG'],['Brandon McNulty','UAE Team Emirates–XRG']]},
 {id:'guangxi26',name:'투어 오브 광시',start:'2026-10-13',end:'2026-10-18',city:'충쭤',country:'중국',lat:22.4044,lon:107.3539,tz:'Asia/Shanghai',startTime:null,url:'https://www.uci.org/discipline/road/6TBjsDD8902tud440iv1Cu?tab=calendar',riders:[['Paul Magnier','Soudal Quick-Step'],['Olav Kooij','Decathlon CMA CGM'],['Juan Ayuso','Lidl–Trek'],['Kaden Groves','Alpecin–Premier Tech']]},
 {id:'guangxiwomen26',name:'투어 오브 광시 (여자)',start:'2026-10-18',end:'2026-10-18',city:'난닝',country:'중국',lat:22.817,lon:108.3669,tz:'Asia/Shanghai',startTime:null,url:'https://www.uci.org/discipline/road/6TBjsDD8902tud440iv1Cu?tab=calendar',riders:[]}
];
const UCI_NOW=new Date();
function uciDate(d){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
function uciWeekRange(){
 const ymd=uciDate(new Date()),[y,m,d]=ymd.split('-').map(Number);
 const day=new Date(Date.UTC(y,m-1,d)),mon=(day.getUTCDay()+6)%7;
 const a=new Date(day.getTime()-mon*86400000),b=new Date(a.getTime()+6*86400000);
 return [a.toISOString().slice(0,10),b.toISOString().slice(0,10)];
}
function uciShort(s){return s.slice(5).replace('-','/');}
function uciRender(){
 const [a,b]=uciWeekRange(),events=UCI_EVENTS.filter(e=>e.start<=b&&e.end>=a);
 document.getElementById('uciWeek').textContent=uciShort(a)+' ~ '+uciShort(b)+' · 남녀 WorldTour';
 const box=document.getElementById('uciSchedule'),empty=events.length===0;
 document.querySelector('.uci-strip')?.classList.toggle('uci-no-events',empty);
 if(empty)document.getElementById('uciWeek').textContent='이번 주 예정 경기 없음 · 최근 경기 보기';
 box.replaceChildren();
 if(!empty)events.forEach(e=>box.appendChild(uciRaceButton(e)));
}
function uciRaceButton(e){
 const b=document.createElement('button');b.className='uci-event';b.type='button';
 const t=document.createElement('span'),title=document.createElement('strong'),sub=document.createElement('small');
 title.textContent=e.name;sub.textContent=uciShort(e.start)+(e.start===e.end?'':' ~ '+uciShort(e.end))+' · '+e.country+' '+e.city;
 t.append(title,sub);const arrow=document.createElement('span');arrow.textContent='›';b.append(t,arrow);
 b.addEventListener('click',()=>uciShowRace(e));return b;
}
async function uciShowRace(e){
 const detail=document.getElementById('uciDetail');detail.classList.add('show');detail.replaceChildren();
 const heading=document.createElement('h3');heading.textContent=e.name+' · '+e.city;detail.append(heading);
 const weather=document.createElement('div');weather.className='uci-weather';weather.textContent='ECMWF IFS 경기 지역 예보 확인 중…';detail.append(weather);
 const link=document.createElement('a');link.className='uci-link';link.href=e.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='대회·공식 일정 확인 ↗';detail.append(link);
 const label=document.createElement('div');label.className='uci-note';label.style.marginTop='10px';
 label.textContent='주요 출전 선수 · 확정 명단에 있는 선수 (캐릭터는 스타일화한 아이콘)';
 detail.append(label);
 if(e.riders.length){
   const row=document.createElement('div');row.className='uci-riders';
   e.riders.forEach(([name,team],i)=>{
     const card=document.createElement('div');card.className='uci-rider';
     const art=document.createElement('div');art.className='uci-rider-art';art.textContent=['🚴🏻','🚴🏽','🚴🏼','🚴'][i%4];
     const n=document.createElement('div');n.className='uci-rider-name';n.textContent=name;
     const t=document.createElement('div');t.className='uci-rider-team';t.textContent=team;
     card.append(art,n,t);row.append(card);
   });detail.append(row);
 }else{const p=document.createElement('p');p.className='uci-note';p.textContent='확정 참가 선수 정보가 확인되지 않아 표시하지 않습니다.';detail.append(p);}
 const when=e.startTime?('경기 시작 '+e.startTime+' (현지시간)'):'경기 시작 시각 미확인';
 const today=uciDate(new Date()),end=uciDate(new Date(Date.now()+13*86400000));
 if(e.end<today||e.start>end){
   weather.textContent=when+' · 14일 예보 범위 밖이므로 경기 시각 날씨를 표시할 수 없습니다.';return;
 }
 if(!e.startTime){weather.textContent='경기 시작 시각이 확인되지 않았습니다. 해당 지역의 경기 날짜 예보를 조회합니다.';}
 try{
   const api='https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({
    latitude:String(e.lat),longitude:String(e.lon),models:'ecmwf_ifs',
    hourly:'temperature_2m,precipitation,weather_code,wind_speed_10m',
    timezone:e.tz,wind_speed_unit:'ms',forecast_days:'14'});
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
   let resp;try{resp=await fetch(api,{signal:controller.signal});}finally{clearTimeout(timer);}
   if(!resp.ok)throw Error('HTTP '+resp.status);
   const json=await resp.json(),times=json.hourly?.time||[],idx=times.findIndex(t=>t.startsWith(e.start)&&(e.startTime?t.slice(11,16)===e.startTime:t.slice(11,13)==='12'));
   if(idx<0){weather.textContent=when+' · 해당 시각 예보 자료가 없습니다.';return;}
   const h=json.hourly;weather.textContent=(e.startTime?'경기 시작':'경기 날짜 12:00 기준')+' · '+e.city+' 현지 '+times[idx].replace('T',' ')+' | '+Number(h.temperature_2m[idx]).toFixed(1)+'°C · 강수 '+Number(h.precipitation[idx]).toFixed(1)+'mm/h · 풍속 '+Number(h.wind_speed_10m[idx]).toFixed(1)+'m/s (ECMWF IFS)';
 }catch(err){weather.textContent=when+' · 기상 API 연결 실패. 잠시 후 다시 선택해 주세요.';}
}
document.getElementById('uciArchiveToggle').addEventListener('click',()=>{
 const box=document.getElementById('uciSchedule'),open=box.dataset.archive==='yes';
 box.dataset.archive=open?'no':'yes';
 document.getElementById('uciArchiveToggle').textContent=open?'최근 경기 ▾':'접기 ▴';
 document.querySelector('.uci-strip')?.classList.remove('uci-no-events');
 if(open){uciRender();document.getElementById('uciDetail').classList.remove('show');return;}
 box.replaceChildren();
 UCI_EVENTS.slice().reverse().forEach(e=>box.appendChild(uciRaceButton(e)));
});
uciRender();
