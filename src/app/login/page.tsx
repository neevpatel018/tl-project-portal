"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
export default function Login(){const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[message,setMessage]=useState("");
async function submit(e:React.FormEvent){e.preventDefault();const supabase=createClient();const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setMessage(error.message);return;}window.location.href="/dashboard";}
return <main className="mx-auto max-w-md px-5 py-16"><Link href="/" className="text-sm text-tl-blue">← Home</Link><h1 className="mt-5 text-3xl font-bold">Sign in</h1><p className="mt-2 text-slate-600">For registered students and authorized TL staff.</p><form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm"><label className="block text-sm">Email<input className="mt-1 w-full rounded-lg border p-3" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block text-sm">Password<input className="mt-1 w-full rounded-lg border p-3" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<p role="alert" className="text-sm text-red-700">{message}</p>}<button className="w-full rounded-lg bg-tl-blue p-3 font-semibold text-white">Sign in</button></form></main>}
