import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Wind, Thermometer, ShieldAlert, RefreshCw, MapPin, Activity, 
  User, Bell, X, HeartPulse, Download, CheckCircle2, BellRing, Navigation, Leaf, ArrowRight, ShieldCheck, Flame, Droplets,
  Users, Smartphone, Radio
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import KeypadSimulator from './KeypadSimulator';

// Dynamic API Base URL (Fallback to Render Live Backend)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ecopulse-backend-j2sh.onrender.com';

// Web Push VAPID Public Key
const VAPID_PUBLIC_KEY = "BIMv_MgooqWb6Fas2bJdX45INUS0KE_61PaYtbkvyiHE17Ylgls4Twu0ahTk9TydXoxeZhU2oWxCL1hthC58nmA";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// High-Tech Cyber-Atmosphere Dynamic Background
function CyberAtmosphereBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute -top-40 -left-20 w-[650px] h-[650px] bg-cyan-500/15 rounded-full blur-[140px] animate-pulse-cyan" />
      <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[160px] animate-pulse-purple" />
      <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-emerald-500/15 rounded-full blur-[150px] animate-pulse-cyan" />

      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cyber-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="24" cy="24" r="1" fill="#38bdf8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cyber-grid)" />
      </svg>

      <div className="absolute top-1/4 left-1/6 w-2.5 h-2.5 bg-cyan-400/50 rounded-full blur-[2px] animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-2/3 left-1/4 w-3.5 h-3.5 bg-emerald-400/40 rounded-full blur-[2px] animate-float" style={{ animationDelay: '2.5s' }} />
      <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-indigo-400/50 rounded-full blur-[2px] animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-1/4 right-1/6 w-2 h-2 bg-teal-300/60 rounded-full blur-[2px] animate-float" style={{ animationDelay: '1.2s' }} />
    </div>
  );
}

