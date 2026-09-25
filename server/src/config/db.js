const mongoose=require('mongoose');
module.exports=()=>{
  const uri=process.env.HOSTEL_MONGODB_URI;
  if(!uri)throw new Error('HOSTEL_MONGODB_URI is missing. Put it in the project-root .env file.');
  return mongoose.connect(uri);
};
