const cron=require('node-cron');
const {Student,Hostel,Invoice,AdvanceCreditTransaction}=require('../models');
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
  if(settings.autoApplyStudentCredit!==false&&amount(s.advanceCredit)>0){
   const inv=await Invoice.findOne({hostelId:h._id,studentId:s._id,periodKey:key});
   if(inv&&amount(inv.balance)>0){const before=amount(s.advanceCredit),applied=Math.round(Math.min(before,amount(inv.balance))*100)/100;if(applied>0){inv.paid=Math.round((amount(inv.paid)+applied)*100)/100;inv.balance=Math.round(Math.max(0,amount(inv.total)-amount(inv.paid))*100)/100;inv.status=inv.balance<=0?'paid':'partial';s.advanceCredit=Math.round((before-applied)*100)/100;await inv.save();await s.save();await AdvanceCreditTransaction.create({hostelId:h._id,studentId:s._id,invoiceId:inv._id,currency:h.currency,type:'applied',amount:applied,balanceBefore:before,balanceAfter:amount(s.advanceCredit),reason:'Automatic credit application to monthly invoice'});}}
  }
  const next=await followingBillingBoundary(settings,s.nextBillingDate);s.nextBillingDate=next.date;await s.save();
 }
}
exports.startBillingJob=()=>cron.schedule('15 0 * * *',()=>runBilling().catch(console.error),{timezone:'Asia/Kathmandu'});
exports.runBilling=runBilling;
