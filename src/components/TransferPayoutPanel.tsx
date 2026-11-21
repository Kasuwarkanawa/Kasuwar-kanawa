import React,{useEffect,useState} from 'react';
import {TransferPayout} from '../types';
import {marketplaceApi} from '../utils/marketplaceApi';

type Role='admin'|'seller';
const money=(value:number)=>'₦'+Number(value||0).toLocaleString('en-NG',{maximumFractionDigits:2});

export const TransferPayoutPanel:React.FC<{role:Role}> = ({role}) => {
 const [rows,setRows]=useState<TransferPayout[]>([]);
 const [bank,setBank]=useState({bankName:'',accountName:'',accountNumber:''});
 const [files,setFiles]=useState<Record<string,File|undefined>>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const refresh=async()=>{
  setError('');
  try{
   const result=role==='admin'?await marketplaceApi.transferPayout.adminList():await marketplaceApi.transferPayout.sellerList();
   setRows(result);
   if(role==='seller'){
    const seller=result.find(x=>x.seller)?.seller;
    if(seller)setBank({bankName:seller.payoutBankName||'',accountName:seller.payoutAccountName||'',accountNumber:seller.payoutAccountNumber||''});
   }
  }catch(e){setError(e instanceof Error?e.message:'Unable to load Bank Transfer payouts.');}
 };
 useEffect(()=>{void refresh();},[role]);
 const run=async(fn:()=>Promise<unknown>,message:string)=>{
  setBusy(true);setError('');setNotice('');
  try{await fn();setNotice(message);await refresh();}
  catch(e){setError(e instanceof Error?e.message:'Action failed.');}
  finally{setBusy(false);}
 };
 const openReceipt=async(id:string)=>{
  try{const result=role==='admin'?await marketplaceApi.transferPayout.adminReceiptUrl(id):await marketplaceApi.transferPayout.sellerReceiptUrl(id);window.open(result.url,'_blank','noopener,noreferrer');}
  catch(e){setError(e instanceof Error?e.message:'Could not open transfer receipt.');}
 };
 const upload=async(id:string)=>{
  const file=files[id];if(!file)return;
  if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)||file.size>5*1024*1024){setError('Choose JPG, PNG, WEBP or PDF up to 5MB.');return;}
  await run(()=>marketplaceApi.transferPayout.uploadAdminReceipt(id,file),'Seller transfer receipt uploaded. Seller can now confirm payment.');
  setFiles(current=>({...current,[id]:undefined}));
 };
 return <section className="space-y-4">
  <div className="flex items-center justify-between gap-2">
   <div><h2 className="text-xl font-black text-slate-900">{role==='admin'?'Bank Transfer Seller Payout':'Bank Transfer Payouts'}</h2><p className="text-xs text-slate-500">OPay / Bank Transfer · Admin pays Seller directly after delivery</p></div>
   <button type="button" onClick={()=>void refresh()} className="rounded-lg border px-3 py-2 text-sm font-bold">Refresh</button>
  </div>
  {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  {notice&&<div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</div>}
  {role==='seller'&&<form className="rounded-2xl border bg-white p-4 space-y-3" onSubmit={e=>{e.preventDefault();void run(()=>marketplaceApi.codSettlement.saveSellerBank(bank),'Your seller payout bank account has been saved.');}}>
   <h3 className="font-black">Seller bank account</h3>
   <p className="text-xs text-slate-500">Admin will transfer your net payout to this account after the order is marked Delivered.</p>
   <input className="w-full rounded-lg border p-3" placeholder="Bank name" value={bank.bankName} onChange={e=>setBank({...bank,bankName:e.target.value})} required/>
   <input className="w-full rounded-lg border p-3" placeholder="Account name" value={bank.accountName} onChange={e=>setBank({...bank,accountName:e.target.value})} required/>
   <input className="w-full rounded-lg border p-3" placeholder="10-digit account number" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={bank.accountNumber} onChange={e=>setBank({...bank,accountNumber:e.target.value.replace(/\D/g,'').slice(0,10)})} required/>
   <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50">Save Bank Account</button>
  </form>}
  {rows.length===0&&<div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">No Bank Transfer payout is awaiting action. A payout record is created automatically after an Admin-verified OPay order is marked Delivered.</div>}
  {rows.map(row=><article key={row.id} className="space-y-3 rounded-2xl border bg-white p-4">
   <div className="flex flex-wrap items-start justify-between gap-2">
    <div><p className="font-black">Order {row.order?.orderNumber||row.orderId}</p><p className="text-xs text-slate-500">{row.seller?.businessName||row.seller?.fullName||'Seller'}</p></div>
    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-800">{row.status.replaceAll('_',' ')}</span>
   </div>
   {row.order?.items?.map((item,index)=><div key={index} className="flex items-center gap-3">
    {item.productSnapshot?.image&&<img src={item.productSnapshot.image} alt="" className="h-14 w-14 rounded-lg bg-slate-50 object-contain"/>}
    <div><p className="text-sm font-bold">{item.productSnapshot?.name||'Product'}</p><p className="text-xs text-slate-500">Qty {item.quantity} · {money(Number(item.unitPrice)*item.quantity)}</p></div>
   </div>)}
   <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
    <p>Order subtotal: <b>{money(row.grossOrderAmount)}</b></p><p>Commission (5%): <b>{money(row.commissionAmount)}</b></p>
    <p className="col-span-2 text-base">Seller net payout: <b className="text-emerald-700">{money(row.sellerPayoutAmount)}</b></p>
   </div>
   {role==='admin'&&<>
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm">
     <p className="font-black">Seller payout bank account</p>
     <p>{row.seller?.payoutBankName||'BANK NOT SET'} · {row.seller?.payoutAccountName||'Account name missing'} · {row.seller?.payoutAccountNumber||'Account number missing'}</p>
    </div>
    {['awaiting_admin_payout','seller_receipt_rejected'].includes(row.status)&&<div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
     <p className="font-black text-amber-900">ADMIN ACTION REQUIRED</p>
     <p className="text-sm">Transfer {money(row.sellerPayoutAmount)} directly to the seller's bank account above, then upload the transfer receipt.</p>
     {(!row.seller?.payoutBankName||!row.seller?.payoutAccountName||!row.seller?.payoutAccountNumber)&&<p className="text-sm font-bold text-red-700">Seller must save complete bank details before Admin can pay.</p>}
     <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf" className="block w-full rounded-lg border-2 border-dashed border-amber-300 bg-white p-3 text-sm" onChange={e=>setFiles(current=>({...current,[row.id]:e.target.files?.[0]}))}/>
     <p className="text-xs text-slate-600">{files[row.id]?.name||'JPG, PNG, WEBP or PDF · maximum 5MB'}</p>
     <button type="button" disabled={busy||!files[row.id]||!row.seller?.payoutBankName||!row.seller?.payoutAccountName||!row.seller?.payoutAccountNumber} onClick={()=>void upload(row.id)} className="w-full rounded-lg bg-pink-600 px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{busy?'Uploading receipt…':'Upload Seller Transfer Receipt'}</button>
    </div>}
    {row.status==='awaiting_seller_confirmation'&&<div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3"><p className="font-black text-blue-900">TRANSFER RECEIPT UPLOADED</p><p className="text-sm">Awaiting seller confirmation.</p><button type="button" onClick={()=>void openReceipt(row.id)} className="rounded-lg border bg-white px-3 py-2 text-sm font-bold">View Transfer Receipt</button></div>}
    {row.status==='completed'&&<p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-black text-green-800">PAYOUT COMPLETED — SELLER CONFIRMED RECEIPT</p>}
   </>}
   {role==='seller'&&<>
    {row.status==='awaiting_admin_payout'&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="font-black text-amber-900">AWAITING ADMIN PAYOUT</p><p className="text-sm">Your order has been delivered. Admin will transfer {money(row.sellerPayoutAmount)} to your saved bank account and upload proof here.</p></div>}
    {row.status==='awaiting_seller_confirmation'&&<div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3"><p className="font-black text-blue-900">ADMIN SAYS PAYMENT SENT</p><p className="text-sm">Check your bank account before confirming receipt of {money(row.sellerPayoutAmount)}.</p><button type="button" onClick={()=>void openReceipt(row.id)} className="w-full rounded-lg border bg-white px-3 py-3 text-sm font-bold">View Transfer Receipt</button><button type="button" disabled={busy} onClick={()=>void run(()=>marketplaceApi.transferPayout.acceptSellerPayment(row.id),'Payment confirmed. Bank Transfer payout completed.')} className="w-full rounded-lg bg-green-600 px-4 py-3 font-black text-white disabled:opacity-50">Confirm Payment Received</button><p className="text-xs text-blue-900">Only confirm after the money has arrived in your bank account.</p></div>}
    {row.status==='completed'&&<p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-black text-green-800">PAYOUT COMPLETED — YOU CONFIRMED RECEIPT</p>}
   </>}
  </article>)}
 </section>;
};
