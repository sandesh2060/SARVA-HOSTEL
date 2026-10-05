const {Invoice,LateFeeEntry,Hostel}=require('../models');
const n=v=>Number(v?.toString?.()??v??0); const round=v=>Math.round(Number(v)*100)/100;
const dateKey=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
function calendarDays(a,b){const x=Date.UTC(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate());const y=Date.UTC(b.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate());return Math.max(0,Math.floor((y-x)/86400000));}
async function applyLateFeesForHostel(hostel,now=new Date()){
 const invoices=await Invoice.find({hostelId:hostel._id,status:{$in:['open','partial','overdue']},balance:{$gt:0},dueDate:{$lt:now}});
 let applied=0;
 for(const inv of invoices){
  const policy=inv.finePolicy?.enabled===undefined?{enabled:!!hostel.settings?.lateFee?.enabled,type:hostel.settings?.lateFee?.type||'daily_fixed',amount:Number(hostel.settings?.lateFee?.amount)||0,graceDays:Number(hostel.settings?.graceDays)||0,maxAmount:Number(hostel.settings?.lateFee?.maxAmount)||0}:inv.finePolicy;
  if(!policy?.enabled||!(Number(policy.amount)>0)||!inv.dueDate)continue;
  const overdue=calendarDays(new Date(inv.dueDate),now); if(overdue<=Number(policy.graceDays||0))continue;
  const eligibleDays=overdue-Number(policy.graceDays||0); const desired=policy.type==='one_time'?Number(policy.amount):eligibleDays*Number(policy.amount);
  const capped=Number(policy.maxAmount)>0?Math.min(desired,Number(policy.maxAmount)):desired; const current=n(inv.fineTotal); const delta=round(capped-current); if(delta<=0)continue;
  const key=policy.type==='one_time'?'once':dateKey(now);
  try{await LateFeeEntry.create({hostelId:hostel._id,studentId:inv.studentId,invoiceId:inv._id,dateKey:key,amount:delta,currency:inv.currency,ruleType:policy.type,daysOverdue:overdue});}
  catch(e){if(e?.code===11000)continue;throw e}
  inv.baseTotal=n(inv.baseTotal)||Math.max(0,n(inv.total)-current); inv.fineTotal=round(current+delta); inv.total=round(n(inv.baseTotal)+n(inv.fineTotal)); inv.balance=round(n(inv.total)-n(inv.paid)); inv.status='overdue'; await inv.save(); applied++;
 }
 return applied;
}
async function applyLateFeesAll(now=new Date()){const hostels=await Hostel.find({status:'approved'});let total=0;for(const h of hostels)total+=await applyLateFeesForHostel(h,now);return total;}
module.exports={applyLateFeesForHostel,applyLateFeesAll};
