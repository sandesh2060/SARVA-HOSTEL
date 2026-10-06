const express=require('express'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),crypto=require('crypto');
const {sendEmail}=require('../services/email');
const {Hostel,User,Student,StudentDocument,Invoice,LateFeeEntry,Payment,CreditTransaction,Expense,StockItem,StockTransaction,Room,Bed,Attendance,Staff,Salary,Notification,Counter,AuditLog}=require('../models');
const {auth,ownerOnly}=require('../middleware/auth'); const requireCap=require('../middleware/capability'); const {capabilitiesFor}=require('../config/capabilities');
const {upload,uploadBuffer,destroyAsset,assetUrl}=require('../services/studentMedia');
const router=express.Router(); const dec=v=>Number(v?.toString?.()??v??0); const token=u=>{if(!process.env.JWT_SECRET)throw Object.assign(new Error('JWT_SECRET is not configured'),{status:500});return jwt.sign({sub:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'})};
const PAYMENT_METHODS=new Set(['cash','manual_qr','esewa','other']);
const validAmount=v=>Number.isFinite(Number(v))&&Number(v)>0;
router.post('/auth/register-hostel',async(req,res,next)=>{try{const {ownerName,email,phone,password,hostelName,address}=req.body; if(!ownerName||!email||!password||!hostelName)return res.status(400).json({message:'Required fields missing'}); if(await User.exists({email:String(email).toLowerCase(),role:'owner'}))return res.status(409).json({message:'Owner email is already registered'}); const hostel=await Hostel.create({name:hostelName,slug:`${hostelName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${Date.now().toString().slice(-5)}`,contact:{email,phone,address}}); const user=await User.create({hostelId:hostel._id,name:ownerName,email,phone,passwordHash:await bcrypt.hash(password,12),role:'owner'}); hostel.owner=user._id; await hostel.save(); res.status(201).json({message:'Registration submitted for SARVA approval',hostelId:hostel._id,status:hostel.status})}catch(e){next(e)}});
router.post('/auth/login',async(req,res,next)=>{try{const email=String(req.body.email||'').toLowerCase(); const matches=await User.find({email}).limit(2); if(matches.length>1)return res.status(409).json({message:'Multiple accounts use this email; contact SARVA support to resolve the duplicate'}); const user=matches[0]; if(!user||!user.passwordHash||!await bcrypt.compare(req.body.password||'',user.passwordHash))return res.status(401).json({message:'Invalid credentials'}); const hostel=await Hostel.findById(user.hostelId); if(user.role==='owner'&&hostel?.status!=='approved')return res.status(403).json({message:`Hostel is ${hostel?.status||'unavailable'}`}); res.json({token:token(user),user:{id:user._id,name:user.name,email:user.email,role:user.role},hostel:hostel&&{id:hostel._id,name:hostel.name,plan:hostel.plan,currency:hostel.currency,capabilities:capabilitiesFor(hostel)}})}catch(e){next(e)}});
router.get('/me',auth,async(req,res)=>res.json({user:req.user,hostel:req.hostel&&{...req.hostel.toObject(),capabilities:capabilitiesFor(req.hostel)}}));
router.post('/auth/forgot-password',async(req,res,next)=>{try{const email=String(req.body.email||'').toLowerCase().trim();if(!email)return res.status(400).json({message:'Email is required'});const user=await User.findOne({email,role:'owner'});if(user){const rawToken=crypto.randomBytes(32).toString('hex');user.resetTokenHash=crypto.createHash('sha256').update(rawToken).digest('hex');user.resetTokenExpires=new Date(Date.now()+60*60*1000);await user.save();const link=`${process.env.CLIENT_URL||'http://localhost:5173'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;try{await sendEmail({to:email,subject:'Reset your SARVA Hostel password',text:`Reset your password using this link (valid 1 hour): ${link}`})}catch(e){console.error('Password reset email failed',e.message)}}res.json({message:'If that email is registered, a reset link has been sent.'})}catch(e){next(e)}});
router.post('/auth/reset-password',async(req,res,next)=>{try{const email=String(req.body.email||'').toLowerCase().trim();const {token,password}=req.body;if(!email||!token||!password||password.length<8)return res.status(400).json({message:'Email, token and a password of at least 8 characters are required'});const tokenHash=crypto.createHash('sha256').update(token).digest('hex');const user=await User.findOne({email,role:'owner',resetTokenHash:tokenHash,resetTokenExpires:{$gt:new Date()}});if(!user)return res.status(400).json({message:'Reset link is invalid or has expired'});user.passwordHash=await bcrypt.hash(password,12);user.resetTokenHash=undefined;user.resetTokenExpires=undefined;await user.save();res.json({message:'Password updated. You can now sign in.'})}catch(e){next(e)}});
router.get('/dashboard/summary',auth,ownerOnly,async(req,res,next)=>{try{
  const h=req.hostel._id;
  const caps=capabilitiesFor(req.hostel);
  const has=c=>caps.includes(c);
  const {period,from,to}=req.query;
  const now=new Date();
  let start,end;
  if(from&&to){ start=new Date(from); end=new Date(to); }
  else if(period==='today'){ start=new Date(now); start.setHours(0,0,0,0); end=new Date(start); end.setDate(end.getDate()+1); }
  else if(period==='yesterday'){ end=new Date(now); end.setHours(0,0,0,0); start=new Date(end); start.setDate(start.getDate()-1); }
  else if(period==='this_week'||period==='week'){ start=new Date(now); start.setDate(start.getDate()-start.getDay()); start.setHours(0,0,0,0); end=new Date(start); end.setDate(end.getDate()+7); }
  else if(period==='last_month'){ start=new Date(now.getFullYear(),now.getMonth()-1,1); end=new Date(now.getFullYear(),now.getMonth(),1); }
  else if(period==='this_year'){ start=new Date(now.getFullYear(),0,1); end=new Date(now.getFullYear()+1,0,1); }
  else { start=new Date(now.getFullYear(),now.getMonth(),1); end=new Date(now.getFullYear(),now.getMonth()+1,1); }
  const spanMs=end-start;
  const prevStart=new Date(start.getTime()-spanMs);
  const prevEnd=new Date(start);

  const [activeStudents,admittedInPeriod,expenseDocs,invoiceDocs,paymentDocs,prevPaymentDocs]=await Promise.all([
    Student.countDocuments({hostelId:h,status:'active'}),
    Student.countDocuments({hostelId:h,admissionDate:{$gte:start,$lt:end}}),
    Expense.find({hostelId:h,date:{$gte:start,$lt:end}}),
    Invoice.find({hostelId:h}),
    Payment.find({hostelId:h,status:'confirmed',createdAt:{$gte:start,$lt:end}}),
    Payment.find({hostelId:h,status:'confirmed',createdAt:{$gte:prevStart,$lt:prevEnd}}),
  ]);

  const collected=paymentDocs.reduce((s,x)=>s+dec(x.amount),0);
  const prevCollected=prevPaymentDocs.reduce((s,x)=>s+dec(x.amount),0);
  const expensesTotal=expenseDocs.reduce((s,x)=>s+dec(x.amount),0);
  const openInvoices=invoiceDocs.filter(x=>x.status!=='paid'&&x.status!=='void');
  const outstanding=openInvoices.reduce((s,x)=>s+dec(x.balance),0);
  const outstandingStudents=new Set(openInvoices.map(x=>String(x.studentId))).size;
  const collectedChangePct=prevCollected>0?Math.round(((collected-prevCollected)/prevCollected)*100):null;

  const expenseByCategory=Object.values(expenseDocs.reduce((m,x)=>{const k=x.category||'Other';m[k]=m[k]||{category:k,total:0};m[k].total+=dec(x.amount);return m},{})).sort((a,b)=>b.total-a.total);

  const paymentMethods=(()=>{const m={};for(const p of paymentDocs){const k=p.method||'other';m[k]=(m[k]||0)+dec(p.amount)}const tot=Object.values(m).reduce((a,b)=>a+b,0);return Object.entries(m).map(([method,total])=>({method,total,pct:tot?Math.round(total/tot*100):0}))})();

  // Last 6 calendar-month buckets ending at the selected period's end month.
  const trend=[];
  for(let i=5;i>=0;i--){
    const bStart=new Date(end.getFullYear(),end.getMonth()-i,1);
    const bEnd=new Date(end.getFullYear(),end.getMonth()-i+1,1);
    const [pays,exps]=await Promise.all([
      Payment.find({hostelId:h,status:'confirmed',createdAt:{$gte:bStart,$lt:bEnd}}),
      Expense.find({hostelId:h,date:{$gte:bStart,$lt:bEnd}}),
    ]);
    trend.push({key:bStart.toLocaleString('default',{month:'short'}),collected:pays.reduce((s,x)=>s+dec(x.amount),0),expenses:exps.reduce((s,x)=>s+dec(x.amount),0)});
  }

  const alerts=[];

  // Upcoming (next 14 days) + overdue, derived from real open/partial invoices.
  const dayMs=86400000;
  const upcomingWindow=new Date(now.getTime()+14*dayMs);
  const withDue=openInvoices.filter(x=>x.dueDate);
  const upcomingRaw=withDue.filter(x=>new Date(x.dueDate)>=now&&new Date(x.dueDate)<=upcomingWindow).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).slice(0,8);
  const overdueRaw=withDue.filter(x=>new Date(x.dueDate)<now).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const studentIdsNeeded=[...new Set([...upcomingRaw,...overdueRaw].map(x=>String(x.studentId)))];
  const neededStudents=studentIdsNeeded.length?await Student.find({_id:{$in:studentIdsNeeded}}).select('name studentCode phone'):[];
  const studentById=Object.fromEntries(neededStudents.map(s=>[String(s._id),s]));

  const upcomingPayments=upcomingRaw.map(inv=>{
    const daysUntil=Math.ceil((new Date(inv.dueDate)-now)/dayMs);
    const status=daysUntil<=0?'due_today':daysUntil<=7?'due_soon':'scheduled';
    const st=studentById[String(inv.studentId)];
    return {invoiceId:inv._id,student:st&&{name:st.name,studentCode:st.studentCode},dueDate:inv.dueDate,balance:dec(inv.balance),currency:inv.currency,status};
  });

  // Group overdue invoices per student (oldest due date + summed outstanding).
  const overdueByStudent={};
  for(const inv of overdueRaw){
    const k=String(inv.studentId);
    if(!overdueByStudent[k])overdueByStudent[k]={invoiceId:inv._id,studentId:inv.studentId,oldestDue:inv.dueDate,outstanding:0,currency:inv.currency};
    overdueByStudent[k].outstanding+=dec(inv.balance);
    if(new Date(inv.dueDate)<new Date(overdueByStudent[k].oldestDue))overdueByStudent[k].oldestDue=inv.dueDate;
  }
  const overdueStudents=Object.values(overdueByStudent).sort((a,b)=>new Date(a.oldestDue)-new Date(b.oldestDue)).slice(0,8).map(x=>{
    const st=studentById[String(x.studentId)];
    return {invoiceId:x.invoiceId,student:st&&{name:st.name,phone:st.phone},oldestDue:x.oldestDue,daysOverdue:Math.floor((now-new Date(x.oldestDue))/dayMs),outstanding:x.outstanding,currency:x.currency};
  });
  if(overdueStudents.length)alerts.push({type:'overdue',title:`${overdueStudents.length} student(s) overdue`,detail:'Outstanding payments past their due date.',action:{label:'Review',to:'/credits'}});

  let stockSummary=null;
  if(has('stock')){
    const stockDocs=await StockItem.find({hostelId:h});
    const lowItems=stockDocs.filter(x=>x.quantity<=x.minimumQuantity&&x.quantity>0);
    const outOfStock=stockDocs.filter(x=>x.quantity<=0);
    if(outOfStock.length)alerts.push({type:'stock',title:`${outOfStock.length} item(s) out of stock`,detail:'Restock soon to avoid disruption.',action:{label:'Open stock',to:'/stock'}});
    stockSummary={low:lowItems.length||undefined,outOfStock:outOfStock.length||undefined,items:lowItems.concat(outOfStock).slice(0,8).map(x=>({id:x._id,name:x.name,quantity:x.quantity,minimumQuantity:x.minimumQuantity,unit:x.unit}))};
  }

  let occupancy=null,rooms=null;
  if(has('rooms')){
    const [roomDocs,bedDocs]=await Promise.all([Room.find({hostelId:h}),Bed.find({hostelId:h})]);
    const totalBeds=bedDocs.length;
    const occupied=bedDocs.filter(b=>b.studentId).length;
    const maintenance=bedDocs.filter(b=>b.status==='maintenance').length;
    const available=Math.max(0,totalBeds-occupied-maintenance);
    const roomsWithAvailability=roomDocs.filter(r=>bedDocs.some(b=>String(b.roomId)===String(r._id)&&!b.studentId&&b.status!=='maintenance')).length;
    occupancy={occupancyPct:totalBeds?Math.round((occupied/totalBeds)*100):0,occupied,totalBeds,available,maintenance,roomsWithAvailability};
    rooms=roomDocs.map(r=>{
      const rb=bedDocs.filter(b=>String(b.roomId)===String(r._id));
      const occ=rb.filter(b=>b.studentId).length;
      const label=[r.building,r.floor,r.name].filter(Boolean).join(' \u00b7 ')||r.name;
      const status=!rb.length?'no_beds':occ===0?'empty':occ>=rb.length?'full':'partial';
      return {id:r._id,name:label,capacity:rb.length,occupied:occ,status};
    });
    if(maintenance)alerts.push({type:'maintenance',title:`${maintenance} bed(s) in maintenance`,detail:'These beds cannot currently be assigned.',action:{label:'Open rooms',to:'/rooms'}});
  }

  let credit=null;
  if(has('credit')){
    const creditDocs=await CreditTransaction.find({hostelId:h});
    const byStudent={};
    for(const c of creditDocs){
      const k=String(c.studentId);
      const delta=c.type==='charge'?dec(c.amount):(c.type==='repayment'||c.type==='reversal')?-dec(c.amount):0;
      byStudent[k]=(byStudent[k]||0)+delta;
    }
    const balances=Object.values(byStudent).filter(v=>v>0.0001);
    const aging={current:0,d1_30:0,d31_60:0,d61_90:0,d90plus:0};
    for(const o of overdueStudents){
      const days=o.daysOverdue;
      if(days<=0)aging.current+=o.outstanding;
      else if(days<=30)aging.d1_30+=o.outstanding;
      else if(days<=60)aging.d31_60+=o.outstanding;
      else if(days<=90)aging.d61_90+=o.outstanding;
      else aging.d90plus+=o.outstanding;
    }
    credit={outstanding:balances.reduce((a,b)=>a+b,0),overdue:overdueStudents.reduce((a,x)=>a+x.outstanding,0),studentsWithCredit:balances.length,aging};
  }

  const [recentPaymentDocs,recentAdmissionDocs]=await Promise.all([
    Payment.find({hostelId:h}).sort({createdAt:-1}).limit(8).populate('studentId','name'),
    Student.find({hostelId:h}).sort({admissionDate:-1}).limit(8),
  ]);
  const recentPayments=recentPaymentDocs.map(p=>({id:p._id,student:p.studentId&&{name:p.studentId.name},method:p.method,amount:dec(p.amount),currency:p.currency,status:p.status,createdAt:p.createdAt}));
  const recentAdmissions=recentAdmissionDocs;

  let attendance=null;
  if(has('attendance')){
    const todayStart=new Date(now);todayStart.setHours(0,0,0,0);
    const todayEnd=new Date(todayStart);todayEnd.setDate(todayEnd.getDate()+1);
    const todayDocs=await Attendance.find({hostelId:h,date:{$gte:todayStart,$lt:todayEnd}});
    const count=st=>todayDocs.filter(x=>x.status===st).length;
    const recorded=todayDocs.length;
    attendance={present:count('present'),absent:count('absent'),late:count('late'),leave:count('leave'),notRecorded:Math.max(0,activeStudents-recorded)};
  }

  let staff=null;
  if(has('staff')){
    const thisMonthKey=now.toISOString().slice(0,7);
    const [staffDocs,salaryDocs]=await Promise.all([Staff.find({hostelId:h}),Salary.find({hostelId:h,periodKey:thisMonthKey})]);
    const activeStaff=staffDocs.filter(x=>x.status!=='inactive').length;
    const paidStaffIds=new Set(salaryDocs.map(x=>String(x.staffId)));
    staff={activeStaff,paidThisMonth:salaryDocs.reduce((s,x)=>s+dec(x.paid),0),remaining:salaryDocs.reduce((s,x)=>s+dec(x.remaining),0),pendingRecords:staffDocs.filter(x=>x.status!=='inactive'&&!paidStaffIds.has(String(x._id))).length};
  }

  const recentActivityDocs=await AuditLog.find({hostelId:h}).sort({createdAt:-1}).limit(10);
  const recentActivity=recentActivityDocs.map(a=>({id:a._id,label:a.action,createdAt:a.createdAt}));

  res.json({
    currency:req.hostel.currency,
    period:period||'this_month',
    from:start,
    to:end,
    students:{active:activeStudents,admittedInPeriod},
    finance:{collected,collectedChangePct,expenses:expensesTotal,outstanding,outstandingStudents,net:collected-expensesTotal,trend,paymentMethods,expenseByCategory},
    occupancy,
    rooms,
    stock:stockSummary,
    credit,
    attendance,
    staff,
    alerts,
    upcomingPayments,
    overdueStudents,
    recentPayments,
    recentAdmissions,
    recentActivity,
  });
}catch(e){next(e)}});
router.get('/dashboard',auth,ownerOnly,async(req,res,next)=>{try{const h=req.hostel._id; const [students,expenses,openInvoices,stock]=await Promise.all([Student.countDocuments({hostelId:h,status:'active'}),Expense.find({hostelId:h}),Invoice.find({hostelId:h,status:{$in:['open','partial','overdue']}}),StockItem.find({hostelId:h})]);res.json({activeStudents:students,totalExpenses:expenses.reduce((s,x)=>s+dec(x.amount),0),outstanding:openInvoices.reduce((s,x)=>s+dec(x.balance),0),lowStock:stock.filter(x=>x.quantity<=x.minimumQuantity).length,currency:req.hostel.currency})}catch(e){next(e)}});
router.get('/students',auth,ownerOnly,requireCap('students'),async(req,res,next)=>{try{const q=req.query.q; const filter={hostelId:req.hostel._id}; if(q)filter.$or=['name','email','phone','studentCode'].map(k=>({[k]:{$regex:q,$options:'i'}}));res.json(await Student.find(filter).collation({locale:'en',strength:2}).sort({name:1,studentCode:1,_id:1}))}catch(e){next(e)}});
router.post('/students',auth,ownerOnly,requireCap('students'),async(req,res,next)=>{try{const b=req.body||{};if(!b.name?.trim()||!b.phone?.trim()||!b.address?.permanent?.trim()||!b.guardian?.name?.trim()||!b.guardian?.phone?.trim())return res.status(400).json({message:'Name, phone, permanent address, parent/guardian name and phone are required'});const admission=new Date(b.admissionDate||Date.now());if(Number.isNaN(admission.getTime()))return res.status(400).json({message:'Invalid admission date'});const fee=Number(b.monthlyFee);if(!Number.isFinite(fee)||fee<0)return res.status(400).json({message:'Monthly fee must be a valid non-negative number'});const billingMode=b.billingMode||req.hostel.settings?.billingMode||'anniversary';const next=new Date(admission);if(billingMode==='calendar'){next.setDate(1);next.setMonth(next.getMonth()+1)}else next.setMonth(next.getMonth()+1);const counter=await Counter.findOneAndUpdate({hostelId:req.hostel._id,key:'studentCode'},{$inc:{seq:1}},{new:true,upsert:true,setDefaultsOnInsert:true});const student=await Student.create({...b,monthlyFee:fee,hostelId:req.hostel._id,studentCode:`STU-${String(counter.seq).padStart(5,'0')}`,admissionDate:admission,nextBillingDate:next,billingMode});await AuditLog.create({hostelId:req.hostel._id,actorId:req.user._id,actorRole:req.user.role,action:'student.create',entity:'Student',entityId:student._id,after:student.toObject()});res.status(201).json(student)}catch(e){next(e)}});
router.patch('/students/:id',auth,ownerOnly,requireCap('students'),async(req,res,next)=>{try{const student=await Student.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!student)return res.status(404).json({message:'Student not found'});const before=student.toObject();const allowed=['name','email','phone','alternatePhone','status','notes','monthlyFee','billingMode','dob','gender','bloodGroup','age'];for(const key of allowed){if(req.body[key]!==undefined)student[key]=req.body[key]}const nested=['address','guardian','localGuardian','academic','emergencyContact'];for(const key of nested){if(req.body[key]!==undefined)student[key]={...(student[key]?.toObject?.()||student[key]||{}),...req.body[key]}}if(req.body.monthlyFee!==undefined){const fee=Number(req.body.monthlyFee);if(!Number.isFinite(fee)||fee<0)return res.status(400).json({message:'Monthly fee must be a valid non-negative number'});student.monthlyFee=fee}if(req.body.status!==undefined&&!['active','on_leave','on_hold','suspended','checked_out'].includes(req.body.status))return res.status(400).json({message:'Invalid student status'});if(student.address&&!String(student.address.permanent||'').trim())return res.status(400).json({message:'Permanent address is required'});if(student.guardian&&(!String(student.guardian.name||'').trim()||!String(student.guardian.phone||'').trim()))return res.status(400).json({message:'Guardian name and phone are required'});await student.save();await AuditLog.create({hostelId:req.hostel._id,actorId:req.user._id,actorRole:req.user.role,action:'student.update',entity:'Student',entityId:student._id,before,after:student.toObject()});res.json(student)}catch(e){next(e)}});
router.get('/students/:id',auth,async(req,res,next)=>{try{const s=await Student.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!s)return res.sendStatus(404); if(req.user.role==='student'&&String(req.user._id)!==String(s.userId))return res.sendStatus(403); const [invoices,payments,credits,documentsRaw]=await Promise.all([Invoice.find({hostelId:req.hostel._id,studentId:s._id}),Payment.find({hostelId:req.hostel._id,studentId:s._id}),CreditTransaction.find({hostelId:req.hostel._id,studentId:s._id}),StudentDocument.find({hostelId:req.hostel._id,studentId:s._id})]);const documents=documentsRaw.map(x=>{const o=x.toObject();o.file={...o.file,previewUrl:assetUrl(x.file)};return o});res.json({student:s,invoices,payments,credits,documents})}catch(e){next(e)}});
router.post('/students/:id/photo',auth,ownerOnly,requireCap('students'),upload.single('photo'),async(req,res,next)=>{try{if(!req.file||req.file.mimetype==='application/pdf')return res.status(400).json({message:'JPG, PNG or WEBP photo required'});const student=await Student.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!student)return res.status(404).json({message:'Student not found'});const old=student.photo?.toObject?.()||student.photo;const a=await uploadBuffer(req.file,{hostelId:req.hostel._id,studentId:student._id,folder:'profile'});student.photo={url:a.secure_url,publicId:a.public_id,resourceType:a.resource_type};await student.save();await destroyAsset(old);res.json(student.photo)}catch(e){next(e)}});
router.post('/students/:id/documents',auth,ownerOnly,requireCap('students'),upload.single('file'),async(req,res,next)=>{try{if(!req.file)return res.status(400).json({message:'Document file required'});const student=await Student.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!student)return res.status(404).json({message:'Student not found'});const types=['citizenship','nid','passport','birth_certificate','student_id','driving_licence','other'];const type=String(req.body.type||''),side=String(req.body.side||'single');if(!types.includes(type)||!['front','back','single','other'].includes(side))return res.status(400).json({message:'Invalid document type or side'});if(['citizenship','nid'].includes(type)&&!['front','back'].includes(side))return res.status(400).json({message:'Citizenship/NID must use front or back'});const previous=await StudentDocument.findOne({hostelId:req.hostel._id,studentId:student._id,type,side});const a=await uploadBuffer(req.file,{hostelId:req.hostel._id,studentId:student._id,folder:`documents/${type}`,authenticated:true});const data={hostelId:req.hostel._id,studentId:student._id,type,side,label:req.body.label,number:req.body.number,file:{url:a.secure_url,publicId:a.public_id,resourceType:a.resource_type,format:a.format,bytes:a.bytes,originalName:req.file.originalname}};if(previous){const old=previous.file?.toObject?.()||previous.file;Object.assign(previous,data);await previous.save();await destroyAsset(old);return res.json(previous)}res.status(201).json(await StudentDocument.create(data))}catch(e){next(e)}});
router.get('/students/:id/documents',auth,ownerOnly,requireCap('students'),async(req,res,next)=>{try{const docs=await StudentDocument.find({hostelId:req.hostel._id,studentId:req.params.id}).sort({createdAt:-1});res.json(docs.map(x=>{const o=x.toObject();o.file={...o.file,previewUrl:assetUrl(x.file)};return o}))}catch(e){next(e)}});
router.delete('/students/:id/documents/:documentId',auth,ownerOnly,requireCap('students'),async(req,res,next)=>{try{const d=await StudentDocument.findOne({_id:req.params.documentId,studentId:req.params.id,hostelId:req.hostel._id});if(!d)return res.status(404).json({message:'Document not found'});const old=d.file?.toObject?.()||d.file;await d.deleteOne();await destroyAsset(old);res.json({ok:true})}catch(e){next(e)}});
router.post('/students/:id/invoices',auth,ownerOnly,requireCap('payments'),async(req,res,next)=>{try{const s=await Student.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!s)return res.sendStatus(404);const amount=Number(req.body.amount??dec(s.monthlyFee));if(!validAmount(amount))return res.status(400).json({message:'Invoice amount must be greater than zero'});const periodKey=String(req.body.periodKey||'').trim();if(!/^\d{4}-\d{2}$/.test(periodKey))return res.status(400).json({message:'periodKey must use YYYY-MM format'});const dueDate=new Date(req.body.dueDate);if(Number.isNaN(dueDate.getTime()))return res.status(400).json({message:'A valid dueDate is required'});const inv=await Invoice.create({hostelId:req.hostel._id,studentId:s._id,periodKey,currency:req.hostel.currency,dueDate,items:[{label:req.body.label||'Hostel fee',amount}],baseTotal:amount,fineTotal:0,finePolicy:{enabled:!!req.hostel.settings?.lateFee?.enabled,type:req.hostel.settings?.lateFee?.type||'daily_fixed',amount:Number(req.hostel.settings?.lateFee?.amount)||0,graceDays:Number(req.hostel.settings?.graceDays)||0,maxAmount:Number(req.hostel.settings?.lateFee?.maxAmount)||0},total:amount,paid:0,balance:amount});res.status(201).json(inv)}catch(e){if(e.code===11000)return res.status(409).json({message:'Invoice already exists for this billing period'});next(e)}});
router.post('/invoices/:id/pay',auth,ownerOnly,requireCap('payments'),async(req,res,next)=>{const session=await Invoice.startSession();try{let result;await session.withTransaction(async()=>{const inv=await Invoice.findOne({_id:req.params.id,hostelId:req.hostel._id}).session(session);if(!inv)throw Object.assign(new Error('Invoice not found'),{status:404});const amount=Number(req.body.amount);const bal=dec(inv.balance);if(!validAmount(amount)||amount>bal)throw Object.assign(new Error('Payment must be > 0 and <= outstanding balance'),{status:400});const method=req.body.method||'cash';if(!PAYMENT_METHODS.has(method))throw Object.assign(new Error('Invalid payment method'),{status:400});const p=await Payment.create([{hostelId:req.hostel._id,studentId:inv.studentId,invoiceId:inv._id,currency:inv.currency,amount,method,reference:req.body.reference,notes:req.body.notes,createdBy:req.user._id}],{session});inv.paid=dec(inv.paid)+amount;inv.balance=bal-amount;inv.status=inv.balance<=0?'paid':'partial';await inv.save({session});result={invoice:inv,payment:p[0],remaining:dec(inv.balance)};});res.json(result)}catch(e){res.status(e.status||500).json({message:e.message})}finally{await session.endSession()}});
router.get('/staff',auth,ownerOnly,requireCap('staff'),async(req,res,next)=>{try{res.json(await Staff.find({hostelId:req.hostel._id}).sort({createdAt:-1}))}catch(e){next(e)}});
router.post('/staff',auth,ownerOnly,requireCap('staff'),async(req,res,next)=>{try{const b=req.body||{};if(!b.name?.trim())return res.status(400).json({message:'Name is required'});if(!b.role?.trim())return res.status(400).json({message:'Role is required'});if(!b.phone?.trim())return res.status(400).json({message:'Phone is required'});let salary=0;if(b.monthlySalary!==undefined&&b.monthlySalary!==''){salary=Number(b.monthlySalary);if(!Number.isFinite(salary)||salary<0)return res.status(400).json({message:'Monthly salary must be a valid non-negative number'})}const joiningDate=b.joiningDate?new Date(b.joiningDate):new Date();if(Number.isNaN(joiningDate.getTime()))return res.status(400).json({message:'Invalid joining date'});const staff=await Staff.create({hostelId:req.hostel._id,name:b.name.trim(),role:b.role.trim(),email:b.email?.trim()||undefined,phone:b.phone.trim(),joiningDate,monthlySalary:salary,status:'active'});res.status(201).json(staff)}catch(e){next(e)}});
router.patch('/staff/:id',auth,ownerOnly,requireCap('staff'),async(req,res,next)=>{try{const staff=await Staff.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!staff)return res.status(404).json({message:'Staff member not found'});const b=req.body||{};if(b.name!==undefined&&!String(b.name).trim())return res.status(400).json({message:'Name is required'});if(b.status!==undefined&&!['active','inactive'].includes(b.status))return res.status(400).json({message:'Invalid staff status'});const allowed=['name','role','email','phone','joiningDate','status'];for(const key of allowed){if(b[key]!==undefined)staff[key]=b[key]}if(b.monthlySalary!==undefined){const salary=Number(b.monthlySalary);if(!Number.isFinite(salary)||salary<0)return res.status(400).json({message:'Monthly salary must be a valid non-negative number'});staff.monthlySalary=salary}await staff.save();res.json(staff)}catch(e){next(e)}});
router.delete('/staff/:id',auth,ownerOnly,requireCap('staff'),async(req,res,next)=>{try{const staff=await Staff.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!staff)return res.status(404).json({message:'Staff member not found'});const hasSalary=await Salary.exists({hostelId:req.hostel._id,staffId:staff._id});if(hasSalary)return res.status(409).json({message:'This staff member has salary records; mark them inactive instead of deleting'});await staff.deleteOne();res.json({ok:true})}catch(e){next(e)}});
for(const [path,Model,cap] of [['expenses',Expense,'expenses'],['rooms',Room,'rooms'],['beds',Bed,'rooms'],['attendance',Attendance,'attendance'],['salaries',Salary,'salary']]){router.get('/'+path,auth,ownerOnly,requireCap(cap),async(req,res,next)=>{try{res.json(await Model.find({hostelId:req.hostel._id}).sort({createdAt:-1}))}catch(e){next(e)}});router.post('/'+path,auth,ownerOnly,requireCap(cap),async(req,res,next)=>{try{res.status(201).json(await Model.create({...req.body,hostelId:req.hostel._id,currency:req.body.currency||req.hostel.currency}))}catch(e){next(e)}})}
router.get('/stock',auth,ownerOnly,requireCap('stock'),async(req,res,next)=>{try{res.json(await StockItem.find({hostelId:req.hostel._id}))}catch(e){next(e)}});
router.post('/stock',auth,ownerOnly,requireCap('stock'),async(req,res,next)=>{try{res.status(201).json(await StockItem.create({...req.body,hostelId:req.hostel._id}))}catch(e){next(e)}});
router.post('/stock/:id/move',auth,ownerOnly,requireCap('stock'),async(req,res,next)=>{try{const item=await StockItem.findOne({_id:req.params.id,hostelId:req.hostel._id});if(!item)return res.sendStatus(404);const qty=Number(req.body.quantity);const type=req.body.type;if(!['in','out','used','damaged'].includes(type))return res.status(400).json({message:'Invalid stock movement type'});if(!Number.isFinite(qty)||qty<=0)return res.status(400).json({message:'Quantity must be greater than zero'});const positive=type==='in';item.quantity=positive?item.quantity+qty:item.quantity-qty;if(item.quantity<0)return res.status(400).json({message:'Insufficient stock'});await item.save();const tx=await StockTransaction.create({hostelId:req.hostel._id,itemId:item._id,type:req.body.type,quantity:qty,note:req.body.note,createdBy:req.user._id});res.json({item,transaction:tx})}catch(e){next(e)}});
router.get('/settings',auth,ownerOnly,requireCap('settings'),(req,res)=>res.json(req.hostel));router.patch('/settings',auth,ownerOnly,requireCap('settings'),async(req,res,next)=>{try{if(req.body.name!==undefined)req.hostel.name=req.body.name;if(req.body.currency!==undefined)req.hostel.currency=String(req.body.currency).trim().toUpperCase();if(req.body.contact!==undefined)req.hostel.contact={...req.hostel.contact?.toObject?.(),...req.body.contact};if(req.body.settings!==undefined){const incoming={...req.body.settings};if(incoming.publicAdmissionEnabled!==undefined)incoming.publicAdmissionEnabled=!!incoming.publicAdmissionEnabled;if(incoming.graceDays!==undefined){incoming.graceDays=Math.max(0,Math.floor(Number(incoming.graceDays)||0))}if(incoming.lateFee!==undefined){const lf=incoming.lateFee||{};if(!['daily_fixed','one_time'].includes(lf.type||'daily_fixed'))return res.status(400).json({message:'Invalid late fee type'});incoming.lateFee={enabled:!!lf.enabled,type:lf.type||'daily_fixed',amount:Math.max(0,Number(lf.amount)||0),maxAmount:Math.max(0,Number(lf.maxAmount)||0)}}req.hostel.settings={...req.hostel.settings?.toObject?.(),...incoming};}await req.hostel.save();res.json(req.hostel)}catch(e){next(e)}});

router.get('/billing/overview',auth,ownerOnly,requireCap('payments'),async(req,res,next)=>{try{const h=req.hostel._id;const status=String(req.query.status||'all');const q={hostelId:h};if(['open','partial','paid','overdue','void'].includes(status))q.status=status;const invoices=await Invoice.find(q).populate('studentId','name studentCode phone').sort({dueDate:-1,createdAt:-1}).limit(1000).lean();const now=new Date(),monthStart=new Date(now.getFullYear(),now.getMonth(),1);const confirmed=await Payment.find({hostelId:h,status:'confirmed',createdAt:{$gte:monthStart}}).lean();const fineEntries=await LateFeeEntry.find({hostelId:h,createdAt:{$gte:monthStart}}).lean();res.json({currency:req.hostel.currency,summary:{billedThisMonth:invoices.filter(x=>new Date(x.createdAt)>=monthStart).reduce((a,x)=>a+dec(x.total),0),collectedThisMonth:confirmed.reduce((a,x)=>a+dec(x.amount),0),outstanding:invoices.filter(x=>['open','partial','overdue'].includes(x.status)).reduce((a,x)=>a+dec(x.balance),0),overdue:invoices.filter(x=>x.status==='overdue'||(x.dueDate&&new Date(x.dueDate)<now&&dec(x.balance)>0)).reduce((a,x)=>a+dec(x.balance),0),finesThisMonth:fineEntries.reduce((a,x)=>a+dec(x.amount),0)},invoices})}catch(e){next(e)}});
router.get('/analytics',auth,ownerOnly,async(req,res,next)=>{try{const h=req.hostel._id;const [students,invoices,payments,expenses]=await Promise.all([Student.find({hostelId:h}),Invoice.find({hostelId:h}),Payment.find({hostelId:h,status:'confirmed'}),Expense.find({hostelId:h})]);res.json({students:students.length,activeStudents:students.filter(x=>x.status==='active').length,invoiced:invoices.reduce((s,x)=>s+dec(x.total),0),collected:payments.reduce((s,x)=>s+dec(x.amount),0),outstanding:invoices.reduce((s,x)=>s+dec(x.balance),0),expenses:expenses.reduce((s,x)=>s+dec(x.amount),0),currency:req.hostel.currency})}catch(e){next(e)}});

router.get('/attendance/student/:id',auth,ownerOnly,requireCap('attendance'),async(req,res,next)=>{try{
  const student=await Student.findOne({_id:req.params.id,hostelId:req.hostel._id});
  if(!student)return res.status(404).json({message:'Student not found'});
  const records=await Attendance.find({hostelId:req.hostel._id,studentId:student._id}).sort({date:-1});
  const summary={present:0,absent:0,late:0,leave:0,total:records.length};
  for(const r of records){if(summary[r.status]!==undefined)summary[r.status]++}
  res.json({student:{_id:student._id,name:student.name,studentCode:student.studentCode,photo:student.photo},records,summary});
}catch(e){next(e)}});

router.post('/settings/logo',auth,ownerOnly,requireCap('settings'),upload.single('logo'),async(req,res,next)=>{try{
  if(!req.file||req.file.mimetype==='application/pdf')return res.status(400).json({message:'JPG, PNG or WEBP image required'});
  const old=req.hostel.logo?.toObject?.()||req.hostel.logo;
  const a=await uploadBuffer(req.file,{hostelId:req.hostel._id,studentId:'branding',folder:'logo'});
  req.hostel.logo={url:a.secure_url,publicId:a.public_id,resourceType:a.resource_type};
  await req.hostel.save();
  await destroyAsset(old);
  res.json(req.hostel.logo);
}catch(e){next(e)}});

router.post('/settings/qr-image',auth,ownerOnly,requireCap('settings'),upload.single('qr'),async(req,res,next)=>{try{
  if(!req.file||req.file.mimetype==='application/pdf')return res.status(400).json({message:'JPG, PNG or WEBP image required'});
  const a=await uploadBuffer(req.file,{hostelId:req.hostel._id,studentId:'branding',folder:'payment-qr'});
  req.hostel.settings={...req.hostel.settings?.toObject?.(),manualQrImage:a.secure_url};
  await req.hostel.save();
  res.json({manualQrImage:a.secure_url});
}catch(e){next(e)}});

module.exports=router;
