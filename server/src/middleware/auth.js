const jwt=require('jsonwebtoken');
const {User,Hostel}=require('../models');
exports.auth=async(req,res,next)=>{try{
  const raw=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!raw)return res.status(401).json({message:'Authentication required'});
  if(!process.env.JWT_SECRET)throw new Error('JWT_SECRET is not configured');
  const p=jwt.verify(raw,process.env.JWT_SECRET);
  const user=await User.findById(p.sub);
  if(!user||!user.active)return res.status(401).json({message:'Invalid session'});
  req.user=user;
  if(user.hostelId){
    req.hostel=await Hostel.findById(user.hostelId);
    if(!req.hostel)return res.status(401).json({message:'Hostel unavailable'});
    if(req.hostel.status!=='approved')return res.status(403).json({message:`Hostel is ${req.hostel.status}`});
  }
  next();
}catch(e){
  if(e.message==='JWT_SECRET is not configured')return next(e);
  res.status(401).json({message:'Invalid session'});
}};
exports.ownerOnly=(req,res,next)=>req.user?.role==='owner'?next():res.status(403).json({message:'Owner access required'});
