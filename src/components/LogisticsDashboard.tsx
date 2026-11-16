import React, { useMemo, useState } from 'react';
import { User } from '../types';
import { db } from '../db/database';
import { ArrowLeft, Package, Truck, Users, MapPin, Plus, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

type Props = {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onDataChanged?: () => void;
};

const statusLabel: Record<string, string> = {
  awaiting_pickup: 'Awaiting pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const LogisticsDashboard: React.FC<Props> = ({ user, onClose, onLogout }) => {
  const company = db.getLogisticsCompanyByOwner(user.id);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<'overview' | 'orders' | 'agents' | 'shipments'>('overview');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentWhatsApp, setAgentWhatsApp] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [notice, setNotice] = useState('');

  const agents = useMemo(() => company ? db.getDeliveryAgents(company.id) : [], [company, refreshKey]);
  const shipments = useMemo(() => company ? db.getLogisticsShipments({ logisticsCompanyId: company.id }) : [], [company, refreshKey]);
  const orders = useMemo(() => db.getOrders().filter(order =>
    !order.logisticsCompanyId &&
    ['payment_confirmed', 'processing', 'dispatched'].includes(order.status)
  ), [refreshKey]);

  if (!company || company.approvalStatus !== 'approved' || user.status !== 'active') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <h2 className="text-xl font-black text-slate-900">Logistics approval required</h2>
          <p className="mt-2 text-slate-600">This company account must be approved by Super Admin before the dashboard can be used.</p>
          <button onClick={onClose} className="mt-5 w-full rounded-xl bg-pink-600 text-white p-3 font-bold">Close</button>
        </div>
      </div>
    );
  }

  const refresh = () => setRefreshKey(value => value + 1);

  const addAgent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!agentName.trim() || !agentPhone.trim()) {
      setNotice('Enter the delivery agent name and phone number.');
      return;
    }
    db.addDeliveryAgent({
      logisticsCompanyId: company.id,
      fullName: agentName.trim(),
      phone: agentPhone.trim(),
      whatsAppNumber: agentWhatsApp.trim() || agentPhone.trim(),
      vehicleType: vehicleType.trim() || undefined,
      status: 'active',
    });
    setAgentName('');
    setAgentPhone('');
    setAgentWhatsApp('');
    setVehicleType('');
    setShowAgentForm(false);
    setNotice('Delivery agent added successfully.');
    refresh();
  };

  const createShipment = (order: ReturnType<typeof db.getOrders>[number], agentId: string) => {
    try {
      const shipment = db.createLogisticsShipment({
        orderId: order.id,
        logisticsCompanyId: company.id,
        deliveryAgentId: agentId || undefined,
        buyerId: order.buyerId,
        recipientName: order.shippingAddress.fullName || order.buyerName,
        recipientPhone: order.shippingAddress.phoneNumber || order.buyerPhone,
        deliveryAddress: order.shippingAddress,
        deliveryFee: order.deliveryFee,
        status: 'awaiting_pickup',
        trackingTimeline: [{
          title: 'Shipment created',
          date: new Date().toISOString(),
          completed: true,
          description: 'Shipment accepted by ' + company.companyName,
        }],
      });
      setNotice(`Shipment created. Tracking ID: ${shipment.trackingNumber}`);
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not create shipment.');
    }
  };

  const updateStatus = (shipmentId: string, status: any) => {
    db.updateShipmentStatus(shipmentId, status);
    setNotice('Shipment status updated.');
    refresh();
  };

  const counts = [
    { label: 'Available Orders', value: orders.length, icon: Package },
    { label: 'Shipments', value: shipments.length, icon: Truck },
    { label: 'Delivery Agents', value: agents.length, icon: Users },
    { label: 'Delivered', value: shipments.filter(item => item.status === 'delivered').length, icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-start justify-center p-0 sm:p-4">
      <div className="w-full max-w-5xl h-[100dvh] sm:h-[92vh] bg-slate-50 sm:rounded-2xl shadow-2xl overflow-y-auto">
        <header className="sticky top-0 z-20 bg-[#0B172E] text-white p-4 sm:p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {company.logo ? <img src={company.logo} alt="" className="w-12 h-12 rounded-xl object-cover bg-white" /> : <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center"><Truck /></div>}
            <div className="min-w-0">
              <p className="text-xs text-pink-300 font-bold uppercase tracking-wide">Logistics Company Dashboard</p>
              <h1 className="font-black text-lg sm:text-xl truncate">{company.companyName}</h1>
              <p className="text-xs text-slate-300">Approved company account</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={refresh} title="Refresh" className="p-2 rounded-lg bg-white/10"><RefreshCw size={18} /></button>
            <button onClick={onLogout} title="Logout" className="p-2 rounded-lg bg-white/10"><LogOut size={18} /></button>
            <button onClick={onClose} title="Close" className="p-2 rounded-lg bg-white/10"><ArrowLeft size={18} /></button>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-5">
          {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}<button onClick={() => setNotice('')} className="float-right font-bold">×</button></div>}

          <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['overview', 'orders', 'agents', 'shipments'] as const).map(item => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-xl p-3 font-bold capitalize border ${tab === item ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-700 border-slate-200'}`}>{item === 'agents' ? 'Delivery Agents' : item === 'shipments' ? 'Tracking & Shipments' : item === 'orders' ? 'Available Orders' : 'Overview'}</button>
            ))}
          </nav>

          {tab === 'overview' && <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {counts.map(({label, value, icon: Icon}) => <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4"><Icon className="text-pink-600 mb-3" /><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-black text-slate-900">{value}</p></div>)}
            </section>
            <section className="bg-white rounded-2xl border border-slate-200 p-4">
              <h2 className="font-black text-lg mb-2">Company Contact</h2>
              <p className="text-slate-600">{company.contactName}</p>
              <p className="text-slate-600">{company.phone} · WhatsApp: {company.whatsAppNumber || 'Not provided'}</p>
              <p className="text-slate-600">{company.address}, {company.city}, {company.state}</p>
            </section>
          </>}

          {tab === 'orders' && <section className="space-y-3">
            <h2 className="font-black text-xl">Available Orders</h2>
            {orders.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No eligible orders are available for logistics assignment yet.</div> : orders.map(order => <OrderShipmentCard key={order.id} order={order} agents={agents} onCreate={agentId => createShipment(order, agentId)} />)}
          </section>}

          {tab === 'agents' && <section className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h2 className="font-black text-xl">Delivery Agents</h2><button onClick={() => setShowAgentForm(v => !v)} className="rounded-xl bg-pink-600 text-white px-4 py-2 font-bold flex items-center gap-2"><Plus size={17}/> Add Agent</button></div>
            {showAgentForm && <form onSubmit={addAgent} className="bg-white border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Agent full name" className="border rounded-xl p-3" required />
              <input value={agentPhone} onChange={e => setAgentPhone(e.target.value)} placeholder="Phone number" className="border rounded-xl p-3" required />
              <input value={agentWhatsApp} onChange={e => setAgentWhatsApp(e.target.value)} placeholder="WhatsApp number (optional)" className="border rounded-xl p-3" />
              <input value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="Vehicle type (optional)" className="border rounded-xl p-3" />
              <button className="sm:col-span-2 rounded-xl bg-[#0B172E] text-white p-3 font-bold">Save Delivery Agent</button>
            </form>}
            {agents.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No delivery agents added yet.</div> : agents.map(agent => <div key={agent.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3"><div><p className="font-bold text-slate-900">{agent.fullName}</p><p className="text-sm text-slate-500">{agent.phone} · {agent.whatsAppNumber}</p><p className="text-xs text-slate-500">{agent.vehicleType || 'Vehicle not specified'}</p></div><span className="text-xs font-bold text-emerald-700">{agent.status}</span></div>)}
          </section>}

          {tab === 'shipments' && <section className="space-y-3">
            <h2 className="font-black text-xl">Tracking & Shipments</h2>
            {shipments.length === 0 ? <div className="bg-white rounded-2xl border p-6 text-center text-slate-500">No shipments created yet.</div> : shipments.map(shipment => <div key={shipment.id} className="bg-white border rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-2"><div><p className="font-black text-slate-900">{shipment.trackingNumber}</p><p className="text-sm text-slate-500">Order: {shipment.orderId}</p></div><span className="rounded-full bg-pink-50 text-pink-700 px-3 py-1 text-xs font-bold">{statusLabel[shipment.status] || shipment.status}</span></div>
              <p className="text-sm text-slate-600">{shipment.recipientName} · {shipment.recipientPhone}</p>
              <p className="text-sm text-slate-600 flex gap-2"><MapPin size={16}/>{shipment.deliveryAddress.completeAddress}, {shipment.deliveryAddress.city}, {shipment.deliveryAddress.state}</p>
              <div className="flex flex-wrap gap-2">{(['awaiting_pickup','picked_up','in_transit','out_for_delivery','delivered','failed'] as const).map(status => <button key={status} onClick={() => updateStatus(shipment.id, status)} className={`text-xs rounded-lg border px-2.5 py-2 ${shipment.status === status ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-700 border-slate-200'}`}>{statusLabel[status]}</button>)}</div>
            </div>)}
          </section>}
        </main>
      </div>
    </div>
  );
};

const OrderShipmentCard: React.FC<{
  order: ReturnType<typeof db.getOrders>[number];
  agents: ReturnType<typeof db.getDeliveryAgents>;
  onCreate: (agentId: string) => void;
}> = ({ order, agents, onCreate }) => {
  const [agentId, setAgentId] = useState('');
  return <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><div><p className="font-black text-slate-900">Order #{order.orderNumber}</p><p className="text-sm text-slate-500">{order.buyerName} · {order.buyerPhone}</p></div><span className="text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full px-3 py-1">{order.status}</span></div>
    <p className="text-sm text-slate-600">{order.shippingAddress.completeAddress}, {order.shippingAddress.city}, {order.shippingAddress.state}</p>
    <p className="text-sm font-bold text-slate-800">Delivery fee: ₦{Number(order.deliveryFee || 0).toLocaleString()}</p>
    <div className="flex flex-col sm:flex-row gap-2">
      <select value={agentId} onChange={e => setAgentId(e.target.value)} className="flex-1 border rounded-xl p-3"><option value="">Assign agent later</option>{agents.filter(a => a.status === 'active').map(agent => <option key={agent.id} value={agent.id}>{agent.fullName} · {agent.phone}</option>)}</select>
      <button onClick={() => onCreate(agentId)} className="rounded-xl bg-pink-600 text-white px-4 py-3 font-bold">Accept & Create Shipment</button>
    </div>
  </div>;
};
