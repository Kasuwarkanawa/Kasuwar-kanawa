import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePreview } from './ImagePreview';
import { CODSettlementPanel } from './CODSettlementPanel';
import { ProfileImageUploader } from './ProfileImageUploader';
import { User, LogisticsCompany, DeliveryAgent, LogisticsShipment, Order } from '../types';
import { marketplaceApi } from '../utils/marketplaceApi';
import { ArrowLeft, Package, Truck, Users, MapPin, Plus, RefreshCw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

type Props = { user: User; onClose: () => void; onLogout: () => void; onDataChanged?: () => void };

const statusLabel: Record<string, string> = {
  awaiting_pickup: 'Awaiting pickup', picked_up: 'Picked up', in_transit: 'In transit',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', failed: 'Failed', cancelled: 'Cancelled',
};

export const LogisticsDashboard: React.FC<Props> = ({ user, onClose, onLogout, onDataChanged }) => {
  const [company, setCompany] = useState<LogisticsCompany | null>(null);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<LogisticsShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'overview' | 'orders' | 'agents' | 'shipments' | 'cod'>('overview');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentWhatsApp, setAgentWhatsApp] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentProfileImage, setAgentProfileImage] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlateNumber, setVehiclePlateNumber] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [companyImagePreviewOpen, setCompanyImagePreviewOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [companyData, agentData, orderData, shipmentData] = await Promise.all([
        marketplaceApi.logistics.company(), marketplaceApi.logistics.agents(),
        marketplaceApi.logistics.orders(), marketplaceApi.logistics.shipments(),
      ]);
      setCompany(companyData); setAgents(agentData); setOrders(orderData); setShipments(shipmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load logistics data from the secure server.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const counts = useMemo(() => [
    { label: 'Available Orders', value: orders.length, icon: Package },
    { label: 'Shipments', value: shipments.length, icon: Truck },
    { label: 'Delivery Agents', value: agents.length, icon: Users },
    { label: 'Delivered', value: shipments.filter(item => item.status === 'delivered').length, icon: CheckCircle2 },
  ], [orders, shipments, agents]);

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true); setError(''); setNotice('');
    try { await action(); setNotice(success); await refresh(); onDataChanged?.(); }
    catch (err) { setError(err instanceof Error ? err.message : 'The requested action could not be completed.'); }
    finally { setSaving(false); }
  };

  const addAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    await runAction(() => marketplaceApi.logistics.addAgent({
      fullName: agentName.trim(), phone: agentPhone.trim(),
      whatsAppNumber: agentWhatsApp.trim() || undefined, email: agentEmail.trim() || undefined,
      profileImage: agentProfileImage.trim() || undefined,
      vehicleType: vehicleType.trim() || undefined, vehiclePlateNumber: vehiclePlateNumber.trim() || undefined,
    }), 'Delivery agent added successfully.');
    setAgentName(''); setAgentPhone(''); setAgentWhatsApp(''); setAgentEmail(''); setAgentProfileImage('');
    setVehicleType(''); setVehiclePlateNumber(''); setShowAgentForm(false);
  };

  const createShipment = (order: Order, agentId: string) =>
    runAction(() => marketplaceApi.logistics.createShipment(order.id, agentId || undefined), 'Shipment created. Tracking number is now active.');

  const changeShipmentStatus = async (shipment: LogisticsShipment, status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed') => {
    const note = window.prompt(status === 'delivered'
      ? 'Enter delivery confirmation (recipient name, signature/reference, or proof link):'
      : 'Add an optional update for the buyer:', '');
    if (note === null) return;
    await runAction(() => marketplaceApi.logistics.updateShipmentStatus(shipment.id, status, note.trim()), `Shipment updated: ${statusLabel[status]}.`);
  };

  if (loading && !company) return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"><RefreshCw className="animate-spin mx-auto mb-3 text-pink-600" /><p className="font-bold">Loading secure logistics workspace…</p></div>
    </div>
  );

  if (error && !company) return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-black text-slate-900">Logistics dashboard unavailable</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <div className="mt-5 flex gap-2"><button onClick={() => void refresh()} className="flex-1 rounded-xl bg-pink-600 text-white p-3 font-bold">Retry</button><button onClick={onClose} className="rounded-xl border px-4 font-bold">Close</button></div>
      </div>
    </div>
  );

  if (!company || company.approvalStatus !== 'approved' || user.status !== 'active') return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-black text-slate-900">Logistics approval required</h2>
        <p className="mt-2 text-slate-600">This company account must be approved by Super Admin before the dashboard can be used.</p>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-pink-600 text-white p-3 font-bold">Close</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-start justify-center p-0 sm:p-4">
      <div className="w-full max-w-5xl h-[100dvh] sm:h-[92vh] bg-slate-50 sm:rounded-2xl shadow-2xl overflow-y-auto">
        {company.logo && <ImagePreview src={company.logo} alt={company.companyName} isOpen={companyImagePreviewOpen} onClose={() => setCompanyImagePreviewOpen(false)} />}
        <header className="sticky top-0 z-20 bg-[#0B172E] text-white p-4 sm:p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {company.logo ? <button type="button" onClick={() => setCompanyImagePreviewOpen(true)} className="rounded-xl cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-pink-400" aria-label="Preview logistics company logo"><img src={company.logo} alt={company.companyName} className="w-12 h-12 rounded-xl object-contain bg-white" /></button> : <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center"><Truck /></div>}
            <div className="min-w-0"><p className="text-xs text-pink-300 font-bold uppercase tracking-wide">Logistics Company Dashboard</p><h1 className="font-black text-lg sm:text-xl truncate">{company.companyName}</h1><p className="text-xs text-slate-300">Connected to Kasuwar Kanawa database</p></div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => void refresh()} disabled={loading || saving} title="Refresh" className="p-2 rounded-lg bg-white/10 disabled:opacity-50"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
            <button onClick={onLogout} title="Logout" className="p-2 rounded-lg bg-white/10"><LogOut size={18} /></button>
            <button onClick={onClose} title="Close" className="p-2 rounded-lg bg-white/10"><ArrowLeft size={18} /></button>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-5">
          {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}<button onClick={() => setNotice('')} className="float-right font-bold">×</button></div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex gap-2"><AlertCircle size={18} className="shrink-0"/><span>{error}</span><button onClick={() => setError('')} className="ml-auto font-bold">×</button></div>}
          <nav className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(['overview', 'orders', 'agents', 'shipments', 'cod'] as const).map(item => <button key={item} onClick={() => setTab(item)} className={`rounded-xl p-3 font-bold capitalize border ${tab === item ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-700 border-slate-200'}`}>{item === 'agents' ? 'Delivery Agents' : item === 'shipments' ? 'Tracking & Shipments' : item === 'orders' ? 'Available Orders' : item === 'cod' ? 'COD Remittance' : 'Overview'}</button>)}
          </nav>

          {tab === 'overview' && <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{counts.map(({label,value,icon:Icon}) => <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4"><Icon className="text-pink-600 mb-3" /><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-black text-slate-900">{value}</p></div>)}</section>
            <section className="bg-white rounded-2xl border border-slate-200 p-4"><h2 className="font-black text-lg mb-2">Company Contact</h2><p className="text-slate-600">{company.contactName}</p><p className="text-slate-600">{company.phone} · WhatsApp: {company.whatsAppNumber || 'Not provided'}</p><p className="text-slate-600">{company.address}, {company.city}, {company.state}</p><p className="text-xs text-slate-500 mt-2">Company ID: {company.id}</p></section>
          </>}

          {tab === 'orders' && <section className="space-y-3"><h2 className="font-black text-xl">Available Orders</h2>{orders.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No paid, dispatched orders have been assigned to your company yet.</div> : orders.map(order => <OrderShipmentCard key={order.id} order={order} agents={agents} saving={saving} onCreate={agentId => void createShipment(order, agentId)} />)}</section>}

          {tab === 'agents' && <section className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h2 className="font-black text-xl">Delivery Agents</h2><button disabled={saving} onClick={() => setShowAgentForm(v => !v)} className="rounded-xl bg-pink-600 text-white px-4 py-2 font-bold flex items-center gap-2 disabled:opacity-50"><Plus size={17}/> Add Agent</button></div>
            {showAgentForm && <form onSubmit={addAgent} className="bg-white border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><ProfileImageUploader value={agentProfileImage} onChange={setAgentProfileImage} label="Agent Profile Photo" name={agentName || 'Delivery Agent'} role="logistics" /></div>
              <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Agent full name" className="border rounded-xl p-3" required />
              <input value={agentPhone} onChange={e => setAgentPhone(e.target.value)} placeholder="Phone number" className="border rounded-xl p-3" required />
              <input value={agentWhatsApp} onChange={e => setAgentWhatsApp(e.target.value)} placeholder="WhatsApp number (optional)" className="border rounded-xl p-3" />
              <input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} placeholder="Email (optional)" className="border rounded-xl p-3" />
              <input value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="Vehicle type (optional)" className="border rounded-xl p-3" />
              <input value={vehiclePlateNumber} onChange={e => setVehiclePlateNumber(e.target.value)} placeholder="Vehicle plate number (optional)" className="border rounded-xl p-3" />
              <button disabled={saving} className="sm:col-span-2 rounded-xl bg-[#0B172E] text-white p-3 font-bold disabled:opacity-50">{saving ? 'Saving…' : 'Save Delivery Agent'}</button>
            </form>}
            {agents.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No delivery agents added yet.</div> : agents.map(agent => <div key={agent.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-3">{agent.profileImage ? <img src={agent.profileImage} alt={agent.fullName} className="w-12 h-12 rounded-full object-cover border" /> : <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Users size={20}/></div>}<div><p className="font-bold text-slate-900">{agent.fullName}</p><p className="text-sm text-slate-500 break-words">{agent.phone} · WhatsApp: {agent.whatsAppNumber || agent.phone}</p><p className="text-xs text-slate-500">{[agent.vehicleType,agent.vehiclePlateNumber].filter(Boolean).join(' · ') || 'Vehicle not specified'}</p><span className={`inline-flex mt-2 text-xs font-bold rounded-full px-2 py-1 ${agent.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{agent.status}</span></div></div><div className="flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void runAction(() => marketplaceApi.logistics.updateAgent(agent.id, agent.status === 'active' ? 'inactive' : 'active'), `${agent.fullName} status updated.`)} className="rounded-lg border px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">{agent.status === 'active' ? 'Deactivate' : 'Activate'}</button><button type="button" disabled={saving} onClick={() => { if (window.confirm(`Remove ${agent.fullName} from your delivery agents?`)) void runAction(() => marketplaceApi.logistics.removeAgent(agent.id), 'Delivery agent removed.'); }} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50">Remove</button></div></div>)}
          </section>}

          {tab === 'shipments' && <section className="space-y-3"><h2 className="font-black text-xl">Tracking & Shipments</h2>{shipments.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No shipments created yet.</div> : shipments.map(shipment => <ShipmentManagementCard key={shipment.id} shipment={shipment} agents={agents} saving={saving} onAssign={agentId => void runAction(() => marketplaceApi.logistics.assignAgent(shipment.id, agentId || null), 'Delivery agent assignment saved.')} onUpdateStatus={status => void changeShipmentStatus(shipment, status)} />)}</section>}
          {tab === 'cod' && <CODSettlementPanel role="logistics" />}
        </main>
      </div>
    </div>
  );
};

