import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { allowRequest } from "@/lib/rate-limit";
const schema=z.object({
 title:z.string().trim().min(3).max(160), lead_name:z.string().trim().min(2).max(120),
 lead_email:z.string().trim().email().max(254), organization:z.string().trim().min(2).max(160),
 team_members:z.string().max(5000).optional().default(""), start_date:z.string().optional().default(""),
 end_date:z.string().optional().default(""), summary:z.string().trim().min(20).max(10000),
 resources:z.string().max(10000).optional().default(""), safety_notes:z.string().max(5000).optional().default(""),
 acknowledgement:z.string().optional()
});
export async function POST(req:NextRequest){
 const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 if(!allowRequest(`project:${ip}`,5,60_000))return NextResponse.json({error:"Too many submissions. Please try again later."},{status:429});
 let parsed;try{parsed=schema.safeParse(await req.json())}catch{return NextResponse.json({error:"Invalid request body."},{status:400})}
 if(!parsed.success)return NextResponse.json({error:"Please check the required fields and try again.",details:parsed.error.flatten()},{status:400});
 const d=parsed.data;if(d.end_date&&d.start_date&&d.end_date<d.start_date)return NextResponse.json({error:"End date must be on or after start date."},{status:400});
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 const admin=createAdminClient();
 const reference_code=`TL-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
 const {data,error}=await admin.from("projects").insert({title:d.title,lead_name:d.lead_name,lead_email:d.lead_email.toLowerCase(),organization:d.organization,team_members:d.team_members,summary:d.summary,resources_description:d.resources,safety_notes:d.safety_notes,start_date:d.start_date||null,end_date:d.end_date||null,submitted_by:user?.id??null,status:"pending",reference_code}).select("id,reference_code").single();
 if(error){console.error("Project insert failed",error.code);return NextResponse.json({error:"We could not save your submission. Please try again later."},{status:500})}
 await admin.from("audit_events").insert({actor_id:user?.id??null,entity_type:"project",entity_id:data.id,action:"project.submitted",metadata:{reference_code}});
 return NextResponse.json({ok:true,reference:data.reference_code},{status:201});
}
