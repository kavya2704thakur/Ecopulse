import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Smartphone, Send, Clock, Wifi, BatteryCharging, Radio, Delete, Sparkles } from 'lucide-react';

export default function KeypadSimulator() {
  const [phone, setPhone] = useState('9153702574');
  const [command, setCommand] = useState('JOIN BHOPAL ASTHMA');
  const [activeInput, setActiveInput] = useState('command'); // 'phone' | 'command'
  const [messages, setMessages] = useState([
    { sender: 'EcoPulse Gateway', text: 'GSM 2G Cellular Connected. Service Online.', time: '06:00 AM' }
  ]);
  const [loading, setLoading] = useState(false);

  // Multi-tap timing refs
  const lastKeyRef = useRef(null);
  const keyIndexRef = useRef(0);
  const keyTimeoutRef = useRef(null);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Nokia T9 Multi-tap mapping
  const keyMap = {
    '1': ['1', '.', ',', '-'],
    '2': ['A', 'B', 'C', '2'],
    '3': ['D', 'E', 'F', '3'],
    '4': ['G', 'H', 'I', '4'],
    '5': ['J', 'K', 'L', '5'],
    '6': ['M', 'N', 'O', '6'],
    '7': ['P', 'Q', 'R', 'S', '7'],
    '8': ['T', 'U', 'V', '8'],
    '9': ['W', 'X', 'Y', 'Z', '9'],
    '0': [' ', '0'],
    '*': ['*', '+'],
    '#': ['#']
  };

  const handleKeyPress = (numKey) => {
    if (activeInput === 'phone') {
      // Phone number me direct number type hoga
      setPhone((prev) => prev + numKey);
      return;
    }

    // Command typing (Multi-tap text mode)
    const chars = keyMap[numKey] || [numKey];

    if (lastKeyRef.current === numKey) {
      // Same key repeatedly pressed within 900ms -> cycle through letters
      clearTimeout(keyTimeoutRef.current);
      keyIndexRef.current = (keyIndexRef.current + 1) % chars.length;
      const nextChar = chars[keyIndexRef.current];

      setCommand((prev) => prev.slice(0, -1) + nextChar);

      keyTimeoutRef.current = setTimeout(() => {
        lastKeyRef.current = null;
        keyIndexRef.current = 0;
      }, 900);
    } else {
      // New key pressed
      clearTimeout(keyTimeoutRef.current);
      lastKeyRef.current = numKey;
      keyIndexRef.current = 0;
      const nextChar = chars[0];

      setCommand((prev) => prev + nextChar);

      keyTimeoutRef.current = setTimeout(() => {
        lastKeyRef.current = null;
        keyIndexRef.current = 0;
      }, 900);
    }
  };

  const handleBackspace = () => {
    if (activeInput === 'phone') {
      setPhone((prev) => prev.slice(0, -1));
    } else {
      setCommand((prev) => prev.slice(0, -1));
    }
  };

  const handleSendSms = async () => {
    if (!command.trim()) return;
    setLoading(true);
    const userMsg = command.trim();
    const sendTime = getCurrentTime();

    setMessages((prev) => [
      ...prev,
      { sender: 'Me', text: userMsg, time: sendTime }
    ]);

    try {
      const res = await axios.post(`http://localhost:8080/api/sms/inbound?from=${phone}&body=${encodeURIComponent(userMsg)}`);
      setMessages((prev) => [
        ...prev,
        { sender: 'EcoPulse Gateway', text: res.data.smsResponse, time: getCurrentTime() }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'Network Alert', text: 'Gateway ping failed. Check backend port 8080.', time: getCurrentTime() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBlast = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/sms/trigger-morning-blast');
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'EcoPulse 06:30 AM', 
          text: 'EcoPulse Alert: Daily 6:30 AM broadcast sent to all registered subscribers.',
          time: '06:30 AM'
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'Scheduler Alert', text: 'Cron blast simulation failed.', time: getCurrentTime() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const keyRows = [
    [ { key: '1', sub: '.,-' }, { key: '2', sub: 'ABC' }, { key: '3', sub: 'DEF' } ],
    [ { key: '4', sub: 'GHI' }, { key: '5', sub: 'JKL' }, { key: '6', sub: 'MNO' } ],
    [ { key: '7', sub: 'PQRS' }, { key: '8', sub: 'TUV' }, { key: '9', sub: 'WXYZ' } ],
    [ { key: '*', sub: 'SYM' }, { key: '0', sub: 'SPACE' }, { key: '#', sub: 'MODE' } ],
  ];

  return (
    <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(16,185,129,0.1)] max-w-xl mx-auto my-12 transition-all">
      
      {/* Background Bio Pulse Glow Elements */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-emerald-950/60">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shadow-inner">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                EcoPulse Keypad Phone
              </h2>
              <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm">
                <Radio className="w-3 h-3 animate-ping text-emerald-400" /> 2G GSM Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Multi-Tap Nokia Keypad & Direct Keyboard Input Supported</p>
          </div>
        </div>
      </div>

      {/* Quick Preset Commands Chips */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1">Presets:</span>
        <button
          onClick={() => setCommand('JOIN INDORE ALLERGY')}
          className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 rounded-lg transition"
        >
          Indore (Allergy)
        </button>
        <button
          onClick={() => setCommand('JOIN DELHI HEART')}
          className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 rounded-lg transition"
        >
          Delhi (Heart)
        </button>
        <button
          onClick={() => setCommand('JOIN BHOPAL ASTHMA')}
          className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 rounded-lg transition"
        >
          Bhopal (Asthma)
        </button>
        <button
          onClick={() => setCommand('STOP')}
          className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-rose-950/50 text-rose-300 border border-rose-500/30 rounded-lg transition"
        >
          STOP
        </button>
      </div>

      {/* Hardware Phone Shell */}
      <div className="mt-6 mx-auto max-w-[350px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-900/50 rounded-[44px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
        
        {/* Metallic Speaker Grill */}
        <div className="w-20 h-1.5 bg-slate-800 mx-auto rounded-full mb-4 border border-slate-700/50 shadow-inner" />

        {/* OLED Retro Display */}
        <div className="relative bg-[#070d12] border-2 border-emerald-500/40 rounded-2xl p-3.5 shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)] overflow-hidden">
          
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-35" />

          {/* Status Bar */}
          <div className="flex justify-between items-center text-[10px] text-emerald-400/90 border-b border-emerald-900/50 pb-1.5 mb-2.5 font-mono">
            <span className="flex items-center gap-1 tracking-wider font-semibold">
              <Wifi className="w-3 h-3 text-emerald-400" /> BSNL 2G
            </span>
            <span className="font-semibold text-emerald-300">EcoSMS v2.5</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              92% <BatteryCharging className="w-3 h-3" />
            </span>
          </div>

          {/* Messages Area */}
          <div className="h-56 overflow-y-auto space-y-2.5 pr-1 font-mono text-[11px] scrollbar-thin scrollbar-thumb-emerald-900">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'Me';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[9px] text-emerald-600 mb-0.5 px-1 flex items-center gap-1 font-semibold">
                    <span>{m.sender}</span>
                    <span>•</span>
                    <span>{m.time}</span>
                  </div>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed shadow-lg ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-br-xs border border-emerald-400/30'
                        : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-bl-xs shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Screen Bottom Bar */}
          <div className="mt-2 pt-1 border-t border-emerald-900/50 text-[10px] text-center text-emerald-400/80 font-mono tracking-widest uppercase">
            {loading ? '⚡ Transmitting RF Signal...' : 'Options • EcoPulse • Back'}
          </div>
        </div>

        {/* Input Controls (Both Keypad & Physical Keyboard Allowed) */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div 
              onClick={() => setActiveInput('phone')}
              className={`p-2 rounded-xl border transition ${
                activeInput === 'phone' 
                  ? 'bg-emerald-950/50 border-emerald-400 ring-1 ring-emerald-400' 
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mobile No.</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setActiveInput('phone')}
                placeholder="9153702574"
                className="w-full bg-transparent text-slate-100 font-mono text-xs outline-none"
              />
            </div>
            
            <div 
              onClick={() => setActiveInput('command')}
              className={`p-2 rounded-xl border transition ${
                activeInput === 'command' 
                  ? 'bg-emerald-950/50 border-emerald-400 ring-1 ring-emerald-400' 
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">SMS Command</label>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value.toUpperCase())}
                onFocus={() => setActiveInput('command')}
                placeholder="JOIN CITY CONDITION"
                className="w-full bg-transparent text-slate-100 font-mono text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Navigation & Function Keys */}
        <div className="mt-3 grid grid-cols-3 gap-2 items-center">
          <button
            onClick={handleSendSms}
            disabled={loading}
            className="py-2.5 px-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-emerald-950 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>

          {/* D-Pad Center Button */}
          <button
            onClick={handleSendSms}
            disabled={loading}
            title="Press OK to Send"
            className="h-10 bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition cursor-pointer hover:border-emerald-400"
          >
            <span className="text-[10px] font-extrabold text-emerald-400 font-mono">OK</span>
          </button>

          <button
            onClick={handleBackspace}
            title="Backspace / Delete"
            className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[11px] font-bold shadow active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
          >
            <Delete className="w-3.5 h-3.5 text-rose-400" /> Clear
          </button>
        </div>

        {/* Tactile Nokia Multi-Tap Keypad Grid */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2">
          {keyRows.map((row, rIdx) => (
            row.map((item, cIdx) => (
              <button
                key={`${rIdx}-${cIdx}`}
                onClick={() => handleKeyPress(item.key)}
                className="group flex flex-col items-center justify-center py-2 bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 hover:border-emerald-500/60 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.6)] active:scale-95 active:bg-emerald-950/40 transition cursor-pointer select-none"
              >
                <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 font-mono leading-none">
                  {item.key}
                </span>
                <span className="text-[8px] font-medium text-slate-500 group-hover:text-emerald-400/80 font-mono mt-0.5">
                  {item.sub}
                </span>
              </button>
            ))
          ))}
        </div>

        {/* Quick Morning Blast Simulator */}
        <div className="mt-3 pt-2">
          <button
            onClick={handleTriggerBlast}
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-950 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-200" />
            <span>Simulate 06:30 AM Daily Morning Blast</span>
          </button>
        </div>

      </div>

    </div>
  );
}