const ShipmentManagementCard: React.FC<{ shipment: LogisticsShipment; agents: DeliveryAgent[]; saving: boolean; onAssign: (agentId: string) => void; onUpdateStatus: (status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed') => void }> = ({ shipment, agents, saving, onAssign, onUpdateStatus }) => {
  const [selectedAgentId, setSelectedAgentId] = useState(shipment.deliveryAgentId || '');
  const assignedAgent = agents.find(agent => agent.id === shipment.deliveryAgentId);
  return <div className="bg-white border rounded-2xl p-4 space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><div><p className="font-black text-slate-900">{shipment.trackingNumber}</p><p className="text-sm text-slate-500">Order: {shipment.orderId}</p></div><span className="rounded-full bg-pink-50 text-pink-700 px-3 py-1 text-xs font-bold">{statusLabel[shipment.status] || shipment.status}</span></div>
    <p className="text-sm text-slate-600">{shipment.recipientName} · {shipment.recipientPhone}</p>
    <p className="text-sm text-slate-600 flex gap-2"><MapPin size={16}/>{shipment.deliveryAddress.completeAddress}, {shipment.deliveryAddress.city}, {shipment.deliveryAddress.state}</p>
    <p className="text-sm font-bold">Delivery fee: ₦{Number(shipment.deliveryFee).toLocaleString()}</p>
    {shipment.status !== 'delivered' && shipment.status !== 'cancelled' && <>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2"><label className="block text-sm font-bold text-slate-800">Assigned Delivery Agent</label>{assignedAgent && <p className="text-xs text-slate-600">Current: {assignedAgent.fullName} · {assignedAgent.phone}</p>}
        <div className="flex flex-col sm:flex-row gap-2"><select value={selectedAgentId} onChange={event => setSelectedAgentId(event.target.value)} className="min-w-0 flex-1 border rounded-xl p-3 bg-white"><option value="">Unassign agent</option>{agents.filter(agent => agent.status === 'active' || agent.id === shipment.deliveryAgentId).map(agent => <option key={agent.id} value={agent.id}>{agent.fullName} · {agent.phone}</option>)}</select><button type="button" disabled={saving || selectedAgentId === (shipment.deliveryAgentId || '')} onClick={() => onAssign(selectedAgentId)} className="rounded-xl bg-[#0B172E] text-white px-4 py-3 font-bold disabled:opacity-50">Save Agent</button></div>
      </div>
      <div className="flex flex-wrap gap-2">{(['picked_up','in_transit','out_for_delivery','delivered','failed'] as const).map(status => <button key={status} type="button" disabled={saving} onClick={() => onUpdateStatus(status)} className={`text-xs rounded-lg border px-2.5 py-2 disabled:opacity-50 ${shipment.status === status ? 'bg-pink-600 text-white border-pink-600' : status === 'delivered' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}>{statusLabel[status]}</button>)}</div>
    </>}
    {shipment.trackingTimeline?.length > 0 && <div className="border-t pt-3 space-y-2"><p className="text-xs font-black text-slate-700">Tracking history</p>{shipment.trackingTimeline.map((step,index) => <div key={index} className="text-xs"><p className="font-bold text-slate-800">{step.title} <span className="font-normal text-slate-400">{step.date}</span></p><p className="text-slate-500">{step.description}</p></div>)}</div>}
  </div>;
};

const OrderShipmentCard: React.FC<{ order: Order; agents: DeliveryAgent[]; saving: boolean; onCreate: (agentId: string) => void }> = ({ order, agents, saving, onCreate }) => {
  const [agentId, setAgentId] = useState('');
  return <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><div><p className="font-black text-slate-900">Order #{order.orderNumber}</p><p className="text-sm text-slate-500">{order.buyerName} · {order.buyerPhone}</p></div><span className="text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full px-3 py-1">{order.status}</span></div>
    <p className="text-sm text-slate-600">{order.shippingAddress.completeAddress}, {order.shippingAddress.area}, {order.shippingAddress.city}, {order.shippingAddress.state}</p>
    <p className="text-sm font-bold text-slate-800">Delivery fee: ₦{Number(order.deliveryFee || 0).toLocaleString()} · Order total: ₦{Number(order.totalAmount || 0).toLocaleString()}</p>
    <div className="flex flex-col sm:flex-row gap-2"><select value={agentId} onChange={e => setAgentId(e.target.value)} className="flex-1 border rounded-xl p-3"><option value="">Assign agent later</option>{agents.filter(a => a.status === 'active').map(agent => <option key={agent.id} value={agent.id}>{agent.fullName} · {agent.phone}</option>)}</select><button disabled={saving} onClick={() => onCreate(agentId)} className="rounded-xl bg-pink-600 text-white px-4 py-3 font-bold disabled:opacity-50">Accept & Create Shipment</button></div>
  </div>;
};
