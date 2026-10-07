const TZ='Asia/Kathmandu';
const DAY_MS=86400000;
let corePromise;
const core=()=>corePromise||(corePromise=import('@inicrea/bikram-sambat-core'));

const pad=n=>String(n).padStart(2,'0');
const adKey=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
const parts=key=>{const [year,month,day]=String(key).split('-').map(Number);return{year,month,day}};
const localDateKey=(value=new Date(),tz=TZ)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const kathmanduInstant=key=>{const {year,month,day}=parts(key);return new Date(Date.UTC(year,month-1,day,0,0,0)-345*60000)};
const diffDays=(a,b)=>{const x=parts(a),y=parts(b);return Math.round((Date.UTC(y.year,y.month-1,y.day)-Date.UTC(x.year,x.month-1,x.day))/DAY_MS)};
const npDigits=s=>String(s).replace(/\d/g,d=>'०१२३४५६७८९'[Number(d)]);
const BS_MONTHS_NE=['बैशाख','जेठ','असार','साउन','भदौ','असोज','कार्तिक','मंसिर','पुस','माघ','फागुन','चैत'];
const BS_MONTHS_EN=['Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];

async function adToBsKey(key){const {adToBs}=await core();return adToBs(key)}
async function bsToAdKey(bs){const {bsToAdIso}=await core();return bsToAdIso(bs)}
async function daysInBsMonth(year,month){const c=await core();return c.daysInBsMonth(year,month)}
async function todayBs(now=new Date()){const key=localDateKey(now,TZ);return adToBsKey(key)}
function formatBs(bs,{nepali=true,withYear=true}={}){const month=(nepali?BS_MONTHS_NE:BS_MONTHS_EN)[bs.month-1];const raw=withYear?`${bs.day} ${month} ${bs.year}`:`${bs.day} ${month}`;return nepali?npDigits(raw):raw}
function formatAd(key){const {year,month,day}=parts(key);return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day)))}

async function nextBillingBoundary(settings={},from=new Date(),strictlyAfter=false){
 const calendar=settings.billingCalendar||'AD'; const day=Math.max(1,Math.floor(Number(settings.billingDay)||1)); const todayKey=localDateKey(from,settings.timezone||TZ);
 if(calendar==='BS'){
  const c=await core(); let bs=await adToBsKey(todayKey); let y=bs.year,m=bs.month;
  const make=async()=>{const dim=await daysInBsMonth(y,m);return{year:y,month:m,day:Math.min(day,dim)}};
  let candidate=await make(); let key=await bsToAdKey(candidate);
  if(key<todayKey||(strictlyAfter&&key===todayKey)){m++;if(m>12){m=1;y++}candidate=await make();key=await bsToAdKey(candidate)}
  return{dateKey:key,date:kathmanduInstant(key),bs:candidate,calendar:'BS'};
 }
 const p=parts(todayKey); let y=p.year,m=p.month; const last=new Date(Date.UTC(y,m,0)).getUTCDate(); let d=Math.min(day,last); let key=adKey(y,m,d);
 if(key<todayKey||(strictlyAfter&&key===todayKey)){m++;if(m>12){m=1;y++}d=Math.min(day,new Date(Date.UTC(y,m,0)).getUTCDate());key=adKey(y,m,d)}
 return{dateKey:key,date:kathmanduInstant(key),calendar:'AD'};
}

async function followingBillingBoundary(settings={},current){return nextBillingBoundary(settings,new Date(kathmanduInstant(localDateKey(current,settings.timezone||TZ)).getTime()+DAY_MS),false)}
async function previousBillingBoundary(settings={},current){const curKey=localDateKey(current,settings.timezone||TZ);let probe=new Date(kathmanduInstant(curKey).getTime()-40*DAY_MS);let candidate=await nextBillingBoundary(settings,probe,false);while(candidate.dateKey>=curKey){probe=new Date(probe.getTime()-40*DAY_MS);candidate=await nextBillingBoundary(settings,probe,false)}let next=await followingBillingBoundary(settings,candidate.date);while(next.dateKey<curKey){candidate=next;next=await followingBillingBoundary(settings,candidate.date)}return candidate}

async function monthGrid(calendar,year,month){
 if(calendar==='BS'){
  const c=await core(); const grid=c.getBsMonthCalendar(Number(year),Number(month),{locale:'ne',weekStartsOn:0});
  const days=grid.weeks.flat().map(x=>({key:x.ad,day:x.day,outside:!!x.outside,weekend:!!x.weekend,bs:{year:x.year,month:x.month,day:x.day}}));
  const own=days.filter(x=>!x.outside);return{calendar:'BS',year:Number(year),month:Number(month),title:`${BS_MONTHS_NE[month-1]} ${npDigits(year)}`,subtitle:`${formatAd(own[0].key)} – ${formatAd(own[own.length-1].key)}`,days,startKey:own[0].key,endKey:own[own.length-1].key};
 }
 const y=Number(year),m=Number(month);const first=new Date(Date.UTC(y,m-1,1)),last=new Date(Date.UTC(y,m,0));const start=new Date(first);start.setUTCDate(start.getUTCDate()-start.getUTCDay());const end=new Date(last);end.setUTCDate(end.getUTCDate()+(6-end.getUTCDay()));const days=[];
 for(let d=new Date(start);d<=end;d.setUTCDate(d.getUTCDate()+1)){const key=adKey(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());days.push({key,day:d.getUTCDate(),outside:d.getUTCMonth()+1!==m,weekend:[0,6].includes(d.getUTCDay())})}
 return{calendar:'AD',year:y,month:m,title:new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(first),subtitle:'English (AD)',days,startKey:adKey(y,m,1),endKey:adKey(y,m,last.getUTCDate())};
}

async function dualDate(value,settings={}){const key=typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:localDateKey(value,settings.timezone||TZ);const bs=await adToBsKey(key);return{ad:key,adLabel:formatAd(key),bs,bsLabel:formatBs(bs),primary:(settings.billingCalendar||'AD')==='BS'?formatBs(bs):formatAd(key),secondary:(settings.billingCalendar||'AD')==='BS'?formatAd(key):formatBs(bs)}}

module.exports={TZ,localDateKey,kathmanduInstant,diffDays,npDigits,formatBs,formatAd,adToBsKey,bsToAdKey,daysInBsMonth,todayBs,nextBillingBoundary,followingBillingBoundary,previousBillingBoundary,monthGrid,dualDate};
