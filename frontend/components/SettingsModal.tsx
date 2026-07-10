"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Baby, Clock, CheckCircle } from '@phosphor-icons/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'her' | 'pregnancy';
  currentData: any; // The profile data
}

export default function SettingsModal({ isOpen, onClose, mode, currentData }: SettingsModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(currentData || {});
      const storedVoice = localStorage.getItem('sakhi_voice_enabled');
      setVoiceEnabled(storedVoice !== 'false');
    }
  }, [isOpen, currentData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save voice setting
    localStorage.setItem('sakhi_voice_enabled', voiceEnabled.toString());
    
    // Save profile data (we use a simple API route that sets a cookie for demo mode)
    try {
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, profile: formData })
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        window.location.reload(); // Quickest way to refresh all components and charts
      }, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white shadow-2xl z-50 rounded-[2.5rem] overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 flex items-center justify-between bg-pink-50/50">
              <h2 className="text-2xl font-semibold text-[#2D1B36]">Settings</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-[#2D1B36]/60">
                <X weight="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Voice Settings */}
              <div>
                <h3 className="text-lg font-medium text-[#2D1B36] flex items-center gap-2 mb-4">
                  <User weight="duotone" className="text-pink-500" /> Sakhi Voice
                </h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-black/5">
                  <div>
                    <p className="font-medium text-[#2D1B36]">Auto-Play Voice</p>
                    <p className="text-sm text-[#2D1B36]/60">Sakhi will read her replies aloud.</p>
                  </div>
                  <button 
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${voiceEnabled ? 'bg-pink-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${voiceEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Profile Data */}
              <div>
                <h3 className="text-lg font-medium text-[#2D1B36] flex items-center gap-2 mb-4">
                  {mode === 'pregnancy' ? <Baby weight="duotone" className="text-pink-500" /> : <Clock weight="duotone" className="text-pink-500" />} 
                  Health Profile
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D1B36]/80 mb-1">Preferred Name</label>
                    <input 
                      type="text" name="preferred_name"
                      value={formData.preferred_name || ''} 
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-pink-300 outline-none"
                    />
                  </div>

                  {mode === 'pregnancy' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#2D1B36]/80 mb-1">Weeks Pregnant</label>
                        <input 
                          type="number" name="weeks_pregnant"
                          value={formData.weeks_pregnant || ''} 
                          onChange={handleChange}
                          className="w-full p-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-pink-300 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2D1B36]/80 mb-1">Expected Due Date</label>
                        <input 
                          type="date" name="expected_due_date"
                          value={formData.expected_due_date ? new Date(formData.expected_due_date).toISOString().split('T')[0] : ''} 
                          onChange={handleChange}
                          className="w-full p-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-pink-300 outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#2D1B36]/80 mb-1">Average Cycle Length (Days)</label>
                        <input 
                          type="number" name="cycle_length_avg"
                          value={formData.cycle_length_avg || ''} 
                          onChange={handleChange}
                          className="w-full p-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-pink-300 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2D1B36]/80 mb-1">Period Duration (Days)</label>
                        <input 
                          type="number" name="period_duration"
                          value={formData.period_duration || ''} 
                          onChange={handleChange}
                          className="w-full p-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-pink-300 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-black/5 bg-gray-50 flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-3 rounded-xl font-medium text-[#2D1B36]/70 hover:bg-black/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving || showSuccess} className="px-6 py-3 rounded-xl font-medium text-white bg-pink-500 hover:bg-pink-600 transition-colors flex items-center gap-2">
                {showSuccess ? <><CheckCircle weight="bold" /> Saved!</> : (isSaving ? "Saving..." : "Save Changes")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
