import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, BellRing, Settings2 } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsModal = ({ isOpen, onClose, settings, onSave }: SettingsModalProps) => {
  const [formData, setFormData] = useState<UserSettings>(settings);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    if (Notification.permission === 'granted') {
      setFormData(prev => ({ ...prev, pushEnabled: true }));
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setFormData(prev => ({ ...prev, pushEnabled: true }));
        new Notification('Reminders Enabled', { body: 'You will receive reading reminders here.' });
      } else {
        setFormData(prev => ({ ...prev, pushEnabled: false }));
      }
    } else {
      alert('Notifications are blocked in this browser. Please enable them in your browser settings.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-braun-bg/90 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative w-full max-w-md bg-[#F0F0F0] border-2 border-braun-panel shadow-2xl overflow-hidden flex flex-col max-h-[90vh] dark:bg-braun-bg"
        >
          <div className="border-b-2 border-braun-panel bg-braun-panel/5 p-4 flex justify-between items-center">
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-braun-accent" />
              Preferences
            </h2>
            <button 
              onClick={onClose}
              className="text-braun-ink/50 hover:text-braun-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-braun-ink/50 border-b border-braun-ink/10 pb-2">Reading Reminders</h3>
              
              <label className="flex items-center justify-between p-4 bg-white/50 dark:bg-transparent dark:border dark:border-braun-panel hover:bg-white transiton-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${formData.readingReminders ? 'bg-braun-accent/10 text-braun-accent' : 'bg-braun-ink/5 text-braun-ink/50'}`}>
                    {formData.readingReminders ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="block text-sm font-bold">Enable Reminders</span>
                    <span className="block text-[10px] font-mono text-braun-ink/50 opacity-80 mt-1">Get prompted to maintain your habit</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.readingReminders}
                  onChange={(e) => setFormData({ ...formData, readingReminders: e.target.checked })}
                  className="w-4 h-4 accent-braun-accent"
                />
              </label>

              {formData.readingReminders && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pl-4 space-y-4 border-l-2 border-braun-accent/20 ml-2"
                >
                  <div className="space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-widest">Frequency</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          value="daily"
                          checked={formData.reminderFrequency === 'daily'}
                          onChange={() => setFormData({ ...formData, reminderFrequency: 'daily' })}
                          className="accent-braun-accent"
                        />
                        Daily
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          value="weekly"
                          checked={formData.reminderFrequency === 'weekly'}
                          onChange={() => setFormData({ ...formData, reminderFrequency: 'weekly' })}
                          className="accent-braun-accent"
                        />
                        Weekly
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={requestPushPermission}
                      className={`text-xs font-mono tracking-wider py-2 px-4 border ${formData.pushEnabled ? 'border-braun-accent text-braun-accent bg-braun-accent/5' : 'border-braun-ink/20 text-braun-ink/70 hover:bg-braun-ink/5'}`}
                    >
                      {formData.pushEnabled ? 'Push Notifications Enabled' : 'Enable Push Notifications'}
                    </button>
                    {formData.pushEnabled && (
                      <p className="text-[9px] font-mono text-braun-ink/40 mt-2">
                        You'll receive desktop/mobile push reminders.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="w-full bg-braun-accent text-white font-bold py-4 uppercase tracking-[0.2em] text-xs hover:brightness-110 transition-all orange-glow"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
