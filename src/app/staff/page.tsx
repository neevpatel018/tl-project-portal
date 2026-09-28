import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ReviewQueue from "./review-queue";

export default async function StaffPage() {
  await requireStaff();
  const admin = createAdminClient();
  const [{data: projects}, {data: items}, {data: requests}] = await Promise.all([
    admin.from("projects").select("id,title,lead_name,lead_email,organization,status,created_at,reference_code").order("created_at",{ascending:false}).limit(100),
    admin.from("inventory_items").select("id,name,sku,category,item_type,reorder_level,stock_balances(quantity_on_hand,quantity_reserved)").eq("is_archived",false).order("name").limit(200),
    admin.from("resource_requests").select("id,project_id,status,created_at,projects(title,reference_code),resource_request_lines(id,quantity_requested,quantity_approved,inventory_items(name,unit))").order("created_at",{ascending:false}).limit(100)
  ]);
  const pending=(projects||[]).filter(p=>p.status==="pending");
  const low=(items||[]).filter(i=>(i.stock_balances?.[0]?.quantity_on_hand ?? 0)<=i.reorder_level);
  return <main className="mx-auto max-w-7xl px-5 py-10">
    <Link href="/" className="text-sm text-tl-blue">← Home</Link>
    <div className="mt-3"><h1 className="text-3xl font-bold text-tl-navy">TL staff workspace</h1><p className="mt-1 text-slate-600">Review proposals, monitor resources, and keep inventory records up to date.</p></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">{[["Pending projects",pending.length],["Inventory items",(items||[]).length],["Low-stock items",low.length]].map(([label,value])=><div key={label} className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-bold text-tl-navy">{value}</div></div>)}</div>
    <section className="mt-8 rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold">Project review queue</h2><p className="mt-1 text-sm text-slate-500">First 100 projects, newest first.</p></div><ReviewQueue projects={pending}/></section>
    <section className="mt-8 rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold">Inventory overview</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Item</th><th className="p-4">SKU</th><th className="p-4">Type</th><th className="p-4">On hand</th><th className="p-4">Reorder at</th></tr></thead><tbody className="divide-y">{(items||[]).map(i=><tr key={i.id}><td className="p-4 font-medium">{i.name}</td><td className="p-4">{i.sku}</td><td className="p-4 capitalize">{i.item_type}</td><td className="p-4">{i.stock_balances?.[0]?.quantity_on_hand ?? 0}</td><td className="p-4">{i.reorder_level}{(i.stock_balances?.[0]?.quantity_on_hand ?? 0)<=i.reorder_level&&<span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-amber-800">Low</span>}</td></tr>)}</tbody></table></div></section>
    <section className="mt-8 rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold">Resource requests</h2><p className="mt-1 text-sm text-slate-500">Requests are shown for visibility; line-level approval still needs completing.</p></div><div className="divide-y">{(requests||[]).length===0?<p className="p-5 text-slate-500">No resource requests yet.</p>:(requests||[]).map((r:any)=><div key={r.id} className="p-5"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{r.projects?.title||"Project"}</span><span className="text-sm capitalize text-slate-500">{r.status.replaceAll("_"," ")}</span></div><div className="mt-2 text-sm text-slate-600">{(r.resource_request_lines||[]).map((line:any)=>`${line.inventory_items?.name||"Item"}: ${line.quantity_requested} ${line.inventory_items?.unit||""}`).join(" · ")||"No line items"}</div></div>)}</div></section>
  </main>;
}
