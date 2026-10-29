const router=require("express").Router(); const supabase=require("../supabase"); const {requireAuth}=require("../middleware/auth");
router.get("/",requireAuth,async(req,res,next)=>{
  try{
    const [{data:rooms,error:e1},{data:allocs,error:e2},{data:requests,error:e3}]=await Promise.all([
      supabase.from("rooms").select("id,capacity"),
      supabase.from("allocations").select("id,room_id,status").eq("status","active"),
      supabase.from("maintenance_requests").select("id,title,status,created_at,rooms(room_number)").order("created_at",{ascending:false}).limit(5)
    ]);
    if(e1||e2||e3)return next(e1||e2||e3);
    const total_beds=(rooms||[]).reduce((s,r)=>s+r.capacity,0), occupied_beds=(allocs||[]).length;
    const available_rooms=(rooms||[]).filter(r=>!(allocs||[]).some(a=>a.room_id===r.id)).length;
    res.json({stats:{total_rooms:rooms.length,available_rooms,allocations:allocs.length,open_requests:(requests||[]).filter(r=>r.status!=="resolved").length,total_beds,occupied_beds},recent:(requests||[]).map(r=>({id:r.id,title:r.title,status:r.status,created_at:r.created_at,room_number:r.rooms?.room_number||"—"}))});
  }catch(e){next(e)}
});
module.exports=router;