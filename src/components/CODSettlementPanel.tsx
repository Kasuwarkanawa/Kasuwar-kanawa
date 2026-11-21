import React,{useEffect,useState} from 'react';
import {CODSettlement} from '../types';
import {marketplaceApi} from '../utils/marketplaceApi';

type Role='logistics'|'admin'|'seller';
export const CODSettlementPanel:React.FC<{role:Role}> = ({role}) => {
 const [rows,setRows]=useState<CODSettlement[]>([]);
 const [account,setAccount]=useState({bankName:'',accountName:'',accountNumber:''});
 const [bank,setBank]=useState({bankName:'',accountName:'',accountNumber:''});
 const [picked,setPicked]=useState<Record<string,File|undefined>>({});
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
 const refresh=async()=>{setError('');
  if(role==='logistics'){
   try{const r=await marketplaceApi.codSettlement.logisticsList();setRows(r);}
   catch(e){setError(e instanceof Error?e.message:'Could not load Logistics COD records.');return;}
   try{const a=await marketplaceApi.codSettlement.remittanceAccount();setAccount(a);}
   catch(e){setAccount({bankName:'',accountName:'',accountNumber:''});setError(e instanceof Error?e.message:'Marketplace remittance bank details are not configured.');}
  }
  if(role==='admin'){
   try{const r=await marketplaceApi.codSettlement.adminList();setRows(r);}
   catch(e){setError(e instanceof Error?e.message:'Could not load Admin COD records.');return;}
   try{const a=await marketplaceApi.codSettlement.adminSettings();setAccount(a);}
   catch(e){setAccount({bankName:'',accountName:'',accountNumber:''});setError(e instanceof Error?e.message:'Marketplace payout settings are not configured.');}
  }
  if(role==='seller'){try{setRows(await marketplaceApi.codSettlement.sellerList());}catch(e){setError(e instanceof Error?e.message:'Could not load seller COD payments.');}}
 };
 useEffect(()=>{void refresh();},[role]);
 const action=async(fn:()=>Promise<unknown>,msg:string)=>{setBusy(true);setError('');setNotice('');try{await fn();setNotice(msg);await refresh();}catch(e){setError(e instanceof Error?e.message:'Action failed.');}finally{setBusy(false);}};
 const money=(v:number)=>'₦'+Number(v||0).toLocaleString('en-NG',{maximumFractionDigits:2});
 const upload=async(id:string,file?:File,kind:'logistics'|'seller'='logistics')=>{if(!file)return;if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)||file.size>5*1024*1024){setError('Choose JPG, PNG, WEBP or PDF up to 5MB.');return;}await action(()=>kind==='logistics'?marketplaceApi.codSettlement.uploadLogisticsReceipt(id,file):marketplaceApi.codSettlement.uploadSellerReceipt(id,file), 'Receipt uploaded successfully.');setPicked(p=>({...p,[id]:undefined}));};
 const openReceipt=async(id:string,kind:'logistics'|'seller')=>{try{const r=kind==='logistics'?await marketplaceApi.codSettlement.logisticsReceiptUrl(id):await marketplaceApi.codSettlement.sellerReceiptUrl(id);window.open(r.url,'_blank','noopener,noreferrer');}catch(e){setError(e instanceof Error?e.message:'Unable to open receipt.');}};
 return <section className="space-y-4">
  <div className="flex items-center justify-between gap-2"><h2 className="text-xl font-black text-slate-900">{role==='logistics'?'COD Remittance':role==='admin'?'COD Settlement & Seller Payout':'Seller COD Payments'}</h2><button onClick={()=>void refresh()} className="rounded-lg border px-3 py-2 text-sm font-bold">Refresh</button></div>
  {error&&<div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
  {notice&&<div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">{notice}</div>}
  {role==='admin'&&<form className="bg-white border rounded-2xl p-4 space-y-3" onSubmit={e=>{e.preventDefault();void action(()=>marketplaceApi.codSettlement.saveAdminSettings(account),'Marketplace bank details saved.');}}>
   <h3 className="font-black">Marketplace COD remittance bank account</h3>
   <input className="w-full border rounded-lg p-3" placeholder="Bank name" value={account.bankName} onChange={e=>setAccount({...account,bankName:e.target.value})} required/>
   <input className="w-full border rounded-lg p-3" placeholder="Account name" value={account.accountName} onChange={e=>setAccount({...account,accountName:e.target.value})} required/>
   <input className="w-full border rounded-lg p-3" placeholder="10-digit account number" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={account.accountNumber} onChange={e=>setAccount({...account,accountNumber:e.target.value.replace(/\D/g,'').slice(0,10)})} required/>
   <button disabled={busy} className="rounded-lg bg-slate-900 text-white px-4 py-3 font-bold">Save bank details</button>
  </form>}
  {role==='seller'&&<form className="bg-white border rounded-2xl p-4 space-y-3" onSubmit={e=>{e.preventDefault();void action(()=>marketplaceApi.codSettlement.saveSellerBank(bank),'Seller bank account saved.');}}>
   <h3 className="font-black">Your bank account for seller payouts</h3>
   <input className="w-full border rounded-lg p-3" placeholder="Bank name" value={bank.bankName} onChange={e=>setBank({...bank,bankName:e.target.value})} required/>
   <input className="w-full border rounded-lg p-3" placeholder="Account name" value={bank.accountName} onChange={e=>setBank({...bank,accountName:e.target.value})} required/>
   <input className="w-full border rounded-lg p-3" placeholder="10-digit account number" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={bank.accountNumber} onChange={e=>setBank({...bank,accountNumber:e.target.value.replace(/\D/g,'').slice(0,10)})} required/>
   <button disabled={busy} className="rounded-lg bg-slate-900 text-white px-4 py-3 font-bold">Save payout account</button>
  </form>}
  {rows.length===0&&<div className="bg-white border rounded-xl p-5 text-center text-slate-500">No COD settlement records yet.</div>}
  {rows.map(row=><article key={row.id} className="bg-white border rounded-2xl p-4 space-y-3">
   <div className="flex flex-wrap justify-between gap-2"><div><p className="font-black">Order {row.order?.orderNumber||row.orderId}</p><p className="text-xs text-slate-500">{row.seller?.businessName||row.seller?.fullName||'Seller'}</p></div><span className="text-xs rounded-full bg-amber-50 text-amber-800 px-3 py-1 font-bold">{row.status.replaceAll('_',' ')}</span></div>
   {row.order?.items?.map((item,i)=><div key={i} className="flex gap-3 items-center">{item.productSnapshot?.image&&<img src={item.productSnapshot.image} alt="" className="w-16 h-16 rounded-lg object-contain bg-slate-50"/>}<div className="min-w-0"><p className="font-bold text-sm">{item.productSnapshot?.name||'Product'}</p><p className="text-xs text-slate-500">Qty {item.quantity} · {money(Number(item.unitPrice)*item.quantity)}</p></div></div>)}
   <div className="grid grid-cols-2 gap-2 text-sm"><p>COD collected: <b>{money(row.grossCollectedAmount)}</b></p><p>Products subtotal: <b>{money(row.order?.subtotal||0)}</b></p><p>Commission (5%): <b>{money(row.commissionAmount)}</b></p><p>Seller net: <b>{money(row.sellerPayoutAmount)}</b></p></div>
   {role==='logistics'&&row.status!=='completed'&&<div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-2"><p className="font-bold text-sm">Transfer COD collection to Kasuwar Kanawa</p><p className="text-sm">{account.bankName} · {account.accountName} · <b>{account.accountNumber}</b></p><p className="text-lg font-black">{money(row.grossCollectedAmount)}</p>{['awaiting_logistics_transfer','logistics_receipt_rejected'].includes(row.status)?<> <label className="block text-sm font-bold">Select transfer receipt from Gallery<input className="block w-full mt-2 text-sm" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setPicked(p=>({...p,[row.id]:e.target.files?.[0] as File}))}/></label><button type="button" disabled={busy||!picked[row.id]} onClick={()=>void upload(row.id,picked[row.id],'logistics')} className="w-full rounded-lg bg-pink-600 text-white px-4 py-3 font-black disabled:opacity-50">Confirm Transfer & Upload Receipt</button></>:<p className="text-sm font-bold text-amber-800">Awaiting Admin confirmation of your receipt.</p>}</div>}
   {role==='admin'&&<div className="space-y-2">
    <p className="text-sm">Logistics: {row.seller?.phone}</p>
    {row.status==='awaiting_admin_logistics_confirmation'&&<div className="flex flex-wrap gap-2"><button onClick={()=>void openReceipt(row.id,'logistics')} className="rounded-lg border px-3 py-2 font-bold text-sm">View Logistics Receipt</button><button disabled={busy} onClick={()=>void action(()=>marketplaceApi.codSettlement.confirmLogistics(row.id,'confirm'),'Logistics payment confirmed. Seller payout is now due.')} className="rounded-lg bg-green-600 text-white px-3 py-2 font-bold text-sm">Confirm Received</button><button disabled={busy} onClick={()=>{const note=window.prompt('Reason for rejecting receipt?');if(note)void action(()=>marketplaceApi.codSettlement.confirmLogistics(row.id,'reject',note),'Receipt rejected.');}} className="rounded-lg bg-red-600 text-white px-3 py-2 font-bold text-sm">Reject Receipt</button></div>}
    {row.status==='awaiting_seller_payout'&&<div className="rounded-xl bg-amber-50 p-3 space-y-2"><p className="font-bold">Seller payout account</p><p className="text-sm">{row.seller?.payoutBankName||'Bank not set'} · {row.seller?.payoutAccountName||''} · {row.seller?.payoutAccountNumber||''}</p><p className="font-black text-lg">Transfer {money(row.sellerPayoutAmount)} to seller</p><label className="block text-sm font-bold">Select seller transfer receipt<input className="block w-full mt-2" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setPicked(p=>({...p,[row.id]:e.target.files?.[0] as File}))}/></label><button type="button" disabled={busy||!picked[row.id]} onClick={()=>void upload(row.id,picked[row.id],'seller')} className="w-full rounded-lg bg-pink-600 text-white px-4 py-3 font-black disabled:opacity-50">Confirm Transfer & Upload Receipt</button></div>}
    {row.status==='awaiting_seller_confirmation'&&<button onClick={()=>void openReceipt(row.id,'seller')} className="rounded-lg border px-3 py-2 font-bold text-sm">View Seller Transfer Receipt</button>}
    {row.status==='completed'&&<p className="font-black text-green-700">DEAL DONE — See you next time.</p>}
   </div>}
   {role==='seller'&&<div className="space-y-2">{row.status==='awaiting_seller_confirmation'&&<><button onClick={()=>void openReceipt(row.id,'seller')} className="rounded-lg border px-3 py-2 font-bold text-sm">View Admin Payment Receipt</button><button disabled={busy} onClick={()=>void action(()=>marketplaceApi.codSettlement.acceptSellerPayment(row.id),'Payment accepted. DEAL DONE — See you next time.')} className="block w-full rounded-lg bg-green-600 text-white px-4 py-3 font-black">Accept Payment</button></>}{row.status==='completed'&&<p className="font-black text-green-700">Payment accepted — DEAL DONE. See you next time.</p>}{row.status==='awaiting_seller_payout'&&<p className="text-sm text-amber-700 font-bold">Admin has confirmed the Logistics remittance. Awaiting your payout.</p>}</div>}
  </article>)}
 </section>;
};
