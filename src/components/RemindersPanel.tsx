import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Timer, 
  Sparkles,
  Volume2,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { ReminderItem, TacticalNote } from '../types/chaite';
import { soundEffects } from '../utils/soundEffects';

interface RemindersPanelProps {
  reminders: ReminderItem[];
  notes?: TacticalNote[];
  onAddReminder: (item: Omit<ReminderItem, 'id' | 'createdAt' | 'completed'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onDismissAlarm: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  onSpeakNote?: (text: string) => void;
  onOpenQuickAdd?: (tab?: 'timer' | 'reminder' | 'note' | 'protocol') => void;
}

export const RemindersPanel: React.FC<RemindersPanelProps> = ({
  reminders,
  notes = [],
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
  onDismissAlarm,
  onDeleteNote,
  onSpeakNote,
  onOpenQuickAdd,
}) => {
  const [subTab, setSubTab] = useState<'reminders' | 'notes'>('reminders');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [reminderTime, setReminderTime] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleQuickPreset = (title: string, durationMinutes: number) => {
    soundEffects.playAcknowledge();
    onAddReminder({
      title,
      isTimer: true,
      durationSeconds: durationMinutes * 60,
      remainingSeconds: durationMinutes * 60,
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundEffects.playAcknowledge();
    if (isTimerMode) {
      onAddReminder({
        title: newTitle.trim(),
        isTimer: true,
        durationSeconds: timerMinutes * 60,
        remainingSeconds: timerMinutes * 60,
      });
    } else {
      onAddReminder({
        title: newTitle.trim(),
        isTimer: false,
        dueTime: reminderTime || new Date(Date.now() + 3600000).toISOString(),
      });
    }

    setNewTitle('');
    setShowAddForm(false);
  };

  const formatRemaining = (seconds?: number) => {
    if (seconds === undefined) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDue = (isoTime?: string) => {
    if (!isoTime) return 'Scheduled';
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoTime;
    }
  };

  const copyNoteContent = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    soundEffects.playAcknowledge();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-3 font-mono text-xs">
      {/* Top Header with Title and Quick Add Button */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          {subTab === 'reminders' ? (
            <Bell className="w-4 h-4 text-cyan-400" />
          ) : (
            <FileText className="w-4 h-4 text-cyan-400" />
          )}
          <span className="font-bold text-cyan-200 uppercase tracking-wider text-sm">
            {subTab === 'reminders' ? 'ALERTS & TIMERS' : 'TACTICAL NOTES'}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
            {subTab === 'reminders' ? reminders.filter(r => !r.completed).length : notes.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenQuickAdd && (
            <button
              onClick={() => onOpenQuickAdd(subTab === 'reminders' ? 'timer' : 'note')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 transition-all flex items-center gap-1 text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ थप्नुहोस् (Add)</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-cyan-500/20 text-[11px]">
        <button
          onClick={() => {
            setSubTab('reminders');
            soundEffects.playBlip();
          }}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'reminders'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 font-bold'
              : 'text-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>सम्झना र टाइमर ({reminders.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('notes');
            soundEffects.playBlip();
          }}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'notes'
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 font-bold'
              : 'text-cyan-400/60 hover:text-cyan-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>द्रुत नोटहरू ({notes.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: REMINDERS & TIMERS */}
      {subTab === 'reminders' && (
        <div className="flex flex-col gap-3">
          {/* Quick Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
            <span className="text-cyan-500 shrink-0 font-bold">PRESETS:</span>
            <button
              onClick={() => handleQuickPreset('५ मिनेटको ध्यान (5m Meditation)', 5)}
              className="px-2 py-1 rounded bg-black/40 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 shrink-0"
            >
              ⏱️ 5m Timer
            </button>
            <button
              onClick={() => handleQuickPreset('चिया / कफी ब्रेक (Tea Break)', 15)}
              className="px-2 py-1 rounded bg-black/40 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 shrink-0"
            >
              ☕ 15m Tea Break
            </button>
            <button
              onClick={() => handleQuickPreset('पानी पिउने समय (Drink Water)', 45)}
              className="px-2 py-1 rounded bg-black/40 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 shrink-0"
            >
              💧 45m Water
            </button>
          </div>

          {/* Reminders List */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {reminders.length === 0 ? (
              <div className="p-4 rounded-xl hud-glass text-center text-cyan-400/60 flex flex-col items-center justify-center">
                <Clock className="w-6 h-6 mb-1 opacity-50" />
                <p className="text-xs">कुनै सक्रिय सम्झना छैन (No active tasks)</p>
                <p className="text-[10px] text-cyan-500 mt-0.5">
                  माथिको "+ थप्नुहोस्" थिच्नुहोस् वा भन्नुहोस्: "चैते, ५ मिनेटको टाइमर राख"
                </p>
              </div>
            ) : (
              reminders.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    item.triggered && !item.completed
                      ? 'bg-rose-950/60 border-rose-500 text-rose-200 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : item.completed
                      ? 'bg-black/20 border-cyan-900/40 text-cyan-600 line-through'
                      : 'hud-glass border-cyan-500/30 text-cyan-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        onToggleComplete(item.id);
                        soundEffects.playAcknowledge();
                      }}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        item.completed
                          ? 'border-cyan-600 bg-cyan-900/40 text-cyan-400'
                          : 'border-cyan-400/60 hover:border-cyan-300'
                      }`}
                    >
                      {item.completed && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>

                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-semibold truncate ${item.completed ? 'line-through text-cyan-600' : 'text-cyan-100'}`}>
                        {item.title}
                      </span>
                      
                      <div className="flex items-center gap-2 text-[10px] text-cyan-400/70">
                        {item.isTimer ? (
                          <span className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
                            <Timer className="w-3 h-3 text-cyan-400" />
                            {item.completed ? 'COMPLETED' : formatRemaining(item.remainingSeconds)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {formatDue(item.dueTime)}
                          </span>
                        )}
                        {item.triggered && !item.completed && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold animate-ping text-[9px]">
                            ALARM
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-2">
                    {item.triggered && !item.completed && (
                      <button
                        onClick={() => onDismissAlarm(item.id)}
                        className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500"
                      >
                        बन्द (Dismiss)
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDeleteReminder(item.id);
                        soundEffects.playBlip();
                      }}
                      className="p-1 rounded text-cyan-500/60 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                      aria-label="Delete reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: TACTICAL NOTES */}
      {subTab === 'notes' && (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="p-4 rounded-xl hud-glass text-center text-cyan-400/60 flex flex-col items-center justify-center">
              <FileText className="w-6 h-6 mb-1 opacity-50" />
              <p className="text-xs">कुनै नोट सुरक्षित गरिएको छैन (No notes saved)</p>
              <p className="text-[10px] text-cyan-500 mt-1">
                बोल्नुहोस्: "चैते, नोट गर: आजको मिटिङ साँझ ६ बजे छ" वा माथि "+ थप्नुहोस्" थिच्नुहोस्।
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl hud-glass border-cyan-500/30 flex flex-col gap-1.5 hover:border-cyan-400/60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-200">
                      {note.title}
                    </span>
                    {note.category && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-[9px] uppercase font-mono text-cyan-300">
                        {note.category}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-cyan-500/60">
                    {new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-cyan-100 font-sans whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-cyan-500/10 mt-1">
                  {onSpeakNote && (
                    <button
                      onClick={() => onSpeakNote(note.content)}
                      className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 flex items-center gap-1 text-[10px]"
                      title="चैतेलाई पढेर सुनाउन लगाउनुहोस्"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>सुन्नुहोस् (Listen)</span>
                    </button>
                  )}

                  <button
                    onClick={() => copyNoteContent(note.id, note.content)}
                    className="p-1 rounded text-cyan-400 hover:bg-cyan-500/20"
                    title="कपी गर्नुहोस्"
                  >
                    {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {onDeleteNote && (
                    <button
                      onClick={() => {
                        onDeleteNote(note.id);
                        soundEffects.playBlip();
                      }}
                      className="p-1 rounded text-cyan-500/60 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                      title="मेटाउनुहोस्"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
