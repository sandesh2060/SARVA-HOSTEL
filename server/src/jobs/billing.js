const cron=require('node-cron');
const {Student,Hostel,Invoice}=require('../models');
const {localDateKey,followingBillingBoundary}=require('../services/calendarService');
const amount=v=>Number(v?.toString?.()??v??0);

async function runBilling(now=new Date()){
 const students=await Student.find({status:'active',nextBillingDate:{$lte:now}});
 for(const s of students){
  const h=await Hostel.findById(s.hostelId);if(!h||h.status!=='approved')continue;
  const settings=h.settings?.toObject?.()||h.settings||{};
  const key=localDateKey(s.nextBillingDate,settings.timezone||'Asia/Kathmandu');
  const fee=amount(s.monthlyFee);
  await Invoice.updateOne(
   {hostelId:h._id,studentId:s._id,periodKey:key},
   {$setOnInsert:{currency:h.currency,dueDate:s.nextBillingDate,items:[{label:'Monthly hostel fee',amount:fee}],baseTotal:fee,fineTotal:0,finePolicy:{enabled:!!settings.lateFee?.enabled,type:settings.lateFee?.type||'daily_fixed',amount:Number(settings.lateFee?.amount)||0,graceDays:Number(settings.graceDays)||0,maxAmount:Number(settings.lateFee?.maxAmount)||0},total:fee,paid:0,balance:fee,status:'open'}},
   {upsert:true}
  );
  const next=await followingBillingBoundary(settings,s.nextBillingDate);s.nextBillingDate=next.date;await s.save();
 }
}
exports.startBillingJob=()=>cron.schedule('15 0 * * *',()=>runBilling().catch(console.error),{timezone:'Asia/Kathmandu'});
exports.runBilling=runBilling;
