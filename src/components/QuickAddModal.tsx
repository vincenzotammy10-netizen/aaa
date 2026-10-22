import React, { useState } from 'react';
import { 
  X, 
  Timer, 
  Bell, 
  FileText, 
  Zap, 
  Clock, 
  Check, 
  Plus,
  Sparkles,
  Calendar,
  Tag
} from 'lucide-react';
import { ReminderItem, TacticalNote, QuickProtocolItem } from '../types/chaite';
import { soundEffects } from '../utils/soundEffects';

interface QuickAddModalProps {
  isOpen: boolean;
  initialTab?: 'timer' | 'reminder' | 'note' | 'protocol';
  onClose: () => void;
  onAddReminder: (item: Omit<ReminderItem, 'id' | 'createdAt' | 'completed'>) => void;
  onAddNote: (note: Omit<TacticalNote, 'id' | 'createdAt'>) => void;
  onAddProtocol: (protocol: Omit<QuickProtocolItem, 'id'>) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  initialTab = 'timer',
  onClose,
  onAddReminder,
  onAddNote,
  onAddProtocol,
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'reminder' | 'note' | 'protocol'>(initialTab);

  // Timer form state
  const [timerTitle, setTimerTitle] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Reminder form state
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'general' | 'work' | 'personal' | 'tactical'>('general');

  // Protocol shortcut form state
  const [protocolLabel, setProtocolLabel] = useState('');
  const [protocolQuery, setProtocolQuery] = useState('');

  if (!isOpen) return null;

  const handleTabChange = (tab: 'timer' | 'reminder' | 'note' | 'protocol') => {
    setActiveTab(tab);
    soundEffects.playBlip();
  };

  const handleCreateTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeconds = (Number(timerMinutes) || 0) * 60 + (Number(timerSeconds) || 0);
    if (totalSeconds <= 0) return;

    soundEffects.playAcknowledge();
    onAddReminder({
      title: timerTitle.trim() || `${timerMinutes} मिनेटको टाइमर`,
      isTimer: true,
      durationSeconds: totalSeconds,
      remainingSeconds: totalSeconds,
    });
    setTimerTitle('');
    onClose();
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;

    soundEffects.playAcknowledge();
    let dueIso = reminderDateTime;
    if (!dueIso) {
      dueIso = new Date(Date.now() + 3600000).toISOString(); // Default 1 hour later
    }

