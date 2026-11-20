import React, { useState, useEffect, useCallback } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  LogOut,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  CreditCard,
  FileText,
  RotateCcw,
  Truck,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Clock,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Order, ReturnRequest } from '../types/index.ts';
import { InlinePhoneOtpVerifier } from '../components/InlinePhoneOtpVerifier.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import { getPaymentBadgeMeta } from '../utils/paymentTimer.ts';
import { INDIAN_STATES, GENDER_OPTIONS, type GenderOption } from '../utils/authValidation.ts';

interface AccountPageProps {
  onNavigate: (page: string, params?: any) => void;
}

type DashboardTab = 'profile' | 'orders' | 'return' | 'tracking' | 'change-password';

const RETURN_REASONS = [
  'Size Exchange',
  'Damaged / Defective Item',
  'Wrong Item Received',
  'Fit / Style Preference',
  'Quality Concern'
];

const TRACKING_STEPS = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'] as const;

function getStepIndex(status: Order['status']): number {
  if (status === 'Delivered') return 4;
  if (status === 'Shipped') return 3;
  if (status === 'Packed') return 2;
  if (status === 'Confirmed') return 1;
  return 0;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, logout, token, refreshUser, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Profile form state
  const splitName = (fullName?: string) => {
    const parts = (fullName || '').trim().split(/\s+/);
    return {
      first: parts[0] || '',
      last: parts.slice(1).join(' ')
    };
  };

  const [firstName, setFirstName] = useState(() => user?.firstName || splitName(user?.name).first);
  const [secondName, setSecondName] = useState(() => user?.lastName || splitName(user?.name).last);
  const [gender, setGender] = useState<GenderOption>(() => (user?.gender as GenderOption) || 'Male');
  const [profilePhone, setProfilePhone] = useState(() => user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Saved Address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMsg, setAddressMsg] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    apartment: '',
    city: '',
    state: 'Telangana',
    pinCode: '',
    country: 'India'
  });

  // Return request form state
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnSelectedSkus, setReturnSelectedSkus] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDetails, setReturnDetails] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnMsg, setReturnMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tracking tab state
  const [selectedTrackOrderId, setSelectedTrackOrderId] = useState<string>('');
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync profile fields when user updates
  useEffect(() => {
    if (!user) return;
    const parts = splitName(user.name);
    setFirstName(user.firstName || parts.first);
    setSecondName(user.lastName || parts.last);
    setGender((user.gender as GenderOption) || 'Male');
    setProfilePhone(user.phone || '');
    setNewAddress(prev => ({
      ...prev,
      fullName: prev.fullName || user.name || '',
      phone: prev.phone || user.phone || ''
    }));
  }, [user]);

  const fetchMyOrders = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setLoadingOrders(true);
      else setRefreshingOrders(true);
      try {
        const res = await fetch('/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const fetchedOrders: Order[] = data.orders || [];
        setOrders(fetchedOrders);
        if (fetchedOrders.length > 0 && !selectedTrackOrderId) {
          setSelectedTrackOrderId(fetchedOrders[0].id);
        }
        const eligible = fetchedOrders.filter(o => o.status !== 'Cancelled');
        if (eligible.length > 0 && !returnOrderId) {
          setReturnOrderId(eligible[0].id);
          setReturnSelectedSkus(eligible[0].items.map(i => i.sku));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
        setRefreshingOrders(false);
      }
    },
    [token, selectedTrackOrderId, returnOrderId]
  );

  const fetchMyReturns = useCallback(async () => {
    if (!token) return;
    setLoadingReturns(true);
    try {
      const res = await fetch('/api/returns/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReturnRequests(data.returnRequests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReturns(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchMyOrders(false);
    fetchMyReturns();
  }, [token, fetchMyOrders, fetchMyReturns]);

  // Live poll orders every 10s when on Orders or Tracking tab
  useEffect(() => {
    if (!token || (activeTab !== 'orders' && activeTab !== 'tracking')) return;
    const intervalId = window.setInterval(() => {
      fetchMyOrders(true);
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [token, activeTab, fetchMyOrders]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="font-display text-2xl font-bold text-white uppercase">Authentication Required</h2>
        <p className="text-xs text-neutral-400 mt-2">
          Sign in to manage your profile, orders, returns, shipment tracking, and password.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded-lg"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const res = await updateProfile({
      firstName: firstName.trim(),
      lastName: secondName.trim(),
      gender,
      phone: profilePhone.trim()
    });
    setSavingProfile(false);
    if (res.success) {
      setProfileMsg({ type: 'success', text: res.message || 'Profile details saved.' });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Could not update profile.' });
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMsg(null);
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });
      if (res.ok) {
        setShowAddAddress(false);
        setNewAddress({
          fullName: user.name || '',
          phone: user.phone || '',
          street: '',
          apartment: '',
          city: '',
          state: 'Telangana',
          pinCode: '',
          country: 'India'
        });
        await refreshUser();
        setAddressMsg('Address added to your address book.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/auth/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectReturnOrder = (orderId: string) => {
    setReturnOrderId(orderId);
    const found = orders.find(o => o.id === orderId);
    setReturnSelectedSkus(found ? found.items.map(i => i.sku) : []);
  };

  const toggleReturnSku = (sku: string) => {
    setReturnSelectedSkus(prev =>
      prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
    );
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnMsg(null);
    if (!returnOrderId) {
      setReturnMsg({ type: 'error', text: 'Select an order to submit a return request.' });
      return;
    }
    if (returnSelectedSkus.length === 0) {
      setReturnMsg({ type: 'error', text: 'Select at least one item to return or exchange.' });
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: returnOrderId,
          reason: returnReason,
          details: returnDetails.trim(),
          itemSkus: returnSelectedSkus
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setReturnMsg({ type: 'error', text: data.error || 'Could not submit return request.' });
      } else {
        setReturnMsg({ type: 'success', text: data.message || 'Return request submitted.' });
        setReturnDetails('');
        await fetchMyReturns();
      }
    } catch {
      setReturnMsg({ type: 'error', text: 'Network error submitting return request.' });
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleTrackLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupOrderNumber.trim().toUpperCase();
    if (!clean) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.order) {
        setLookupError(data.error || `No order found for ${clean}.`);
        setLookupResult(null);
      } else {
        setLookupResult(data.order);
      }
    } catch {
      setLookupError('Unable to fetch tracking details right now.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setChangingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: res.message || 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Could not change password.' });
    }
  };

  const eligibleReturnOrders = orders.filter(o => o.status !== 'Cancelled');
  const activeReturnOrder = eligibleReturnOrders.find(o => o.id === returnOrderId) || eligibleReturnOrders[0];
  const activeTrackedOrder =
    lookupResult || orders.find(o => o.id === selectedTrackOrderId) || orders[0] || null;

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Package className="w-4 h-4" />, count: orders.length },
    { id: 'return', label: 'Return', icon: <RotateCcw className="w-4 h-4" />, count: returnRequests.length },
    { id: 'tracking', label: 'Tracking', icon: <Truck className="w-4 h-4" /> },
    { id: 'change-password', label: 'Change Password', icon: <KeyRound className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Customer Dashboard Header */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center font-display text-xl font-black text-[#E5A914] border border-neutral-700 shrink-0">
            {(user.firstName || user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-black text-white uppercase tracking-tight">
                {user.name}
              </h1>
              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Mail Verified
                </span>
              )}
              {user.isPhoneVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Mobile Verified
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              {user.email} · {user.phone || 'No mobile linked'}
              {user.gender ? ` · ${user.gender}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider px-3.5 py-2 border border-red-500/25 rounded-lg hover:bg-red-500/10 w-fit transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* 5-Tab Navigation Bar */}
      <div
        className="flex overflow-x-auto border-b border-neutral-800 gap-6 text-xs font-bold uppercase tracking-wider no-scrollbar"
        role="tablist"
        aria-label="Customer dashboard sections"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`dashboard-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-[#E5A914] text-[#E5A914]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-[#E5A914]/20 text-[#E5A914]' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: PROFILE ==================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Personal Profile Card */}
          <div className="lg:col-span-7 bg-neutral-900/55 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-black text-white uppercase tracking-wide">
                Personal Information
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Keep your name, gender, and contact details up to date for GST invoices and deliveries.
              </p>
            </div>

            {profileMsg && (
              <div
                role={profileMsg.type === 'error' ? 'alert' : 'status'}
                className={`p-3 rounded-lg text-xs border flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/40 text-red-300'
                }`}
              >
                {profileMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="profile-first-name"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    id="profile-first-name"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-second-name"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                  >
                    Second Name
                  </label>
                  <input
                    id="profile-second-name"
                    type="text"
                    value={secondName}
                    onChange={e => setSecondName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="profile-email"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-neutral-950/60 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-400 font-mono rounded-lg cursor-not-allowed"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-phone"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                  >
                    Mobile Number (+91)
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="+919811223344"
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white font-mono rounded-lg focus:outline-none focus:border-[#E5A914]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                  Gender
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGender(opt)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                        gender === opt
                          ? 'bg-[#E5A914]/15 border-[#E5A914] text-[#E5A914]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {!user.isPhoneVerified && profilePhone && (
                <div className="pt-1">
                  <InlinePhoneOtpVerifier
                    phone={profilePhone}
                    purpose="verify-phone"
                    isVerified={Boolean(user.isPhoneVerified)}
                    onVerified={() => {
                      refreshUser();
                    }}
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  data-testid="save-profile-btn"
                  className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-6 py-2.5 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Saved Addresses Card */}
          <div className="lg:col-span-5 bg-neutral-900/55 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E5A914]" />
                <h2 className="font-display text-base font-black text-white uppercase tracking-wide">
                  Saved Addresses
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(v => !v)}
                className="bg-neutral-800 hover:bg-[#E5A914] hover:text-black text-white font-bold px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>

            {addressMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg">
                {addressMsg}
              </div>
            )}

            {showAddAddress && (
              <form
                onSubmit={handleCreateAddress}
                className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2.5"
              >
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#E5A914]">
                  New Shipping Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.fullName}
                    onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    value={newAddress.phone}
                    onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address-1 (House/Flat, Street)"
                  value={newAddress.street}
                  onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Address-2 (Landmark / Area - Optional)"
                  value={newAddress.apartment}
                  onChange={e => setNewAddress({ ...newAddress, apartment: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newAddress.state}
                    onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="bg-neutral-900 border border-neutral-800 px-2 py-2 text-xs text-white rounded"
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st} value={st} className="bg-neutral-950">
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="bg-neutral-900 border border-neutral-800 px-2.5 py-2 text-xs text-white rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="PIN Code"
                    maxLength={6}
                    value={newAddress.pinCode}
                    onChange={e =>
                      setNewAddress({ ...newAddress, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                    }
                    className="bg-neutral-900 border border-neutral-800 px-2.5 py-2 text-xs text-white font-mono rounded"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="text-xs text-neutral-400 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="bg-[#E5A914] text-black font-bold px-4 py-1.5 rounded text-xs disabled:opacity-50"
                  >
                    {savingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {user.addresses && user.addresses.length > 0 ? (
                user.addresses.map(addr => (
                  <div
                    key={addr.id}
                    className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#E5A914]/15 text-[#E5A914]">
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        aria-label="Delete address"
                        className="text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-neutral-300">
                      {addr.street}
                      {addr.apartment ? `, ${addr.apartment}` : ''}
                    </p>
                    <p className="text-neutral-400">
                      {addr.city}, {addr.state} — {addr.pinCode}
                    </p>
                    <p className="text-neutral-500 font-mono">{addr.phone}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center bg-neutral-950/50 border border-dashed border-neutral-800 rounded-xl">
                  <p className="text-xs text-neutral-400">No saved delivery addresses yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ORDERS LIST ==================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {!loadingOrders && orders.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: `All (${orders.length})` },
                  {
                    id: 'confirmed',
                    label: `Order Placed (${orders.filter(o => o.payment.status === 'completed' || (o.payment.provider === 'cod' && o.status !== 'Cancelled')).length})`
                  },
                  {
                    id: 'pending',
                    label: `Pending (${orders.filter(o => o.payment.status === 'pending' && o.payment.provider !== 'cod').length})`
                  },
                  {
                    id: 'cancelled',
                    label: `Cancelled (${orders.filter(o => o.payment.status === 'cancelled' || o.payment.status === 'failed' || o.status === 'Cancelled').length})`
                  }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      orderFilter === f.id
                        ? 'bg-[#E5A914] text-black'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fetchMyOrders(true)}
                disabled={refreshingOrders}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-neutral-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#E5A914] ${refreshingOrders ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>
            </div>
          )}

          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-28 bg-neutral-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800">
              <Package className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white uppercase">No Orders Yet</h3>
              <p className="text-xs text-neutral-400 mt-1">Explore Drop 04 to place your first piece.</p>
              <button
                onClick={() => onNavigate('shop')}
                className="mt-4 bg-[#E5A914] text-black font-extrabold px-5 py-2 text-xs uppercase tracking-widest rounded-lg"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            orders
              .filter(order => {
                if (orderFilter === 'confirmed') {
                  return order.payment.status === 'completed' || (order.payment.provider === 'cod' && order.status !== 'Cancelled');
                }
                if (orderFilter === 'pending') {
                  return order.payment.status === 'pending' && order.payment.provider !== 'cod';
                }
                if (orderFilter === 'cancelled') {
                  return order.payment.status === 'cancelled' || order.payment.status === 'failed' || order.status === 'Cancelled';
                }
                return true;
              })
              .map(order => {
                const payBadge = getPaymentBadgeMeta(order.payment.status, order.payment.gatewayStatus);
                const payToneClass =
                  payBadge.tone === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : payBadge.tone === 'pending'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : payBadge.tone === 'refunded'
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30';

                const orderToneClass =
                  order.status === 'Cancelled'
                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : order.status === 'Delivered' || order.status === 'Confirmed'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-neutral-800 text-white border-neutral-700';

                return (
                  <div
                    key={order.id}
                    className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-neutral-800/80">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#E5A914]">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-neutral-400 ml-3">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${payToneClass}`}>
                          {payBadge.label}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${orderToneClass}`}>
                          {order.status}
                        </span>
                        {order.payment.status === 'pending' &&
                          order.payment.provider !== 'cod' &&
                          order.payment.cashfreeOrderId && (
                            <button
                              onClick={() => onNavigate('payment-status', { orderId: order.payment.cashfreeOrderId })}
                              className="text-[11px] bg-[#E5A914] text-black font-extrabold px-2.5 py-1 rounded uppercase tracking-wider hover:bg-[#d49b10]"
                            >
                              Verify Payment
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => setInvoiceOrder(order)}
                          className="text-[11px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-[#E5A914]" />
                          Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLookupResult(null);
                            setSelectedTrackOrderId(order.id);
                            setActiveTab('tracking');
                          }}
                          className="text-[11px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[#E5A914] font-semibold px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                        >
                          <Truck className="w-3 h-3" />
                          Track
                        </button>
                        {order.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectReturnOrder(order.id);
                              setActiveTab('return');
                            }}
                            className="text-[11px] bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Return
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex gap-3 text-xs bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/60"
                        >
                          <img
                            src={item.image}
                            alt={item.productTitle}
                            className="w-12 h-14 object-cover rounded bg-neutral-900"
                          />
                          <div className="truncate">
                            <p className="font-semibold text-white truncate">{item.productTitle}</p>
                            <p className="text-[11px] text-neutral-400">
                              {item.colorName} · {item.size}
                            </p>
                            <p className="font-mono font-bold text-white mt-1">
                              ₹{item.price.toLocaleString()} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap justify-between items-center gap-2 text-xs border-t border-neutral-800/60">
                      <div className="flex flex-wrap items-center gap-3 text-neutral-400">
                        <span>
                          Total:{' '}
                          <strong className="font-mono text-white">₹{order.total.toLocaleString()}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-300">
                          <CreditCard className="w-3 h-3 text-[#E5A914]" />
                          {order.payment.paymentMethodDetail || order.payment.provider.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-neutral-400">
                        {order.shippingAddress.city}, {order.shippingAddress.state}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ==================== TAB 3: RETURN & EXCHANGE ==================== */}
      {activeTab === 'return' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submit Return Form */}
          <div className="lg:col-span-5 bg-neutral-900/55 border border-neutral-800 rounded-2xl p-6 space-y-4 h-fit">
            <div>
              <h2 className="font-display text-base font-black text-white uppercase tracking-wide">
                Request Return / Exchange
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                7-day hassle-free returns &amp; size exchanges across India.
              </p>
            </div>

            {returnMsg && (
              <div
                role={returnMsg.type === 'error' ? 'alert' : 'status'}
                className={`p-3 rounded-lg text-xs border flex items-center gap-2 ${
                  returnMsg.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/40 text-red-300'
                }`}
              >
                {returnMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{returnMsg.text}</span>
              </div>
            )}

            {eligibleReturnOrders.length === 0 ? (
              <div className="p-6 text-center bg-neutral-950/50 border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-400">
                You don&apos;t have any eligible orders available for return right now.
              </div>
            ) : (
              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label
                    htmlFor="return-order-select"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                  >
                    Select Order
                  </label>
                  <select
                    id="return-order-select"
                    value={activeReturnOrder?.id || ''}
                    onChange={e => handleSelectReturnOrder(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white font-mono rounded-lg focus:outline-none focus:border-[#E5A914]"
                  >
                    {eligibleReturnOrders.map(o => (
                      <option key={o.id} value={o.id} className="bg-neutral-950">
                        {o.orderNumber} — ₹{o.total.toLocaleString()} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>

                {activeReturnOrder && (
                  <div className="space-y-2">
                    <span className="block text-[11px] uppercase tracking-wider text-neutral-400">
                      Select Items
                    </span>
                    <div className="space-y-2">
                      {activeReturnOrder.items.map(item => {
                        const checked = returnSelectedSkus.includes(item.sku);
                        return (
                          <label
                            key={item.sku}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              checked
                                ? 'bg-[#E5A914]/10 border-[#E5A914]/50'
                                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleReturnSku(item.sku)}
                              className="accent-[#E5A914] w-4 h-4 rounded"
                            />
                            <div className="flex-1 min-w-0 text-xs">
                              <p className="font-semibold text-white truncate">{item.productTitle}</p>
                              <p className="text-[11px] text-neutral-400">
                                {item.colorName} · Size {item.size} · Qty {item.quantity}
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-white">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="return-reason"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                  >
                    Reason
                  </label>
                  <select
                    id="return-reason"
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                  >
                    {RETURN_REASONS.map(r => (
                      <option key={r} value={r} className="bg-neutral-950">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="return-details"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                  >
                    Additional Notes
                  </label>
                  <textarea
                    id="return-details"
                    rows={3}
                    value={returnDetails}
                    onChange={e => setReturnDetails(e.target.value)}
                    placeholder="Mention preferred exchange size or issue details..."
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReturn}
                  data-testid="submit-return-btn"
                  className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {submittingReturn ? 'Submitting Request...' : 'Submit Return Request'}
                </button>
              </form>
            )}
          </div>

          {/* Return Requests List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-black text-white uppercase tracking-wide">
                Your Return &amp; Exchange History
              </h2>
              <button
                type="button"
                onClick={fetchMyReturns}
                className="text-[11px] font-bold text-[#E5A914] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loadingReturns ? (
              <div className="h-32 bg-neutral-900 rounded-2xl animate-pulse" />
            ) : returnRequests.length === 0 ? (
              <div className="text-center py-14 bg-neutral-900/30 rounded-2xl border border-neutral-800">
                <RotateCcw className="w-9 h-9 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-white uppercase">No Return Requests</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Submitted returns and size exchanges will appear here with pickup status.
                </p>
              </div>
            ) : (
              returnRequests.map(ret => {
                const statusColor =
                  ret.status === 'Refund Completed' || ret.status === 'Approved'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : ret.status === 'Rejected'
                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : 'bg-[#E5A914]/15 text-[#E5A914] border-[#E5A914]/35';

                return (
                  <div
                    key={ret.id}
                    className="bg-neutral-900/55 border border-neutral-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#E5A914]">
                          {ret.orderNumber}
                        </span>
                        <span className="text-[11px] text-neutral-400 ml-2.5 font-mono">
                          ID: {ret.id}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${statusColor}`}>
                        {ret.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-white font-semibold">Reason: {ret.reason}</p>
                      {ret.details && <p className="text-neutral-400">{ret.details}</p>}
                    </div>

                    <div className="space-y-1.5">
                      {ret.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800/70"
                        >
                          <span className="text-neutral-200">
                            {it.productTitle} <span className="text-neutral-500">({it.colorName} / {it.size} × {it.quantity})</span>
                          </span>
                          <span className="font-mono font-bold text-white">
                            ₹{(it.price * it.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/70 text-[11px] text-neutral-400">
                      <span>
                        Refund Value:{' '}
                        <strong className="font-mono text-white">₹{ret.refundAmount.toLocaleString()}</strong>
                      </span>
                      {ret.pickupAwb && (
                        <span className="font-mono text-[#E5A914]">Pickup AWB: {ret.pickupAwb}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: TRACKING ==================== */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* Order Selector + Manual Lookup */}
          <div className="bg-neutral-900/55 border border-neutral-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                Your Recent Shipments
              </span>
              <div className="flex flex-wrap gap-2">
                {orders.length > 0 ? (
                  orders.map(o => {
                    const selected = !lookupResult && activeTrackedOrder?.id === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setLookupResult(null);
                          setLookupError('');
                          setSelectedTrackOrderId(o.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          selected
                            ? 'bg-[#E5A914] text-black border-[#E5A914]'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                        }`}
                      >
                        {o.orderNumber}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-neutral-500">No personal orders yet.</span>
                )}
              </div>
            </div>

            <form onSubmit={handleTrackLookup} className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={lookupOrderNumber}
                  onChange={e => setLookupOrderNumber(e.target.value)}
                  placeholder="Order # (e.g. 4L-2026-1001)"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-8 pr-3 py-2 text-xs text-white font-mono rounded-lg focus:outline-none focus:border-[#E5A914]"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2 rounded-lg bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold text-xs uppercase tracking-wider shrink-0 disabled:opacity-50"
              >
                {lookupLoading ? '...' : 'Track'}
              </button>
            </form>
          </div>

          {lookupError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-lg">
              {lookupError}
            </div>
          )}

          {!activeTrackedOrder ? (
            <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800">
              <Truck className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white uppercase">No Shipment Selected</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Place an order or enter an order number above to track live courier milestones.
              </p>
            </div>
          ) : (
            <div className="bg-neutral-900/55 border border-neutral-800 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400">
                    Tracking Order
                  </span>
                  <h2 className="font-mono text-lg font-black text-[#E5A914]">
                    {activeTrackedOrder.orderNumber}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg">
                    <span className="text-[10px] uppercase text-neutral-500 block">Courier</span>
                    <span className="font-bold text-white">
                      {activeTrackedOrder.tracking?.courierCompany || 'Blue Dart Express'}
                    </span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg">
                    <span className="text-[10px] uppercase text-neutral-500 block">AWB / Tracking ID</span>
                    <span className="font-mono font-bold text-[#E5A914]">
                      {activeTrackedOrder.tracking?.trackingNumber || 'Pending Handover'}
                    </span>
                  </div>
                  {activeTrackedOrder.tracking?.estimatedDeliveryDate && (
                    <div className="bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg">
                      <span className="text-[10px] uppercase text-neutral-500 block">Est. Delivery</span>
                      <span className="font-bold text-emerald-400">
                        {activeTrackedOrder.tracking.estimatedDeliveryDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5-Step Progress Bar */}
              {activeTrackedOrder.status === 'Cancelled' ? (
                <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 font-semibold">
                  This order has been cancelled.{' '}
                  {activeTrackedOrder.payment.cancellationReason || ''}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {TRACKING_STEPS.map((label, idx) => {
                    const currentIdx = getStepIndex(activeTrackedOrder.status);
                    const done = idx <= currentIdx;
                    const active = idx === currentIdx;
                    return (
                      <div key={label} className="text-center space-y-2">
                        <div className="flex items-center">
                          <div
                            className={`h-1 flex-1 rounded-full ${
                              idx === 0 ? 'bg-transparent' : done ? 'bg-[#E5A914]' : 'bg-neutral-800'
                            }`}
                          />
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0 ${
                              active
                                ? 'bg-[#E5A914] text-black border-[#E5A914] ring-4 ring-[#E5A914]/20'
                                : done
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                : 'bg-neutral-950 text-neutral-500 border-neutral-800'
                            }`}
                          >
                            {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <div
                            className={`h-1 flex-1 rounded-full ${
                              idx === TRACKING_STEPS.length - 1
                                ? 'bg-transparent'
                                : idx < currentIdx
                                ? 'bg-[#E5A914]'
                                : 'bg-neutral-800'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-bold block ${
                            active ? 'text-[#E5A914]' : done ? 'text-white' : 'text-neutral-500'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Timeline + Destination */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                <div className="md:col-span-7 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Shipment Activity Log
                  </h3>
                  <div className="space-y-3 border-l-2 border-neutral-800 pl-4">
                    {(activeTrackedOrder.statusHistory || [])
                      .slice()
                      .reverse()
                      .map((entry, idx) => (
                        <div key={idx} className="relative">
                          <span
                            className={`w-2.5 h-2.5 rounded-full absolute -left-[21px] top-1 ${
                              idx === 0 ? 'bg-[#E5A914]' : 'bg-neutral-600'
                            }`}
                          />
                          <p className="text-xs font-bold text-white">{entry.status}</p>
                          {entry.note && <p className="text-xs text-neutral-400 mt-0.5">{entry.note}</p>}
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="md:col-span-5 bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-2 text-xs h-fit">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#E5A914]">
                    Delivery Destination
                  </h3>
                  <p className="font-bold text-white">{activeTrackedOrder.shippingAddress.fullName}</p>
                  <p className="text-neutral-300">
                    {activeTrackedOrder.shippingAddress.street}
                    {activeTrackedOrder.shippingAddress.apartment
                      ? `, ${activeTrackedOrder.shippingAddress.apartment}`
                      : ''}
                  </p>
                  <p className="text-neutral-400">
                    {activeTrackedOrder.shippingAddress.city}, {activeTrackedOrder.shippingAddress.state} —{' '}
                    {activeTrackedOrder.shippingAddress.pinCode}
                  </p>
                  <p className="text-neutral-500 font-mono">{activeTrackedOrder.shippingAddress.phone}</p>
                  {activeTrackedOrder.tracking?.statusNotes && (
                    <div className="pt-2 mt-2 border-t border-neutral-800 text-[11px] text-neutral-300">
                      Latest Note: <span className="text-[#E5A914]">{activeTrackedOrder.tracking.statusNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: CHANGE PASSWORD ==================== */}
      {activeTab === 'change-password' && (
        <div className="max-w-lg bg-neutral-900/55 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-black text-white uppercase tracking-wide">
              Change Account Password
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Update your password anytime. Use at least 6 characters with a mix of letters and numbers.
            </p>
          </div>

          {passwordMsg && (
            <div
              role={passwordMsg.type === 'error' ? 'alert' : 'status'}
              className={`p-3 rounded-lg text-xs border flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}
            >
              {passwordMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="cp-current"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="cp-current"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 pr-10 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(v => !v)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="cp-new"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                New Password
              </label>
              <input
                id="cp-new"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                required
                minLength={6}
              />
            </div>

            <div>
              <label
                htmlFor="cp-confirm"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="cp-confirm"
                type={showPasswords ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              data-testid="change-password-submit"
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {changingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
};
