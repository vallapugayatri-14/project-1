const router=require("express").Router();
const bcrypt=require("bcryptjs"); const jwt=require("jsonwebtoken"); const supabase=require("../supabase");
const {cleanString,validEmail}=require("../utils/validation");
router.post("/register",async(req,res,next)=>{
  try{
    const name=cleanString(req.body.name,80), email=cleanString(req.body.email,160).toLowerCase(), password=req.body.password, role=req.body.role==="warden"?"warden":"student";
    if(name.length<2||!validEmail(email)||typeof password!=="string"||password.length<6)return res.status(400).json({message:"Enter a valid name, email, and password of at least 6 characters."});
    const {data:existing}=await supabase.from("users").select("id").eq("email",email).maybeSingle();
    if(existing)return res.status(409).json({message:"An account with this email already exists."});
    const password_hash=await bcrypt.hash(password,12);
    const {error}=await supabase.from("users").insert({name,email,password_hash,role});
    if(error)return next(error);
    res.status(201).json({message:"Account created successfully."});
  }catch(e){next(e)}
});
router.post("/login",async(req,res,next)=>{
  try{
    const email=cleanString(req.body.email,160).toLowerCase(), password=req.body.password;
    const {data:user,error}=await supabase.from("users").select("id,name,email,password_hash,role").eq("email",email).maybeSingle();
    if(error)return next(error);
    if(!user||!(await bcrypt.compare(password||"",user.password_hash)))return res.status(401).json({message:"Invalid email or password."});
    const token=jwt.sign({id:user.id,name:user.name,email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:"8h"});
    res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});
  }catch(e){next(e)}
});
module.exports=router;