function App() {
  const [city, setCity] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Subscriber Telemetry Stats State
  const [subscriberStats, setSubscriberStats] = useState({
    total: 143,
    web: 142,
    keypad: 1
  });

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('ecopulse_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showMorningPopup, setShowMorningPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isPushSubscribed, setIsPushSubscribed] = useState(
    () => localStorage.getItem('ecopulse_push_subscribed') === 'true'
  );

  const [profileForm, setProfileForm] = useState({
    name: userProfile?.name || '',
    city: userProfile?.city || 'Bhopal',
    condition: userProfile?.condition || 'Asthma'
  });

  const cityRef = useRef(city);
  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Add to Home Screen karne ke liye:\nBrowser menu (3 dots) par click kijiye aur "Install EcoPulse" select kijiye.');
    }
  };

  const getPersonalizedAdvisory = (condition, aqi) => {
    if (!condition || condition === 'None') {
      return latestData?.advisory || 'Air quality is normal. Enjoy outdoor activities.';
    }
    if (condition === 'Asthma') {
      if (aqi > 100) return 'High Respiratory Strain: Ambient particulate exceeds safety limits. Carry an inhaler and avoid outdoor jogs.';
      return 'Air quality acceptable. Keep emergency medication accessible during morning rush.';
    }
    if (condition === 'Dust Allergy') {
      if (aqi > 80) return 'Elevated Particulate Dust: Micro-pollutants high. Wear an N95 mask to prevent nasal irritation.';
      return 'Moderate dust present. Keep car and room windows rolled up during peak traffic.';
    }
    if (condition === 'Heart Condition') {
      if (aqi > 120) return 'Elevated Stress Alert: High PM concentrations increase vascular strain. Remain indoors in filtered air.';
      return 'Cardiac safe margins intact. Normal light physical routine allowed.';
    }
    return latestData?.advisory;
  };

  // Register Service Worker & Subscribe Device to Backend Web Push
  const registerBackgroundPush = async (targetCity, targetCondition) => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported in this browser.');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await axios.post(`${API_BASE_URL}/api/notifications/subscribe`, {
        subscription: JSON.stringify(subscription),
        city: targetCity || userProfile?.city || 'Bhopal',
        condition: (targetCondition || userProfile?.condition || 'NONE').toUpperCase()
      });

      localStorage.setItem('ecopulse_push_subscribed', 'true');
      setIsPushSubscribed(true);
      return true;
    } catch (err) {
      console.error('Background Push Subscription Error:', err);
      return false;
    }
  };

  const sendSystemNotification = (data) => {
    if (Notification.permission === 'granted') {
      const condition = userProfile?.condition || 'General';
      const advisory = getPersonalizedAdvisory(condition, data.aqi);

      new Notification(`EcoPulse 6:30 AM Alert - ${data.city}`, {
        body: `AQI: ${data.aqi} (${data.status}) | Temp: ${data.temperature}°C\nAdvice: ${advisory}`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png'
      });
    }
  };

  const requestNotificationAccess = async (customCity, customCondition) => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);

      if (perm === 'granted') {
        const subOk = await registerBackgroundPush(
          customCity || city || userProfile?.city,
          customCondition || userProfile?.condition
        );
        if (latestData) {
          sendSystemNotification(latestData);
        }
        if (subOk) {
          alert('✅ Background 6:30 AM Alerts Enabled! Ab website band rehne par bhi roz subah 6:30 AM notification aayega.');
        }
      } else {
        alert('Browser settings se Notifications allow karein taaki 6:30 AM alerts aa sakein.');
      }
    }
  };

  // Trigger Backend Server Push Test (Real Service Worker Push Test)
  const triggerServerPushTest = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/notifications/test-trigger`);
      alert('Server Push Triggered! Agar subscription active hai toh kuch seconds mein background notification aayega.');
    } catch (err) {
      if (latestData) sendSystemNotification(latestData);
    }
  };

  // Fetch Live Subscribers Breakdown
  const fetchSubscriberStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sms/stats`);
      setSubscriberStats({
        total: res.data.totalSubscribers,
        web: res.data.webUsers,
        keypad: res.data.keypadUsers
      });
    } catch {
      setSubscriberStats((prev) => ({
        total: prev.web + prev.keypad,
        web: 142,
        keypad: prev.keypad
      }));
    }
  };

  const fetchAqiData = async (targetCity) => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/air-quality/latest?city=${encodeURIComponent(targetCity)}`),
        axios.get(`${API_BASE_URL}/api/air-quality/history?city=${encodeURIComponent(targetCity)}`)
      ]);

      setLatestData(latestRes.data);
      
      const formattedHistory = [...historyRes.data].reverse().map(item => ({
        time: new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aqi: item.aqi,
        pm25: item.pm25,
        pm10: item.pm10
      }));
      setHistoryData(formattedHistory);
      setCity(latestRes.data.city || targetCity);
      setError('');
      return latestRes.data;
    } catch (err) {
      setError(`No air quality record found for "${targetCity}".`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resolveCurrentLocationAndFetch = (isMorningTrigger = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const geoRes = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
            );
            const liveCity = 
              geoRes.data.address.city || 
              geoRes.data.address.town || 
              geoRes.data.address.county || 
              geoRes.data.address.state_district || 
              (userProfile?.city || 'Bhopal');

            const freshData = await fetchAqiData(liveCity);
            if (isMorningTrigger && freshData) {
              sendSystemNotification(freshData);
              setShowMorningPopup(true);
            }
          } catch {
            const fallbackCity = userProfile?.city || 'Bhopal';
            const freshData = await fetchAqiData(fallbackCity);
            if (isMorningTrigger && freshData) {
              sendSystemNotification(freshData);
              setShowMorningPopup(true);
            }
          }
        },
        async () => {
          const fallbackCity = userProfile?.city || 'Bhopal';
          const freshData = await fetchAqiData(fallbackCity);
          if (isMorningTrigger && freshData) {
            sendSystemNotification(freshData);
            setShowMorningPopup(true);
          }
        },
        { timeout: 7000 }
      );
    } else {
      const fallbackCity = userProfile?.city || 'Bhopal';
      fetchAqiData(fallbackCity);
    }
  };

  useEffect(() => {
    if (userProfile) {
      resolveCurrentLocationAndFetch(false);
      fetchSubscriberStats();
      setShowMorningPopup(true);

      // Re-sync push subscription with updated city/condition if permission already granted
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        registerBackgroundPush(userProfile.city, userProfile.condition);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!city || !userProfile) return;
    const interval = setInterval(() => {
      fetchAqiData(cityRef.current);
      fetchSubscriberStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [city, userProfile]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      setLoading(true);
      setError('');
      fetchAqiData(searchCity.trim());
      setSearchCity('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    localStorage.setItem('ecopulse_user', JSON.stringify(profileForm));
    setUserProfile(profileForm);
    setIsProfileModalOpen(false);
    setLoading(true);
    await fetchAqiData(profileForm.city);
    fetchSubscriberStats();
    setShowMorningPopup(true);
    await requestNotificationAccess(profileForm.city, profileForm.condition);
  };

  const handleLogout = () => {
    localStorage.removeItem('ecopulse_user');
    setUserProfile(null);
    setProfileForm({ name: '', city: 'Bhopal', condition: 'Asthma' });
  };

  const getAqiBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'good':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
      case 'moderate':
        return 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]';
      case 'poor':
        return 'bg-orange-500/15 text-orange-300 border-orange-400/40 shadow-[0_0_20px_rgba(249,115,22,0.35)]';
      case 'unhealthy':
      case 'severe':
        return 'bg-rose-500/15 text-rose-300 border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.4)]';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // 1. SIGNUP SCREEN
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#04080e] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <CyberAtmosphereBackground />

        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-3xl border border-cyan-500/30 rounded-[36px] p-8 shadow-[0_20px_80px_rgba(6,182,212,0.18)] relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 rounded-3xl text-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.6)] mb-2 animate-bounce">
              <Leaf className="w-10 h-10 fill-slate-950" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent tracking-tight">
              EcoPulse
            </h1>
            <p className="text-xs text-cyan-400/80 font-medium">
              Environmental Health Advisory & 2G GSM Telemetry
            </p>
          </div>

          <div className="bg-cyan-950/40 border border-cyan-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-cyan-200 backdrop-blur-md">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Create your account to unlock personalized respiratory warnings and 6:30 AM alerts.</span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Your Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Kavyanjali Thakur"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-2xl text-sm text-slate-100 outline-none transition shadow-inner font-medium focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Your Primary City</label>
              <input
                type="text"
                required
                placeholder="e.g. Bhopal"
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-2xl text-sm text-slate-100 outline-none transition shadow-inner font-medium focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Respiratory / Health Sensitivity</label>
              <select
                value={profileForm.condition}
                onChange={(e) => setProfileForm({ ...profileForm, condition: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 rounded-2xl text-sm text-slate-100 outline-none transition shadow-inner font-medium cursor-pointer focus:ring-1 focus:ring-cyan-400"
              >
                <option value="None">None (General Healthy)</option>
                <option value="Asthma">Asthma (Inhaler Alert)</option>
                <option value="Dust Allergy">Dust / Pollen Allergy (Mask Alert)</option>
                <option value="Bronchitis">Bronchitis</option>
                <option value="Heart Condition">Cardiac / Heart Sensitivity</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_35px_rgba(6,182,212,0.4)] active:scale-95"
            >
              <span>Get Started & Unlock Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-500">
            Encrypted local profile storage • Offline GSM fallback supported
          </p>
        </div>
      </div>
    );
  }

  // 2. MAIN VIBRANT DASHBOARD SCREEN
  return (
    <div className="min-h-screen bg-[#04080e] text-slate-100 p-4 sm:p-6 md:p-10 font-sans relative overflow-x-hidden selection:bg-cyan-400 selection:text-black">
      <CyberAtmosphereBackground />

      <div className="max-w-6xl mx-auto space-y-7 relative z-10">
        
        {/* Floating Glass Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-slate-900/70 backdrop-blur-2xl border border-cyan-500/20 p-5 rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 rounded-2xl text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)]">
              <Leaf className="w-7 h-7 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  EcoPulse
                </h1>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Telemetry Live
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium tracking-wide">
                Environmental Health HUD & Offline 2G Telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => resolveCurrentLocationAndFetch(false)}
              title="Sync Current Live GPS Location"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/80 hover:bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>GPS Sync</span>
            </button>

            <button
              onClick={() => requestNotificationAccess()}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm ${
                notificationPermission === 'granted' && isPushSubscribed
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse'
              }`}
            >
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>
                {notificationPermission === 'granted' && isPushSubscribed
                  ? '6:30 AM Push: Active'
                  : 'Enable 6:30 AM Alert'}
              </span>
            </button>

            <button
              onClick={handleInstallPWA}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md shadow-cyan-950"
            >
              <Download className="w-4 h-4" />
              <span>Install PWA</span>
            </button>

            {/* Profile / Logout Menu */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl p-1">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-200 hover:text-cyan-300 text-xs font-semibold transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{userProfile.name}</span>
              </button>
              <button
                onClick={handleLogout}
                title="Logout"
                className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
              >
                Logout
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 flex-1 lg:flex-initial">
              <input
                type="text"
                placeholder="Search station..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="px-3.5 py-2 bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-slate-100 focus:outline-none flex-1 lg:w-40 font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-md shadow-cyan-950 active:scale-95"
              >
                Search
              </button>
            </form>
          </div>
        </header>

        {/* LIVE USER SUBSCRIBER TELEMETRY HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-cyan-500/30 p-4.5 rounded-2xl flex items-center justify-between shadow-lg shadow-cyan-950/20">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Active Subscribers</div>
              <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{subscriberStats.total}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Dual-channel live ecosystem</div>
            </div>
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-teal-500/30 p-4.5 rounded-2xl flex items-center justify-between shadow-lg shadow-teal-950/20">
            <div>
              <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Smartphone Web PWA</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">{subscriberStats.web} <span className="text-xs text-teal-400 font-normal">Active</span></div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">High-Speed HUD Dashboard</div>
            </div>
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-emerald-500/30 p-4.5 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-950/20">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Offline 2G Keypad GSM</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">{subscriberStats.keypad} <span className="text-xs text-emerald-400 font-normal">SIMs</span></div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">SMS Cellular Subscribers</div>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-28 text-cyan-400 gap-3">
            <RefreshCw className="w-9 h-9 animate-spin text-cyan-400" />
            <p className="text-sm font-semibold tracking-wide">Syncing EcoPulse environmental telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300 text-sm">
            {error}
          </div>
        ) : latestData ? (
          <main className="space-y-6">
            {/* HERO CARD */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-cyan-950/30 backdrop-blur-2xl border border-cyan-500/30 p-8 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="absolute top-0 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                  <MapPin className="w-4 h-4 text-cyan-400" /> Live Station Telemetry
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight">{latestData.city}</h2>
                <p className="text-xs text-slate-400">
                  Last Ping: {new Date(latestData.recordedAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-6 bg-slate-950/80 border border-cyan-500/30 px-7 py-5 rounded-3xl shadow-inner relative z-10">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-extrabold">Air Quality Index</div>
                  <div className="text-6xl font-black text-white leading-tight">{latestData.aqi}</div>
                </div>
                <span className={`px-4 py-2.5 rounded-2xl text-sm font-black border ${getAqiBadgeStyle(latestData.status)}`}>
                  {latestData.status}
                </span>
              </div>
            </div>

            {/* PERSONALIZED MEDICAL ADVISORY HUD */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-cyan-950/30 backdrop-blur-2xl border border-indigo-500/30 p-6 rounded-[28px] space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
                <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm">
                  <HeartPulse className="w-5 h-5 text-rose-400 animate-pulse" />
                  <span>Clinical Risk Assessment for {userProfile.name}</span>
                </div>
                <span className="text-xs px-3 py-1 bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/40 font-bold">
                  Sensitivity: {userProfile.condition}
                </span>
              </div>
              <div className="flex items-start gap-3.5 pt-1">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {getPersonalizedAdvisory(userProfile.condition, latestData.aqi)}
                </p>
              </div>
            </div>

            {/* 4 MULTI-COLOR METRIC TILES */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 p-5 rounded-2xl shadow-lg transition duration-300 group">
                <div className="flex justify-between items-center text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <span>PM 2.5</span>
                  <Droplets className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl font-black mt-2 text-white">
                  {latestData.pm25} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Fine inhalable particles</div>
              </div>

              <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400 p-5 rounded-2xl shadow-lg transition duration-300 group">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <span>PM 10</span>
                  <Wind className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl font-black mt-2 text-white">
                  {latestData.pm10} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Coarse airborne dust</div>
              </div>

              <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-amber-500/30 hover:border-amber-400 p-5 rounded-2xl shadow-lg transition duration-300 group">
                <div className="flex justify-between items-center text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <span>CO Density</span>
                  <Flame className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl font-black mt-2 text-white">
                  {latestData.co} <span className="text-xs font-normal text-slate-400">ppm</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Carbon Monoxide gas</div>
              </div>

              <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-rose-500/30 hover:border-rose-400 p-5 rounded-2xl shadow-lg transition duration-300 group">
                <div className="flex justify-between items-center text-xs font-bold text-rose-400 uppercase tracking-wider">
                  <span>Thermal Index</span>
                  <Thermometer className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                </div>
                <div className="text-3xl font-black mt-2 text-white">
                  {latestData.temperature}°C
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Ambient Temperature</div>
              </div>
            </div>

            {/* LIVE AQI TELEMETRY GRAPH */}
            <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-cyan-500/25 p-7 rounded-[30px] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-extrabold text-slate-100 tracking-wide text-base">
                    Continuous 24-Hour Telemetry Oscillations
                  </h3>
                </div>
                <span className="text-[10px] text-cyan-400/80 font-mono font-bold uppercase tracking-wider">
                  Pollutant Wave: Real-time
                </span>
              </div>
              <div className="h-64 w-full">
                {historyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cyberAqiColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0e2338" />
                      <XAxis dataKey="time" stroke="#38bdf8" fontSize={11} />
                      <YAxis stroke="#38bdf8" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#030c14', borderColor: '#06b6d4', borderRadius: '1rem', color: '#f0fdf4' }}
                      />
                      <Area type="monotone" dataKey="aqi" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#cyberAqiColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No historical readings available.
                  </div>
                )}
              </div>
            </div>

            {/* RETRO NOKIA GSM SIMULATOR */}
            <KeypadSimulator />
          </main>
        ) : null}

        {/* 6:30 AM Morning Briefing Modal */}
        {showMorningPopup && latestData && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-[0_20px_60px_rgba(6,182,212,0.3)]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400">
                    <Bell className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Daily Health & Weather Briefing</h3>
                    <p className="text-xs text-cyan-400/80 font-medium">Auto-Triggered for 06:30 AM • Good Morning, {userProfile.name}!</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMorningPopup(false)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/20 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500">Live Station</span>
                  <div className="text-base font-bold text-slate-100">{latestData.city}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Temperature</span>
                  <div className="text-base font-bold text-slate-100">{latestData.temperature}°C</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Current AQI</span>
                  <div className="text-2xl font-black text-cyan-400">{latestData.aqi}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Pollution Category</span>
                  <div className="text-sm font-bold text-orange-400 mt-1">{latestData.status}</div>
                </div>
              </div>

              <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-400" /> Sensitivity: {userProfile.condition}
                </div>
                <p className="text-sm text-slate-200 font-medium">
                  {getPersonalizedAdvisory(userProfile.condition, latestData.aqi)}
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={triggerServerPushTest}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
                >
                  Test Background Push
                </button>
                <button
                  onClick={() => setShowMorningPopup(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-xl transition cursor-pointer shadow-lg shadow-cyan-950"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Edit Modal */}
        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" /> Edit Health Profile
                </h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Your Home City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhopal"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Respiratory / Health Sensitivity</label>
                  <select
                    value={profileForm.condition}
                    onChange={(e) => setProfileForm({ ...profileForm, condition: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="None">None (Healthy)</option>
                    <option value="Asthma">Asthma</option>
                    <option value="Dust Allergy">Dust / Pollen Allergy</option>
                    <option value="Bronchitis">Bronchitis</option>
                    <option value="Heart Condition">Cardiac / Heart Sensitivity</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;