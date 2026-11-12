import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building,
  ShoppingBag,
  Store,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { db } from '../db/database';
import { User, AccountType } from '../types';
import { ProfileImageUploader } from './ProfileImageUploader';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [accountType, setAccountType] = useState<AccountType>('buyer');

  // Form states
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [productCategory, setProductCategory] = useState('Kano Shadda & Kaftan');
  const [city, setCity] = useState('Kano City');
  const [state, setState] = useState('Kano State');
  const [area, setArea] = useState('Kano Municipal');
  const [profileImage, setProfileImage] = useState('');

  // Login states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status message
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (accountType === 'seller' && !businessName.trim()) {
      setError('Please provide your Business Name as a seller.');
      return;
    }

    const res = db.registerUser({
      fullName,
      businessName: accountType === 'seller' ? businessName : undefined,
      phone,
      whatsAppNumber: accountType === 'seller' ? whatsAppNumber || phone : whatsAppNumber,
      email,
      password,
      address,
      businessAddress: accountType === 'seller' ? businessAddress || address : undefined,
      city,
      state,
      area,
      productCategory: accountType === 'seller' ? productCategory : undefined,
      accountType,
      profileImage: profileImage.trim() || undefined,
    });

    if (!res.success || !res.user) {
      setError(res.error || 'Failed to register account.');
      return;
    }

    setSuccessMessage(`Account registered successfully as ${accountType.toUpperCase()}! Welcome, ${res.user.fullName}.`);
    setTimeout(() => {
      onLoginSuccess(res.user!);
      onClose();
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = db.getUserByEmailOrPhone(loginIdentifier);
    if (!user) {
      setError('No account found with this phone number or email.');
      return;
    }

    if (user.password && user.password !== loginPassword) {
      setError('Incorrect password. Please try again or use Forgot Password.');
      return;
    }

    db.setCurrentUser(user);
    setSuccessMessage(`Logged in successfully! Welcome back, ${user.fullName} (${user.accountType.toUpperCase()}).`);
    setTimeout(() => {
      onLoginSuccess(user);
      onClose();
    }, 800);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setMode('login');
    }, 3000);
  };

  const quickSwitchUser = (emailOrPhone: string) => {
    const user = db.getUserByEmailOrPhone(emailOrPhone);
    if (user) {
      db.setCurrentUser(user);
      onLoginSuccess(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0B172E] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E6007E] rounded-xl text-white shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {mode === 'login'
                  ? 'Buyer Login'
                  : mode === 'register'
                  ? 'Buyer & Seller Registration'
                  : 'Reset Password'}
              </h3>
              <p className="text-xs text-pink-200 font-medium">KASUWAR KANAWA • AREWA SAI DAN AREWA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#E6007E] border-b-2 border-[#E6007E]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In (Shiga Shafin)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#E6007E] border-b-2 border-[#E6007E]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register (Bude Sabon Asusun)
            </button>
          </div>
        )}

        {/* Form Container */}
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number or Email (Lambar Waya ko Email)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09060938835 or yourname@gmail.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password (Kalmar Sirri)
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] font-bold text-[#E6007E] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#E6007E] hover:bg-[#D00071] active:scale-98 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Login to Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#E6007E] hover:underline cursor-pointer"
                >
                  Create Buyer Account
                </button>
              </div>

              {/* Demo Accounts Quick Switcher for Easy Testing */}
              <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl text-xs">
                <span className="block font-bold text-slate-600 mb-1.5 text-[11px] uppercase tracking-wider">
                  ⚡ Quick Test Demo Accounts:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickSwitchUser('09060938835')}
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-left hover:border-[#E6007E] transition-colors cursor-pointer"
                  >
                    <span className="font-bold block text-slate-800 truncate">Usman</span>
                    <span className="text-[10px] text-pink-600 font-semibold">Buyer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickSwitchUser('seller@kasuwarkanawa.com')}
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-left hover:border-[#E6007E] transition-colors cursor-pointer"
                  >
                    <span className="font-bold block text-slate-800 truncate">Danladi</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Seller</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickSwitchUser('admin@kasuwarkanawa.com')}
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-left hover:border-[#E6007E] transition-colors cursor-pointer"
                  >
                    <span className="font-bold block text-slate-800 truncate">Admin</span>
                    <span className="text-[10px] text-blue-600 font-semibold">CPanel</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. REGISTRATION MODE */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Account Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Account Type (Nau'in Asusun)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('buyer')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      accountType === 'buyer'
                        ? 'border-[#E6007E] bg-pink-50 text-[#E6007E] ring-1 ring-[#E6007E]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div>Buyer (Mai Siyayya)</div>
                      <span className="text-[10px] font-normal text-slate-500">Shop all products</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('seller')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      accountType === 'seller'
                        ? 'border-[#E6007E] bg-pink-50 text-[#E6007E] ring-1 ring-[#E6007E]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div>Seller (Dan Kasuwa)</div>
                      <span className="text-[10px] font-normal text-slate-500">Sell on Kanawa</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Profile Image Upload (Buyer & Seller) */}
              <ProfileImageUploader
                value={profileImage}
                onChange={setProfileImage}
                name={fullName || (accountType === 'seller' ? businessName : 'New User')}
                role={accountType}
                label={
                  accountType === 'seller'
                    ? 'Seller / Store Logo & Profile Picture (Hoton Bayani)'
                    : 'Buyer Profile Picture (Hoton Bayani Mai Siyayya)'
                }
                helperText={
                  accountType === 'seller'
                    ? 'Upload your store logo or merchant photo from gallery/camera. Auto-resized to 512x512 WebP.'
                    : 'Select your profile photo from camera or gallery. Auto-optimized to max 512x512 WebP.'
                }
              />

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (Cikakken Suna) *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ibrahim Aliyu Bello"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* SELLER SPECIFIC: Business Name */}
              {accountType === 'seller' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business / Store Name (Sunan Kasuwanci) *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Danladi Textiles & Brocade Hub"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Phone & WhatsApp / Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number (Lambar Waya) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="080... or 090..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {accountType === 'seller' ? 'WhatsApp Number (Lambar WhatsApp) *' : 'Email Address *'}
                  </label>
                  <div className="relative">
                    {accountType === 'seller' ? (
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    )}
                    <input
                      type={accountType === 'seller' ? 'tel' : 'email'}
                      required
                      placeholder={accountType === 'seller' ? 'e.g. 2348000000000' : 'you@gmail.com'}
                      value={accountType === 'seller' ? whatsAppNumber : email}
                      onChange={(e) =>
                        accountType === 'seller' ? setWhatsAppNumber(e.target.value) : setEmail(e.target.value)
                      }
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* For Seller: Additional Email & Product Category */}
              {accountType === 'seller' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="seller@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Category (Nau'in Kayayyaki) *
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] bg-white"
                    >
                      <option value="Kano Shadda & Kaftan">Kano Shadda & Kaftan</option>
                      <option value="Phones & Gadgets">Phones & Gadgets</option>
                      <option value="Men's Fashion & Caps">Men's Fashion & Caps</option>
                      <option value="Women's Abayas & Veils">Women's Abayas & Veils</option>
                      <option value="Electronics & Appliances">Electronics & Appliances</option>
                      <option value="Shoes & Leather Bags">Shoes & Leather Bags</option>
                      <option value="Provisions & Groceries">Provisions & Groceries</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password (Kalmar Sirri) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {accountType === 'seller' ? 'Business Address (Adireshin Shago / Kasuwa) *' : 'Complete Delivery Address *'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={
                      accountType === 'seller'
                        ? 'e.g. Shop 42, Block B, Kasuwar Kwari Market, Kano'
                        : 'e.g. No. 25 Zoo Road / Sabo Garba Way'
                    }
                    value={accountType === 'seller' ? businessAddress : address}
                    onChange={(e) =>
                      accountType === 'seller' ? setBusinessAddress(e.target.value) : setAddress(e.target.value)
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-[#E6007E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-[#E6007E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kano Area</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-[#E6007E] bg-white"
                  >
                    <option value="Kano Municipal">Kano Municipal</option>
                    <option value="Fagge">Fagge (Kwari)</option>
                    <option value="Nassarawa">Nassarawa GRA</option>
                    <option value="Dala">Dala (Kurmi)</option>
                    <option value="Gwale">Gwale / Kabuga</option>
                    <option value="Tarauni">Tarauni</option>
                    <option value="Kumbotso">Kumbotso</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#E6007E] hover:bg-[#D00071] active:scale-98 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#E6007E] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <p className="text-xs text-slate-600">
                Enter your registered phone number or email address. We will send a secure password reset verification code.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09060938835"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>
              </div>

              {resetSent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                  <span>Password reset instructions sent via SMS and Email!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#E6007E] hover:bg-[#D00071] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Send Reset Code
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
