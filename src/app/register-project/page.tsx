"use client";
import { useState } from "react";
export default function RegisterProject() {
 const [busy,setBusy]=useState(false), [message,setMessage]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const form=new FormData(e.currentTarget);const payload=Object.fromEntries(form.entries());try{const r=await fetch("/api/projects",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok)throw new Error(j.error||"Submission failed");setMessage(`Submitted successfully. Reference: ${j.reference}. Save this reference for your records.`);e.currentTarget.reset();}catch(err){setMessage(err instanceof Error?err.message:"Something went wrong.");}finally{setBusy(false)}}
 return <main className="mx-auto max-w-3xl px-5 py-10"><a href="/" className="text-sm text-tl-blue">← Home</a><h1 className="mt-4 text-3xl font-bold text-tl-navy">Register a project</h1><p className="mt-2 text-slate-600">Open submission: you do not need an account to submit. Do not include confidential or sensitive information.</p><form onSubmit={submit} className="mt-7 space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
 {message&&<div role="status" className="rounded-lg bg-blue-50 p-3 text-sm">{message}</div>}
 <div className="grid gap-4 md:grid-cols-2"><Field label="Project title" name="title" required/><Field label="Lead name" name="lead_name" required/><Field label="Lead email" name="lead_email" type="email" required/><Field label="University / organization" name="organization" required/></div>
 <Field label="Team members (names and emails)" name="team_members" placeholder="One per line"/>
 <div className="grid gap-4 md:grid-cols-2"><Field label="Expected start date" name="start_date" type="date"/><Field label="Target completion date" name="end_date" type="date"/></div>
 <Field label="Project summary" name="summary" required textarea placeholder="Problem, proposed solution, and intended outcome"/>
 <Field label="Resources needed" name="resources" textarea placeholder="List tools, materials, machines, quantities, and intended use"/>
 <Field label="Safety notes / training required" name="safety_notes" textarea/>
 <label className="flex gap-3 text-sm text-slate-600"><input type="checkbox" name="acknowledgement" required className="mt-1"/>I confirm the information is accurate and understand that project/resource requests require TL staff approval.</label>
 <button disabled={busy} className="rounded-xl bg-tl-blue px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?"Submitting…":"Submit project"}</button>
 </form></main>;
}
function Field({label,name,type="text",required=false,textarea=false,placeholder=""}:{label:string;name:string;type?:string;required?:boolean;textarea?:boolean;placeholder?:string}){const cls="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-tl-blue";return <label className="block text-sm font-medium text-slate-700">{label}{required&&" *"}{textarea?<textarea name={name} required={required} rows={4} placeholder={placeholder} className={cls}/>:<input name={name} type={type} required={required} placeholder={placeholder} className={cls}/>}</label>}
