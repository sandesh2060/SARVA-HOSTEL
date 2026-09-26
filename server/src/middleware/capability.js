const {capabilitiesFor}=require('../config/capabilities');
module.exports=(cap)=>(req,res,next)=>{
  if(req.hostel&&capabilitiesFor(req.hostel).includes(cap))return next();
  return res.status(403).json({success:false,message:`Feature not enabled: ${cap}`,code:'FEATURE_NOT_ENABLED'});
};
