import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePreview } from './ImagePreview';
import { CODSettlementPanel } from './CODSettlementPanel';
import { ProfileImageUploader } from './ProfileImageUploader';
import { User, LogisticsCompany, DeliveryAgent, LogisticsShipment, Order, LogisticsServiceArea, LogisticsPricing, LogisticsPickupCentre } from '../types';
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
  const [centres, setCentres] = useState<LogisticsPickupCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'overview' | 'orders' | 'agents' | 'shipments' | 'centres' | 'areas' | 'cod'>('overview');
  const [serviceAreas, setServiceAreas] = useState<LogisticsServiceArea[]>([]);
  const [pricing, setPricing] = useState<LogisticsPricing[]>([]);
  const [areaState, setAreaState] = useState('Kano State');
  const [areaCities, setAreaCities] = useState('');
  const [areaNames, setAreaNames] = useState('');
  const [feeState, setFeeState] = useState('Kano State');
  const [feeCity, setFeeCity] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
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
  const [centreName, setCentreName] = useState('');
  const [centreType, setCentreType] = useState<'pickup' | 'dropoff' | 'both'>('both');
  const [centreContact, setCentreContact] = useState('');
  const [centrePhone, setCentrePhone] = useState('');
  const [centreAddress, setCentreAddress] = useState('');
  const [centreState, setCentreState] = useState('');
  const [centreCity, setCentreCity] = useState('');
  const [centreArea, setCentreArea] = useState('');
  const [centreHours, setCentreHours] = useState('Monday-Saturday, 8:00 AM-6:00 PM');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [companyData, agentData, orderData, shipmentData, centresData] = await Promise.all([
        marketplaceApi.logistics.company(), marketplaceApi.logistics.agents(),
        marketplaceApi.logistics.orders(), marketplaceApi.logistics.shipments(), marketplaceApi.logistics.centres(),
      ]);
      setCompany(companyData); setServiceAreas(companyData.serviceAreas || []); setPricing(companyData.pricing || []); setAgents(agentData); setOrders(orderData); setShipments(shipmentData); setCentres(centresData);
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

  const addCentre = async (event: React.FormEvent) => {
    event.preventDefault();
    await runAction(() => marketplaceApi.logistics.addCentre({
      centreName: centreName.trim(), centreType, contactName: centreContact.trim(),
      phone: centrePhone.trim(), address: centreAddress.trim(), state: centreState.trim(),
      city: centreCity.trim(), area: centreArea.trim(), openingHours: centreHours.trim(),
    }), 'Pickup/drop-off centre added successfully.');
    setCentreName(''); setCentreContact(''); setCentrePhone(''); setCentreAddress('');
    setCentreState(''); setCentreCity(''); setCentreArea('');
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
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"><RefreshCw className="animate-spin mx-auto mb-3 text-emerald-700" /><p className="font-bold">Loading secure logistics workspace…</p></div>
    </div>
  );

  if (error && !company) return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-black text-slate-900">Logistics dashboard unavailable</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <div className="mt-5 flex gap-2"><button onClick={() => void refresh()} className="flex-1 rounded-xl bg-emerald-800 text-white p-3 font-bold">Retry</button><button onClick={onClose} className="rounded-xl border px-4 font-bold">Close</button></div>
      </div>
    </div>
  );

  if (!company || company.approvalStatus !== 'approved' || user.status !== 'active') return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-black text-slate-900">Logistics approval required</h2>
        <p className="mt-2 text-slate-600">This company account must be approved by Super Admin before the dashboard can be used.</p>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-emerald-800 text-white p-3 font-bold">Close</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-[#031b14]/85 p-0 backdrop-blur-md sm:p-4">
      <div className="h-[100dvh] w-full max-w-[1440px] overflow-y-auto bg-[#f5f8f4] shadow-2xl sm:h-[94vh] sm:rounded-[28px]">
        {company.logo && <ImagePreview src={company.logo} alt={company.companyName} isOpen={companyImagePreviewOpen} onClose={() => setCompanyImagePreviewOpen(false)} />}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#063b2a] via-[#07583b] to-[#0b6846] p-4 text-white shadow-lg sm:p-7">
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

        <main className="space-y-5 bg-[radial-gradient(circle_at_top_right,_rgba(226,194,116,.12),_transparent_32%),#f5f8f4] p-4 sm:p-7">
          {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}<button onClick={() => setNotice('')} className="float-right font-bold">×</button></div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex gap-2"><AlertCircle size={18} className="shrink-0"/><span>{error}</span><button onClick={() => setError('')} className="ml-auto font-bold">×</button></div>}
          <nav className="grid grid-cols-2 gap-2 rounded-[22px] border border-emerald-100 bg-white p-3 shadow-sm sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
            {(['overview', 'orders', 'agents', 'shipments', 'centres', 'areas', 'cod'] as const).map(item => <button key={item} onClick={() => setTab(item)} className={`rounded-xl p-3 font-bold capitalize border ${tab === item ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-slate-700 border-slate-200'}`}>{item === 'agents' ? 'Delivery Agents' : item === 'shipments' ? 'Tracking & Shipments' : item === 'orders' ? 'Available Orders' : item === 'centres' ? 'Pickup Centres' : item === 'areas' ? 'Service Areas & Fees' : item === 'cod' ? 'COD Remittance' : 'Overview'}</button>)}
          </nav>

          {tab === 'overview' && <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{counts.map(({label,value,icon:Icon}) => <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4"><Icon className="text-emerald-700 mb-3" /><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-black text-slate-900">{value}</p></div>)}</section>
            <section className="bg-white rounded-2xl border border-slate-200 p-4"><h2 className="font-black text-lg mb-2">Company Contact</h2><p className="text-slate-600">{company.contactName}</p><p className="text-slate-600">{company.phone} · WhatsApp: {company.whatsAppNumber || 'Not provided'}</p><p className="text-slate-600">{company.address}, {company.city}, {company.state}</p><p className="text-xs text-slate-500 mt-2">Company ID: {company.id}</p></section>
          </>}

          {tab === 'orders' && <section className="space-y-3"><h2 className="font-black text-xl">Available Orders</h2>{orders.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No paid, dispatched orders have been assigned to your company yet.</div> : orders.map(order => <OrderShipmentCard key={order.id} order={order} agents={agents} saving={saving} onCreate={agentId => void createShipment(order, agentId)} />)}</section>}

          {tab === 'agents' && <section className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h2 className="font-black text-xl">Delivery Agents</h2><button disabled={saving} onClick={() => setShowAgentForm(v => !v)} className="rounded-xl bg-emerald-800 text-white px-4 py-2 font-bold flex items-center gap-2 disabled:opacity-50"><Plus size={17}/> Add Agent</button></div>
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
            {agents.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No delivery agents added yet.</div> : agents.map(agent => <div key={agent.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-3">{agent.profileImage ? <img src={agent.profileImage} alt={agent.fullName} className="w-12 h-12 rounded-full object-cover border" /> : <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Users size={20}/></div>}<div><p className="font-bold text-slate-900">{agent.fullName}</p><p className="text-sm text-slate-500 break-words">{agent.phone} · WhatsApp: {agent.whatsAppNumber || agent.phone}</p><p className="text-xs text-slate-500">{[agent.vehicleType,agent.vehiclePlateNumber].filter(Boolean).join(' · ') || 'Vehicle not specified'}</p><span className={`inline-flex mt-2 text-xs font-bold rounded-full px-2 py-1 ${agent.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{agent.status}</span></div></div><div className="flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void runAction(() => marketplaceApi.logistics.updateAgent(agent.id, agent.status === 'active' ? 'inactive' : 'active'), `${agent.fullName} status updated.`)} className="rounded-lg border px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">{agent.status === 'active' ? 'Deactivate' : 'Activate'}</button><button type="button" disabled={saving} onClick={() => { if (window.confirm(`Remove ${agent.fullName} from your delivery agents?`)) void runAction(() => marketplaceApi.logistics.removeAgent(agent.id), 'Delivery agent removed.'); }} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50">Remove</button></div></div></div>)}
          </section>}

          {tab === 'shipments' && <section className="space-y-3"><h2 className="font-black text-xl">Tracking & Shipments</h2>{shipments.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No shipments created yet.</div> : shipments.map(shipment => <ShipmentManagementCard key={shipment.id} shipment={shipment} agents={agents} saving={saving} onAssign={agentId => void runAction(() => marketplaceApi.logistics.assignAgent(shipment.id, agentId || null), 'Delivery agent assignment saved.')} onUpdateStatus={status => void changeShipmentStatus(shipment, status)} />)}</section>}
          {tab === 'centres' && <section className="space-y-4">
            <div><h2 className="font-black text-xl">Pickup & Drop-off Centres</h2><p className="text-sm text-slate-600 mt-1">Register your verified customer collection and parcel handover locations. Only active centres should be offered to buyers.</p></div>
            <form onSubmit={addCentre} className="bg-white border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm font-bold">Centre name<input required value={centreName} onChange={e=>setCentreName(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" placeholder="e.g. Kano City Pickup Hub" /></label>
              <label className="text-sm font-bold">Centre type<select value={centreType} onChange={e=>setCentreType(e.target.value as 'pickup'|'dropoff'|'both')} className="mt-1 w-full border rounded-xl p-3 bg-white font-normal"><option value="both">Pickup & Drop-off</option><option value="pickup">Customer Pickup</option><option value="dropoff">Seller Drop-off</option></select></label>
              <label className="text-sm font-bold">Contact person<input required value={centreContact} onChange={e=>setCentreContact(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" /></label>
              <label className="text-sm font-bold">Phone number<input required value={centrePhone} onChange={e=>setCentrePhone(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" /></label>
              <label className="text-sm font-bold sm:col-span-2">Full address<input required value={centreAddress} onChange={e=>setCentreAddress(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" /></label>
              <label className="text-sm font-bold">State<input required value={centreState} onChange={e=>setCentreState(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" placeholder="Kano State" /></label>
              <label className="text-sm font-bold">City / LGA<input required value={centreCity} onChange={e=>setCentreCity(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" placeholder="Kano Municipal" /></label>
              <label className="text-sm font-bold">Area / District<input value={centreArea} onChange={e=>setCentreArea(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" /></label>
              <label className="text-sm font-bold">Opening hours<input required value={centreHours} onChange={e=>setCentreHours(e.target.value)} className="mt-1 w-full border rounded-xl p-3 font-normal" /></label>
              <button type="submit" disabled={saving} className="sm:col-span-2 rounded-xl bg-emerald-800 text-white p-3 font-bold disabled:opacity-50">{saving ? 'Saving…' : 'Add Pickup / Drop-off Centre'}</button>
            </form>
            <div className="space-y-3">{centres.length===0 ? <div className="bg-white border rounded-2xl p-6 text-center text-slate-500">No pickup or drop-off centres have been registered yet.</div> : centres.map(centre=><article key={centre.id} className="bg-white border rounded-2xl p-4 space-y-2">
              <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-black">{centre.centreName}</h3><p className="text-xs text-slate-500">{centre.centreType==='both'?'Pickup & Drop-off':centre.centreType==='pickup'?'Customer Pickup':'Seller Drop-off'} · {centre.isActive?'Active':'Inactive'}</p></div><div className="flex gap-2"><button type="button" disabled={saving} onClick={()=>void runAction(()=>marketplaceApi.logistics.updateCentre(centre.id,!centre.isActive),centre.isActive?'Centre deactivated.':'Centre activated.')} className="rounded-lg border px-3 py-2 text-xs font-bold">{centre.isActive?'Deactivate':'Activate'}</button><button type="button" disabled={saving} onClick={()=>{if(window.confirm('Remove this pickup/drop-off centre?'))void runAction(()=>marketplaceApi.logistics.removeCentre(centre.id),'Centre removed.');}} className="rounded-lg border border-red-200 text-red-600 px-3 py-2 text-xs font-bold">Remove</button></div></div>
              <p className="text-sm text-slate-600"><MapPin size={14} className="inline mr-1"/>{centre.address}, {centre.area ? centre.area+', ' : ''}{centre.city}, {centre.state}</p>
              <p className="text-sm text-slate-600">{centre.contactName} · {centre.phone}</p><p className="text-xs text-slate-500">{centre.openingHours}</p>
            </article>)}</div>
          </section>}
          {tab === 'areas' && <section className="space-y-4">
            <div><h2 className="font-black text-xl">Service Areas & Delivery Pricing</h2><p className="text-sm text-slate-600 mt-1">Choose the states and cities your company serves, then set a delivery fee for each city. All fees are in Nigerian Naira (₦).</p></div>
            <div className="bg-white border rounded-2xl p-4 space-y-3">
              <h3 className="font-black text-slate-900">Add service area</h3>
              <label className="block text-sm font-semibold">State<input value={areaState} onChange={e=>setAreaState(e.target.value)} className="mt-1 w-full border rounded-xl p-3" placeholder="e.g. Kano State" /></label>
              <label className="block text-sm font-semibold">Cities / LGAs<input value={areaCities} onChange={e=>setAreaCities(e.target.value)} className="mt-1 w-full border rounded-xl p-3" placeholder="Separate multiple cities with commas" /></label>
              <label className="block text-sm font-semibold">Areas / districts (optional)<input value={areaNames} onChange={e=>setAreaNames(e.target.value)} className="mt-1 w-full border rounded-xl p-3" placeholder="e.g. Yakasai, Sabon Gari, Gwale" /></label>
              <button type="button" onClick={()=>{
                const state=areaState.trim(), cities=areaCities.split(',').map(x=>x.trim()).filter(Boolean), areas=areaNames.split(',').map(x=>x.trim()).filter(Boolean);
                if(!state || !cities.length){setError('Enter a state and at least one city.');return;}
                const existing=serviceAreas.find(x=>x.state.toLowerCase()===state.toLowerCase());
                const merged=[...(existing?.cities||[]),...cities].filter((value,index,all)=>all.findIndex(item=>item.toLowerCase()===value.toLowerCase())===index);
                setServiceAreas(existing ? (serviceAreas.map(x => x === existing ? ({ ...x, cities: merged, areas: [...(x.areas || []), ...areas].filter((value,index,all) => all.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index) }) : x)) : ([...serviceAreas, { state, cities, areas }]));
                setAreaCities('');setAreaNames('');setError('');setNotice('Service area added to the unsaved changes list.');
              }} className="w-full rounded-xl bg-slate-900 text-white p-3 font-bold">Add Service Area</button>
              <div className="space-y-2">{serviceAreas.map((area,index)=><div key={area.state} className="rounded-xl border p-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold">{area.state}</p><p className="text-sm text-slate-600">{area.cities.join(', ')}</p>{!!area.areas?.length&&<p className="text-xs text-slate-500 mt-1">Areas: {area.areas.join(', ')}</p>}</div><button type="button" onClick={()=>{setServiceAreas(items=>items.filter((_,i)=>i!==index));setPricing(items=>items.filter(p=>p.state.toLowerCase()!==area.state.toLowerCase()||!area.cities.some(city=>city.toLowerCase()===p.city.toLowerCase())));}} className="text-sm font-bold text-red-600">Remove</button></div>)}</div>
            </div>
            <div className="bg-white border rounded-2xl p-4 space-y-3">
              <h3 className="font-black text-slate-900">Add delivery fee</h3>
              <label className="block text-sm font-semibold">State<select value={feeState} onChange={e=>{setFeeState(e.target.value);setFeeCity('');}} className="mt-1 w-full border rounded-xl p-3 bg-white"><option value="">Select state</option>{serviceAreas.map(a=><option key={a.state} value={a.state}>{a.state}</option>)}</select></label>
              <label className="block text-sm font-semibold">City / LGA<select value={feeCity} onChange={e=>setFeeCity(e.target.value)} className="mt-1 w-full border rounded-xl p-3 bg-white"><option value="">Select city</option>{(serviceAreas.find(a=>a.state===feeState)?.cities||[]).map(city=><option key={city} value={city}>{city}</option>)}</select></label>
              <label className="block text-sm font-semibold">Delivery fee (₦)<input type="number" min="0" step="1" value={feeAmount} onChange={e=>setFeeAmount(e.target.value)} className="mt-1 w-full border rounded-xl p-3" placeholder="e.g. 1500" /></label>
              <button type="button" onClick={()=>{
                const fee=Number(feeAmount);
                if(!feeState||!feeCity||feeAmount.trim()===''||!Number.isFinite(fee)||fee<0){setError('Select a state and city, then enter a valid delivery fee.');return;}
                if(pricing.some(p=>p.state.toLowerCase()===feeState.toLowerCase()&&p.city.toLowerCase()===feeCity.toLowerCase())){setError('A delivery fee already exists for this city. Remove it first if you want to change it.');return;}
                setPricing(items=>[...items,{state:feeState,city:feeCity,fee,currency:'NGN'}]);setFeeAmount('');setError('');setNotice('Delivery fee added to the unsaved changes list.');
              }} className="w-full rounded-xl bg-slate-900 text-white p-3 font-bold">Add Delivery Fee</button>
              <div className="space-y-2">{pricing.map((item,index)=><div key={item.state+'-'+item.city} className="rounded-xl border p-3 flex items-center justify-between gap-3"><div><p className="font-bold">{item.city}, {item.state}</p><p className="text-sm text-slate-600">₦{Number(item.fee).toLocaleString('en-NG')}</p></div><button type="button" onClick={()=>setPricing(items=>items.filter((_,i)=>i!==index))} className="text-sm font-bold text-red-600">Remove</button></div>)}</div>
            </div>
            <button type="button" disabled={saving} onClick={async()=>{
              setError('');setNotice('');
              if(!serviceAreas.length){setError('Add at least one service area before saving.');return;}
              if(!pricing.length){setError('Add at least one delivery fee before saving.');return;}
              if(JSON.stringify(serviceAreas)===JSON.stringify(company?.serviceAreas||[])&&JSON.stringify(pricing)===JSON.stringify(company?.pricing||[])){setNotice('No changes to save. Your existing service areas and fees are already up to date.');return;}
              setSaving(true);
              try{
                const saved=await marketplaceApi.logistics.updateCompany({serviceAreas,pricing});
                const savedAreas=JSON.stringify(saved.serviceAreas||[]),savedPricing=JSON.stringify(saved.pricing||[]);
                if(savedAreas!==JSON.stringify(serviceAreas)||savedPricing!==JSON.stringify(pricing))throw new Error('The server response does not match the settings you submitted. Please refresh and check again.');
                await refresh();onDataChanged?.();setNotice('Service areas and delivery fees saved and verified successfully.');
              }catch(err){setError(err instanceof Error?err.message:'Unable to save service areas and delivery fees.');}
              finally{setSaving(false);}
            }} className="w-full rounded-xl bg-emerald-800 text-white p-3 font-bold disabled:opacity-50">{saving?'Saving and verifying…':'Save Service Areas & Delivery Fees'}</button>
            <p className="text-xs text-slate-500">Changes remain in this form until you save. The system verifies the saved values returned by the database before showing success.</p>
          </section>}
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
      <div className="flex flex-wrap gap-2">{(['picked_up','in_transit','out_for_delivery','delivered','failed'] as const).map(status => <button key={status} type="button" disabled={saving} onClick={() => onUpdateStatus(status)} className={`text-xs rounded-lg border px-2.5 py-2 disabled:opacity-50 ${shipment.status === status ? 'bg-emerald-800 text-white border-emerald-800' : status === 'delivered' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}>{statusLabel[status]}</button>)}</div>
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
    <div className="flex flex-col sm:flex-row gap-2"><select value={agentId} onChange={e => setAgentId(e.target.value)} className="flex-1 border rounded-xl p-3"><option value="">Assign agent later</option>{agents.filter(a => a.status === 'active').map(agent => <option key={agent.id} value={agent.id}>{agent.fullName} · {agent.phone}</option>)}</select><button disabled={saving} onClick={() => onCreate(agentId)} className="rounded-xl bg-emerald-800 text-white px-4 py-3 font-bold disabled:opacity-50">Accept & Create Shipment</button></div>
  </div>;
};
