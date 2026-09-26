const multer=require('multer');
const cloudinary=require('../config/cloudinary');
const ALLOWED=new Set(['image/jpeg','image/png','image/webp','application/pdf']);
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024},fileFilter:(req,file,cb)=>ALLOWED.has(file.mimetype)?cb(null,true):cb(Object.assign(new Error('Only JPG, PNG, WEBP or PDF files are allowed'),{status:400}))});
const configured=()=>Boolean(process.env.HOSTEL_CLOUDINARY_CLOUD_NAME&&process.env.HOSTEL_CLOUDINARY_API_KEY&&process.env.HOSTEL_CLOUDINARY_API_SECRET);
const safe=v=>String(v||'').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80);
function uploadBuffer(file,{hostelId,studentId,folder,authenticated=false}){if(!configured())throw Object.assign(new Error('Cloudinary is not configured on the server'),{status:503});const root=safe(process.env.HOSTEL_CLOUDINARY_ROOT||'sarva-hostel');const target=`${root}/${safe(hostelId)}/students/${safe(studentId)}/${folder}`;const resourceType=file.mimetype==='application/pdf'?'raw':'image';return new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:target,resource_type:resourceType,type:authenticated?'authenticated':'upload',unique_filename:true,overwrite:false},(err,result)=>err?reject(err):resolve(result));stream.end(file.buffer)})}
async function destroyAsset(file){if(!file?.publicId||!configured())return;try{await cloudinary.uploader.destroy(file.publicId,{resource_type:file.resourceType||'image',type:file.url?.includes('/authenticated/')?'authenticated':'upload',invalidate:true})}catch(e){console.error('Cloudinary cleanup failed',e.message)}}
module.exports={upload,uploadBuffer,destroyAsset};