    onAddReminder({
      title: reminderTitle.trim(),
      isTimer: false,
      dueTime: dueIso,
    });
    setReminderTitle('');
    setReminderDateTime('');
    onClose();
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() && !noteTitle.trim()) return;

    soundEffects.playAcknowledge();
    onAddNote({
      title: noteTitle.trim() || noteContent.trim().slice(0, 24),
      content: noteContent.trim(),
      category: noteCategory,
    });
    setNoteTitle('');
    setNoteContent('');
    onClose();
  };

  const handleCreateProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolLabel.trim() || !protocolQuery.trim()) return;

    soundEffects.playAcknowledge();
    onAddProtocol({
      label: protocolLabel.trim(),
      query: protocolQuery.trim(),
      isCustom: true,
    });
    setProtocolLabel('');
    setProtocolQuery('');
    onClose();
  };

  const setPresetTimer = (mins: number, label: string) => {
    setTimerMinutes(mins);
    setTimerSeconds(0);
    setTimerTitle(label);
    soundEffects.playBlip();
  };

  const setPresetReminderOffset = (offsetMinutes: number, label: string) => {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    // Format YYYY-MM-DDTHH:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setReminderDateTime(localIso);
    if (!reminderTitle) {
      setReminderTitle(label);
    }
    soundEffects.playBlip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md hud-glass border-2 border-cyan-400/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.35)] flex flex-col font-sans">
        
        {/* Holographic Header Bar */}
        <div className="px-4 py-3 border-b border-cyan-500/30 flex items-center justify-between bg-cyan-950/40">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <Plus className="w-4 h-4 text-cyan-300" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-cyan-200 font-bold">
              QUICK ADD / नयाँ थप्नुहोस्
            </h2>
          </div>
          <button
            onClick={() => {
              soundEffects.playBlip();
              onClose();
            }}
            className="p-1 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all"
            title="बन्द गर्नुहोस् (Close)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tactical Tab Selectors */}
        <div className="grid grid-cols-4 border-b border-cyan-500/20 bg-black/40 font-mono text-[11px]">
          <button
            onClick={() => handleTabChange('timer')}
            className={`py-2.5 flex flex-col items-center gap-1 transition-all ${
              activeTab === 'timer'
                ? 'bg-cyan-500/25 text-cyan-200 border-b-2 border-cyan-400 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>टाइमर</span>
          </button>

          <button
            onClick={() => handleTabChange('reminder')}
            className={`py-2.5 flex flex-col items-center gap-1 transition-all ${
              activeTab === 'reminder'
                ? 'bg-cyan-500/25 text-cyan-200 border-b-2 border-cyan-400 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>सम्झना</span>
          </button>

          <button
            onClick={() => handleTabChange('note')}
            className={`py-2.5 flex flex-col items-center gap-1 transition-all ${
              activeTab === 'note'
                ? 'bg-cyan-500/25 text-cyan-200 border-b-2 border-cyan-400 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>नोट/टिपोट</span>
          </button>

          <button
            onClick={() => handleTabChange('protocol')}
            className={`py-2.5 flex flex-col items-center gap-1 transition-all ${
              activeTab === 'protocol'
                ? 'bg-cyan-500/25 text-cyan-200 border-b-2 border-cyan-400 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>आदेश सर्टकट</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 max-h-[70vh] overflow-y-auto no-scrollbar">

          {/* 1. TIMER FORM */}
          {activeTab === 'timer' && (
            <form onSubmit={handleCreateTimer} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  टाइमरको नाम (Label / Activity):
                </label>
                <input
                  type="text"
                  value={timerTitle}
                  onChange={(e) => setTimerTitle(e.target.value)}
                  placeholder="उदा. चिया पकाउने, ध्यान (Meditation), पढाइ..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 placeholder-cyan-500/40 text-xs focus:outline-none focus:border-cyan-300"
                />
              </div>

              {/* Quick Preset Chips */}
              <div>
                <span className="block text-[10px] font-mono text-cyan-500 mb-1.5 uppercase tracking-wider">
                  द्रुत छनोट (Quick Presets):
                </span>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                  {[
                    { m: 1, label: '१ मिनेट' },
                    { m: 3, label: '३ मिनेट' },
                    { m: 5, label: '५ मिनेट' },
                    { m: 10, label: '१० मिनेट' },
                    { m: 15, label: '१५ मिनेट' },
                    { m: 25, label: 'पोमोडोरो (25m)' },
                    { m: 30, label: '३० मिनेट' },
                    { m: 60, label: '१ घण्टा (60m)' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPresetTimer(preset.m, preset.label)}
                      className="px-2 py-1.5 rounded-lg bg-black/40 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20 text-center transition-all active:scale-95 text-[10px]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Duration Inputs */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div>
                  <label className="block text-[10px] text-cyan-400 mb-1">मिनेट (Minutes):</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 text-center text-sm font-bold focus:outline-none focus:border-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-cyan-400 mb-1">सेकेन्ड (Seconds):</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 text-center text-sm font-bold focus:outline-none focus:border-cyan-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Timer className="w-4 h-4" />
                <span>टाइमर सुरु गर्नुहोस् (Engage Timer)</span>
              </button>
            </form>
          )}

          {/* 2. REMINDER FORM */}
          {activeTab === 'reminder' && (
            <form onSubmit={handleCreateReminder} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  सम्झनाको विवरण (Reminder Title / Task): *
                </label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="उदा. डाक्टर भेट्ने, औषधि खाने, प्रोजेक्ट बुझाउने..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 placeholder-cyan-500/40 text-xs focus:outline-none focus:border-cyan-300"
                />
              </div>

              {/* Quick time offset presets */}
              <div>
                <span className="block text-[10px] font-mono text-cyan-500 mb-1.5 uppercase tracking-wider">
                  द्रुत समय छनोट (Quick Schedule):
                </span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                  {[
                    { m: 15, label: '+१५ मिनेट' },
                    { m: 30, label: '+३० मिनेट' },
                    { m: 60, label: '+१ घण्टा' },
                    { m: 180, label: '+३ घण्टा' },
                    { m: 720, label: '+१२ घण्टा' },
                    { m: 1440, label: '+भोलि यो समय' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPresetReminderOffset(p.m, `${reminderTitle || 'कार्य'} (${p.label})`)}
                      className="px-2 py-1.5 rounded-lg bg-black/40 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 text-center transition-all text-[10px]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Time */}
              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  निश्चित मिति र समय (Specific Date & Time):
                </label>
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 text-xs font-mono focus:outline-none focus:border-cyan-300"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Bell className="w-4 h-4" />
                <span>सम्झना दर्ता गर्नुहोस् (Schedule Reminder)</span>
              </button>
            </form>
          )}

          {/* 3. TACTICAL NOTE FORM */}
          {activeTab === 'note' && (
            <form onSubmit={handleCreateNote} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  नोटको शीर्षक (Note Heading):
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="उदा. बैठकको मुख्य बुँदा, नयाँ विचार..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 placeholder-cyan-500/40 text-xs focus:outline-none focus:border-cyan-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  टिपोट विवरण (Content): *
                </label>
                <textarea
                  required
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="यहाँ जे पनि लेख्न सक्नुहुन्छ, चैतेले सुरक्षित राख्नेछ र पछि पढेर सुनाउनेछ..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 placeholder-cyan-500/40 text-xs focus:outline-none focus:border-cyan-300 resize-none"
                />
              </div>

              {/* Category selector */}
              <div>
                <span className="block text-[10px] font-mono text-cyan-500 mb-1 uppercase tracking-wider">
                  वर्ग (Category):
                </span>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                  {[
                    { id: 'general', label: 'सामान्य (General)' },
                    { id: 'work', label: 'काम (Work)' },
                    { id: 'personal', label: 'व्यक्तिगत (Personal)' },
                    { id: 'tactical', label: 'गोप्य (Tactical)' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setNoteCategory(cat.id as any);
                        soundEffects.playBlip();
                      }}
                      className={`px-1.5 py-1.5 rounded-lg border text-center transition-all ${
                        noteCategory === cat.id
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-black/40 border-cyan-500/30 text-cyan-400/70 hover:border-cyan-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-98 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>नोट सुरक्षित गर्नुहोस् (Commit Note)</span>
              </button>
            </form>
          )}

          {/* 4. CUSTOM PROTOCOL / SHORTCUT FORM */}
          {activeTab === 'protocol' && (
            <form onSubmit={handleCreateProtocol} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  बटनको नाम (Button Label): *
                </label>
                <input
                  type="text"
                  required
                  value={protocolLabel}
                  onChange={(e) => setProtocolLabel(e.target.value)}
                  placeholder="उदा. 🌦️ मौसम, 🔦 बत्ती बाल, 💧 पानी टाइमर..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 placeholder-cyan-500/40 text-xs focus:outline-none focus:border-cyan-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  चैतेलाई दिइने आदेश (Voice / Text Command): *
                </label>
                <input
                  type="text"
                  required
                  value={protocolQuery}
                  onChange={(e) => setProtocolQuery(e.target.value)}
                  placeholder="उदा. काठमाडौँको अहिलेको मौसम कस्तो छ?, बत्ती बाल, १० मिनेटको टाइमर..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 placeholder-cyan-500/40 text-xs focus:outline-none focus:border-cyan-300"
                />
                <span className="block text-[10px] text-cyan-400/60 mt-1 font-mono">
                  यो बटन मुख्य स्क्रिनको "QUICK PROTOCOLS" बारमा तुरुन्त देखिनेछ।
                </span>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-1 font-mono text-[10px] text-cyan-400/70 bg-black/30 p-2 rounded-lg border border-cyan-500/20">
                <span className="font-bold text-cyan-300">आइडियाहरू (Quick Ideas):</span>
                <span>• "नेपाली रुपैयाँ र डलरको विनिमय दर कति छ?"</span>
                <span>• "भोलिको महत्त्वपूर्ण समाचार के छ?"</span>
                <span>• "१० मिनेटको टाइमर लगाउ"</span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>सर्टकट थप्नुहोस् (Register Shortcut)</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
