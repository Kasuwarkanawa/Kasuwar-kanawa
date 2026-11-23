import React, { useEffect, useState } from 'react';
import { marketplaceApi } from '../utils/marketplaceApi';

type Props = { role: 'seller' | 'admin' };
const planOf = (value: any) => Array.isArray(value) ? value[0] : value;
const sellerOf = (value: any) => Array.isArray(value) ? value[0] : value;
const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';

export const SubscriptionCenter: React.FC<Props> = ({ role }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'paystack'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('0');
  const [planDuration, setPlanDuration] = useState('30');
  const [planGrace, setPlanGrace] = useState('7');

  const load = async () => {
    setLoading(true); setError('');
    try {
      if (role === 'seller') {
        const result = await marketplaceApi.subscriptions.sellerOverview();
        setPlans(result.plans || []); setCurrent(result.subscription || null);
        setSubscriptions(result.subscriptions || []); setNotifications(result.notifications || []);
        if (!selectedPlan && result.plans?.[0]) setSelectedPlan(result.plans[0].id);
      } else {
        const [p, s] = await Promise.all([marketplaceApi.subscriptions.adminPlans(), marketplaceApi.subscriptions.adminList()]);
        setPlans(p || []); setSubscriptions(s || []);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load subscription information.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [role]);

  const createRequest = async () => {
    if (!selectedPlan) { setError('Choose a subscription plan first.'); return; }
    setBusy('request'); setError(''); setNotice('');
    try {
      const created = await marketplaceApi.subscriptions.createRequest({ planId: selectedPlan, paymentMethod, paymentReference: paymentReference.trim() || undefined });
      setCurrent(created); setNotice('Subscription request created. Upload your payment receipt below, then wait for Admin approval.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create subscription request.'); }
    finally { setBusy(null); }
  };
  const uploadReceipt = async () => {
    if (!current?.id || !receipt) { setError('Choose a receipt file first.'); return; }
    setBusy('receipt'); setError(''); setNotice('');
    try {
      await marketplaceApi.subscriptions.uploadReceipt(current.id, receipt);
      setReceipt(null); setNotice('Payment receipt uploaded. Your request is awaiting Admin approval.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Receipt upload failed.'); }
    finally { setBusy(null); }
  };
  const createPlan = async () => {
    setBusy('plan'); setError(''); setNotice('');
    try {
      await marketplaceApi.subscriptions.createPlan({ name: planName, description: planDescription, price: Number(planPrice), durationDays: Number(planDuration), graceDays: Number(planGrace), isActive: true });
      setPlanName(''); setPlanDescription(''); setNotice('Subscription plan created.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create plan.'); }
    finally { setBusy(null); }
  };
  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusy(id); setError(''); setNotice('');
    try { await marketplaceApi.subscriptions.decide(id, decision); setNotice(decision === 'approve' ? 'Subscription approved and activated.' : 'Subscription request rejected.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update subscription.'); }
    finally { setBusy(null); }
  };
  const openReceipt = async (id: string) => {
    setBusy(`receipt:${id}`); setError('');
    try { const result = await marketplaceApi.subscriptions.adminReceipt(id); window.location.assign(result.url); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to open receipt.'); }
    finally { setBusy(null); }
  };
  const markRead = async (id: string) => {
    try { await marketplaceApi.subscriptions.markNotificationRead(id); setNotifications(items => items.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to mark notification as read.'); }
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading subscription centre…</div>;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#0B172E] p-5 text-white flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-black">{role === 'admin' ? 'Seller Subscription Management' : 'Seller Subscription & Billing'}</h2><p className="mt-1 text-xs text-slate-300">{role === 'admin' ? 'Create plans, review payment evidence and activate seller subscriptions.' : 'Manage your plan, submit payment proof and track your renewal status.'}</p></div>
        <button type="button" onClick={() => void load()} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold hover:bg-white/10">Refresh</button>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}

      {role === 'seller' ? <>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2"><h3 className="font-black text-slate-900">Current subscription</h3><span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${current?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : current?.status === 'grace' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{current?.status || 'No subscription'}</span></div>
          {current ? <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-500">Plan</p><p className="font-bold">{planOf(current.plan)?.name || 'Seller plan'}</p></div>
            <div><p className="text-xs text-slate-500">Amount</p><p className="font-bold">{money(current.amountPaid)}</p></div>
            <div><p className="text-xs text-slate-500">Starts</p><p className="font-semibold">{date(current.startsAt)}</p></div>
            <div><p className="text-xs text-slate-500">Expires</p><p className="font-semibold">{date(current.expiresAt)}</p></div>
            {current.status === 'grace' && <div className="col-span-2 rounded-xl bg-amber-50 p-3 text-amber-800"><b>Grace period ends:</b> {date(current.graceEndsAt)}. Renew before this date to avoid hiding your listings.</div>}
            {current.status === 'expired' && <div className="col-span-2 rounded-xl bg-rose-50 p-3 text-rose-700">Your grace period has ended. Your products remain saved but are hidden from public shoppers until a new subscription is approved.</div>}
          </div> : <p className="text-sm text-slate-500">No subscription request found. Choose a plan below to get started.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div><h3 className="font-black text-slate-900">Available plans</h3><p className="text-xs text-slate-500 mt-1">A new plan becomes active only after Admin verifies your payment.</p></div>
          {plans.length === 0 ? <p className="text-sm text-slate-500">No active subscription plans are available yet. Contact Admin.</p> : <div className="grid gap-3 sm:grid-cols-2">
            {plans.map(plan => <label key={plan.id} className={`cursor-pointer rounded-xl border p-4 ${selectedPlan === plan.id ? 'border-pink-400 bg-pink-50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2"><span className="font-black text-slate-900">{plan.name}</span><input type="radio" name="subscription-plan" checked={selectedPlan === plan.id} onChange={() => setSelectedPlan(plan.id)} /></div>
              <p className="my-2 text-xl font-black text-[#E6007E]">{money(plan.price)}</p><p className="text-xs text-slate-600">{plan.description}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{plan.durationDays} days + {plan.graceDays} grace days</p>
            </label>)}
          </div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600">Payment method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"><option value="bank_transfer">Bank transfer</option><option value="paystack">Paystack</option></select></label>
            <label className="text-xs font-bold text-slate-600">Payment reference (optional)<input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm" placeholder="Transaction reference" /></label>
          </div>
          <button type="button" disabled={!selectedPlan || !!busy || ['pending_payment','pending_approval'].includes(current?.status)} onClick={() => void createRequest()} className="w-full rounded-xl bg-[#E6007E] px-4 py-3 text-sm font-black text-white disabled:opacity-50">{busy === 'request' ? 'Creating request…' : 'Request subscription'}</button>
          {current && ['pending_payment','pending_approval'].includes(current.status) && <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <p className="text-sm font-bold">Upload payment receipt</p><p className="text-xs text-slate-500">Accepted formats: JPG, PNG, WebP or PDF. Maximum size 5MB.</p>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setReceipt(e.target.files?.[0] || null)} className="block w-full text-xs" />
            <button type="button" disabled={!receipt || !!busy} onClick={() => void uploadReceipt()} className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy === 'receipt' ? 'Uploading…' : 'Upload receipt for Admin review'}</button>
          </div>}
        </section>
        {notifications.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="mb-3 font-black">Notifications</h3><div className="space-y-2">{notifications.map(n => <div key={n.id} className={`rounded-xl p-3 ${n.readAt ? 'bg-slate-50' : 'bg-pink-50'}`}><div className="flex justify-between gap-2"><p className="text-sm font-bold">{n.title}</p>{!n.readAt && <button type="button" onClick={() => void markRead(n.id)} className="text-[11px] font-bold text-pink-700">Mark read</button>}</div><p className="mt-1 text-xs text-slate-600">{n.message}</p><p className="mt-1 text-[10px] text-slate-400">{date(n.createdAt)}</p></div>)}</div></section>}
      </> : <>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-black">Create subscription plan</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Plan name" className="rounded-lg border border-slate-300 p-2.5 text-sm" />
            <input value={planPrice} onChange={e => setPlanPrice(e.target.value)} type="number" min="0" placeholder="Price (NGN)" className="rounded-lg border border-slate-300 p-2.5 text-sm" />
            <input value={planDuration} onChange={e => setPlanDuration(e.target.value)} type="number" min="1" max="3660" placeholder="Duration in days" className="rounded-lg border border-slate-300 p-2.5 text-sm" />
            <input value={planGrace} onChange={e => setPlanGrace(e.target.value)} type="number" min="0" max="30" placeholder="Grace days (default 7)" className="rounded-lg border border-slate-300 p-2.5 text-sm" />
          </div>
          <textarea value={planDescription} onChange={e => setPlanDescription(e.target.value)} placeholder="Plan description" className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" rows={2} />
          <button type="button" disabled={!planName.trim() || !!busy} onClick={() => void createPlan()} className="rounded-xl bg-[#E6007E] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy === 'plan' ? 'Saving…' : 'Create plan'}</button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-black">Existing plans</h3>
          {plans.length === 0 ? <p className="text-sm text-slate-500">No plans created yet.</p> : plans.map(plan => <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"><div><p className="font-bold">{plan.name} · {money(plan.price)}</p><p className="text-xs text-slate-500">{plan.durationDays} days · {plan.graceDays} grace days · {plan.description}</p></div><button type="button" disabled={!!busy} onClick={async () => { setBusy(plan.id); try { await marketplaceApi.subscriptions.updatePlan(plan.id,{isActive:!plan.isActive}); await load(); } catch(e) { setError(e instanceof Error ? e.message : 'Plan update failed.'); } finally { setBusy(null); } }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">{plan.isActive ? 'Deactivate' : 'Activate'}</button></div>)}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-black">Seller subscription requests</h3>
          {subscriptions.length === 0 ? <p className="text-sm text-slate-500">No subscription records yet.</p> : subscriptions.map(sub => <div key={sub.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">{sellerOf(sub.seller)?.businessName || sellerOf(sub.seller)?.fullName || 'Seller'}</p><p className="text-xs text-slate-500">{sellerOf(sub.seller)?.email} · {sellerOf(sub.seller)?.phone}</p><p className="mt-1 text-xs text-slate-600">{planOf(sub.plan)?.name} · {money(sub.amountPaid)} · {date(sub.createdAt)}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase">{sub.status}</span></div>
            <p className="text-xs text-slate-500">Method: {sub.paymentMethod || '—'} · Reference: {sub.paymentReference || '—'}</p>
            <div className="flex flex-wrap gap-2">{sub.paymentReceiptPath && <button type="button" disabled={!!busy} onClick={() => void openReceipt(sub.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">{busy === `receipt:${sub.id}` ? 'Opening…' : 'View receipt'}</button>}{['pending_payment','pending_approval'].includes(sub.status) && <><button type="button" disabled={!!busy} onClick={() => void decide(sub.id,'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">{busy === sub.id ? 'Saving…' : 'Approve & activate'}</button><button type="button" disabled={!!busy} onClick={() => void decide(sub.id,'reject')} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Reject</button></>}</div>
            {sub.expiresAt && <p className="text-[11px] text-slate-500">Expires: {date(sub.expiresAt)}{sub.graceEndsAt ? ` · Grace ends: ${date(sub.graceEndsAt)}` : ''}</p>}
          </div>)}
        </section>
      </>}
    </div>
  );
};
