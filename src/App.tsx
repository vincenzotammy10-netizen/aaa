/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Zap, 
  Sliders, 
  Bell, 
  Compass, 
  Sparkles, 
  Shield, 
  Smartphone, 
  RotateCcw,
  X,
  Radio,
  Clock,
  Terminal,
  Activity,
  Maximize2,
  Plus,
  FileText
} from 'lucide-react';
import { 
  ChatMessage, 
  ReminderItem, 
  DeviceTelemetryState, 
  VoiceConfig, 
  TaskDetails,
  TacticalNote,
  QuickProtocolItem
} from './types/chaite';
import { soundEffects } from './utils/soundEffects';
import { ChaiteSpeechEngine } from './utils/speechEngine';
import { ArcReactorCore } from './components/ArcReactorCore';
import { DeviceControlPanel } from './components/DeviceControlPanel';
import { RemindersPanel } from './components/RemindersPanel';
import { ChatTranscriptPanel } from './components/ChatTranscriptPanel';
import { SettingsModal } from './components/SettingsModal';
import { QuickAddModal } from './components/QuickAddModal';

export default function App() {
  // Navigation / View state
  const [activeTab, setActiveTab] = useState<'core' | 'controls' | 'reminders' | 'log'>('core');
  
  // Voice & Speech engine state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  // Settings
  const [config, setConfig] = useState<VoiceConfig>(() => {
    const saved = localStorage.getItem('chaite_config');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      engine: 'webspeech',
      femalePitch: 1.18,
      speakingRate: 0.96,
      language: 'ne-NP',
      soundEffectsEnabled: true,
      autoSpeak: true,
      hapticFeedbackEnabled: true,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Chat conversation messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chaite_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'init-msg',
        sender: 'chaite',
        text: 'नमस्ते हजुर! म चैते (Chaite), हजुरको व्यक्तिगत JARVIS सहायक। मलाई आदेश दिनुहोस्—मौसम वा जानकारी खोज्न, सम्झना/टाइमर राख्न, वा फोनका सुविधाहरू नियन्त्रण गर्न म सधैं तयार छु।',
        displayText: 'नमस्ते हजुर! म चैते (Chaite), हजुरको व्यक्तिगत JARVIS सहायक।\n• कुनै पनि प्रश्न सोध्नुहोस् वा वेबमा खोज्न भन्नुहोस्\n• सम्झना (Reminders) र टाइमर सेट गर्नुहोस्\n• फोनको टर्च, भाइब्रेसन र सेन्सर नियन्त्रण गर्नुहोस्',
        spokenText: 'नमस्ते हजुर! म चैते, हजुरको व्यक्तिगत सहायक। के मद्दत गरौं?',
        timestamp: new Date().toISOString(),
        language: 'ne',
        hudMetrics: { status: 'ONLINE', tacticalAdvice: 'Core Telemetry Nominal' },
      },
    ];
  });

  // Reminders & Timers state
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem('chaite_reminders');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'r-1',
        title: 'पानी पिउनुहोस् (Hydration Reminder)',
        isTimer: false,
        dueTime: new Date(Date.now() + 1800000).toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Tactical Notes & Memos state
  const [notes, setNotes] = useState<TacticalNote[]>(() => {
    const saved = localStorage.getItem('chaite_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'n-1',
        title: 'चैते सहायक प्रारम्भिक जानकारी',
        content: 'चैते एक व्यक्तिगत JARVIS-शैलीको नेपाली AI सहायक हो। यसले रिमाइन्डर, टाइमर, नोट, वेब खोज तथा फोनका सुविधाहरू नियन्त्रण गर्दछ।',
        createdAt: new Date().toISOString(),
        category: 'tactical',
      },
    ];
  });

  // Quick Protocols / Command Shortcuts
  const [protocols, setProtocols] = useState<QuickProtocolItem[]>(() => {
    const saved = localStorage.getItem('chaite_protocols');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'p-1', label: '⛅ काठमाडौंको मौसम', query: 'आज काठमाडौंको मौसम कस्तो छ?' },
      { id: 'p-2', label: '⏱️ ५ मिनेट टाइमर', query: 'चैते, ५ मिनेटको टाइमर लगाउ' },
      { id: 'p-3', label: '🔦 बत्ती बाल (Torch)', query: 'चैते, टर्च बालिदेउ' },
      { id: 'p-4', label: '🔋 ब्याट्री चेक', query: 'चैते, मेरो ब्याट्री स्थिति कस्तो छ?' },
      { id: 'p-5', label: '💰 सुनको भाउ', query: 'नेपालमा आज सुनको भाउ कति छ?' },
      { id: 'p-6', label: '🇳🇵 नेपालीमा कुरा गरौं', query: 'चैते, तिम्रो बारेमा बताउ र के के गर्न सक्छौ?' },
    ];
  });

  // Quick Add Modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<'timer' | 'reminder' | 'note' | 'protocol'>('timer');

  useEffect(() => {
    localStorage.setItem('chaite_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('chaite_protocols', JSON.stringify(protocols));
  }, [protocols]);

  // Device Telemetry state
  const [telemetry, setTelemetry] = useState<DeviceTelemetryState>({
    batteryLevel: null,
    isCharging: null,
    compassHeading: null,
    pitch: null,
    roll: null,
    networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    flashlightActive: false,
    brightnessLevel: 100,
    cameraActive: false,
    isFullscreen: false,
  });

  // Screen flashlight overlay (ultra-bright white blast)
  const [screenTorchActive, setScreenTorchActive] = useState(false);
  const [hardwareTorchTrack, setHardwareTorchTrack] = useState<MediaStreamTrack | null>(null);

  // Active alarm modal when reminder/timer completes
  const [ringingAlarm, setRingingAlarm] = useState<ReminderItem | null>(null);

  // Initialize Speech Engine reference
  const speechEngine = useRef<ChaiteSpeechEngine | null>(null);

  useEffect(() => {
    speechEngine.current = new ChaiteSpeechEngine({
      onListeningStateChange: (listening) => {
        setIsListening(listening);
        if (listening) {
          soundEffects.playActivate();
          soundEffects.triggerHaptic([30, 20]);
        }
      },
      onSpeakingStateChange: (speaking) => {
        setIsSpeaking(speaking);
      },
      onTranscriptChange: (text, isFinal) => {
        setInterimTranscript(text);
        if (isFinal && text.trim().length > 1) {
          handleSendMessage(text.trim());
          setInterimTranscript('');
        }
      },
      onAudioFrequency: (freq) => {
        setFrequencyData(freq);
      },
      onError: (err) => {
        console.warn('Speech engine warning:', err);
      },
    });

    // Sync settings to speech engine
    speechEngine.current.femalePitch = config.femalePitch;
    speechEngine.current.speakingRate = config.speakingRate;
    speechEngine.current.setLanguage(config.language);

    return () => {
      speechEngine.current?.stopListening();
      speechEngine.current?.stopSpeaking();
    };
  }, []);

  // Update speech engine whenever config updates
  useEffect(() => {
    if (speechEngine.current) {
      speechEngine.current.femalePitch = config.femalePitch;
      speechEngine.current.speakingRate = config.speakingRate;
      speechEngine.current.setLanguage(config.language);
    }
    localStorage.setItem('chaite_config', JSON.stringify(config));
  }, [config]);

  // Save reminders & messages to localStorage
  useEffect(() => {
    localStorage.setItem('chaite_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('chaite_messages', JSON.stringify(messages.slice(-30)));
  }, [messages]);

  // Setup real-time device sensor listeners (Battery, Gyroscope, Online status)
  useEffect(() => {
    // 1. Battery status
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setTelemetry((prev) => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging,
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    // 2. Gyroscope orientation
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setTelemetry((prev) => ({
          ...prev,
          compassHeading: e.alpha,
          pitch: e.beta,
          roll: e.gamma,
        }));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);

    // 3. Online/Offline
    const handleOnline = () => setTelemetry((prev) => ({ ...prev, networkOnline: true }));
    const handleOffline = () => setTelemetry((prev) => ({ ...prev, networkOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 4. Fullscreen change
    const handleFullscreen = () => {
      setTelemetry((prev) => ({ ...prev, isFullscreen: Boolean(document.fullscreenElement) }));
    };
    document.addEventListener('fullscreenchange', handleFullscreen);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, []);

  // Timer countdown ticker: Decrements active timers every second
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setReminders((prevReminders) => {
        let changed = false;
        const now = new Date();

        const updated = prevReminders.map((item) => {
          // Check countdown timer
          if (item.isTimer && !item.completed && item.remainingSeconds !== undefined) {
            if (item.remainingSeconds > 1) {
              changed = true;
              return { ...item, remainingSeconds: item.remainingSeconds - 1 };
            } else if (item.remainingSeconds === 1 && !item.triggered) {
              changed = true;
              triggerAlarm(item);
              return { ...item, remainingSeconds: 0, triggered: true };
            }
          }

          // Check scheduled reminder by time
          if (!item.isTimer && !item.completed && item.dueTime && !item.triggered) {
            const due = new Date(item.dueTime);
            if (now >= due) {
              changed = true;
              triggerAlarm(item);
              return { ...item, triggered: true };
            }
          }

          return item;
        });

        return changed ? updated : prevReminders;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Alarm trigger logic
  const triggerAlarm = (item: ReminderItem) => {
    soundEffects.playReminderAlarm();
    soundEffects.triggerHaptic([200, 100, 200, 100, 400]);
    setRingingAlarm(item);

    // Chaite announces the alert in her female voice
    const alertSpeech = `हजुर, सम्झनाको समय भयो: ${item.title}`;
    speakText(alertSpeech, 'ne');
  };

  // Toggle listening mic
  const toggleListening = async () => {
    if (isListening) {
      speechEngine.current?.stopListening();
    } else {
      if (isSpeaking) {
        speechEngine.current?.stopSpeaking();
      }
      const ok = await speechEngine.current?.startListening();
      if (!ok) {
        soundEffects.playActivate();
      }
    }
  };

  // Core chat reasoning call to server
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    soundEffects.playAcknowledge();
    soundEffects.triggerHaptic([40, 20]);
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setInterimTranscript('');

    try {
      const response = await fetch('/api/chaite/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          history: messages.slice(-6),
          language: config.language,
          deviceTelemetry: {
            battery: telemetry.batteryLevel,
            online: telemetry.networkOnline,
            orientation: telemetry.compassHeading,
            brightness: telemetry.brightnessLevel,
            screenTorchActive,
          },
        }),
      });

      const json = await response.json();
      if (!json.success && !json.data) {
        throw new Error(json.error || 'Server processing error');
      }

      const chaiteData = json.data;

      const chaiteMsg: ChatMessage = {
        id: `c-${Date.now()}`,
        sender: 'chaite',
        text: chaiteData.displayText || chaiteData.spokenText,
        displayText: chaiteData.displayText,
        spokenText: chaiteData.spokenText,
        timestamp: new Date().toISOString(),
        language: chaiteData.language || 'ne',
        task: chaiteData.task,
        hudMetrics: chaiteData.hudMetrics,
        webSources: chaiteData.webSources,
      };

      setMessages((prev) => [...prev, chaiteMsg]);

      // Execute task if returned
      if (chaiteData.task && chaiteData.task.action !== 'none') {
        executeDeviceTask(chaiteData.task);
      }

      // Speak aloud in female voice
      if (config.autoSpeak && chaiteData.spokenText) {
        await speakText(chaiteData.spokenText, chaiteData.language);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'chaite',
        text: 'हजुर, प्रणालीमा सामान्य प्राविधिक समस्या आयो। कृपया पुन: प्रयास गर्नुहोस्। (Neural latency detected. Reconnecting...)',
        spokenText: 'हजुर, कृपया पुन: प्रयास गर्नुहोस्।',
        timestamp: new Date().toISOString(),
        language: 'ne',
        hudMetrics: { status: 'ALERT', tacticalAdvice: 'Core Standby' },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakText('हजुर, कृपया पुन: प्रयास गर्नुहोस्।', 'ne');
    } finally {
      setIsProcessing(false);
    }
  };

  // Speak text helper (Gemini TTS or Web Speech fallback)
  const speakText = async (text: string, language: 'ne' | 'en' | 'auto' = 'auto') => {
    if (config.engine === 'gemini-tts') {
      try {
        const res = await fetch('/api/chaite/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'Kore' }),
        });
        const data = await res.json();
        if (data.success && data.audioData) {
          await speechEngine.current?.playAudioData(data.audioData, data.mimeType || 'audio/wav');
          return;
        }
      } catch {
        // Fallback to Web Speech below
      }
    }

    // Default Web Speech API synthesis with tuned female pitch & rate
    await speechEngine.current?.speakWithWebSpeech(text, language);
  };

  // Execute recognized task
  const executeDeviceTask = (task: TaskDetails) => {
    soundEffects.playAcknowledge();
    soundEffects.triggerHaptic([60, 40, 60]);

    switch (task.action) {
      case 'reminder': {
        const title = task.params?.title || 'Voice Scheduled Task';
        const targetTime = task.params?.targetTime || new Date(Date.now() + 3600000).toISOString();
        setReminders((prev) => [
          ...prev,
          {
            id: `rem-${Date.now()}`,
            title,
            dueTime: targetTime,
            isTimer: false,
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setActiveTab('reminders');
        break;
      }
      case 'timer': {
        const seconds = task.params?.durationSeconds || 300;
        const title = task.params?.title || `${Math.round(seconds / 60)} मिनेटको टाइमर`;
        setReminders((prev) => [
          ...prev,
          {
            id: `tim-${Date.now()}`,
            title,
            isTimer: true,
            durationSeconds: seconds,
            remainingSeconds: seconds,
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setActiveTab('reminders');
        break;
      }
      case 'note': {
        const content = task.params?.content || task.params?.title || 'Voice Note';
        const title = task.params?.title || content.slice(0, 24);
        setNotes((prev) => [
          {
            id: `note-${Date.now()}`,
            title,
            content,
            createdAt: new Date().toISOString(),
            category: 'tactical',
          },
          ...prev,
        ]);
        setActiveTab('reminders');
        break;
      }
      case 'quick_add': {
        const tab = task.params?.tab || 'timer';
        setQuickAddTab(tab);
        setIsQuickAddOpen(true);
        break;
      }
      case 'flashlight_on':
        toggleScreenTorch(true);
        break;
      case 'flashlight_off':
        toggleScreenTorch(false);
        break;
      case 'vibrate':
        soundEffects.triggerHaptic([100, 50, 100, 50, 200]);
        break;
      case 'battery_check':
        setActiveTab('controls');
        break;
      case 'camera_scan':
        setTelemetry((prev) => ({ ...prev, cameraActive: true }));
        setActiveTab('controls');
        break;
      case 'fullscreen':
        toggleFullscreen();
        break;
      case 'compass':
        setActiveTab('controls');
        break;
      case 'brightness':
        if (task.params?.level !== undefined) {
          setTelemetry((prev) => ({ ...prev, brightnessLevel: task.params!.level! }));
        }
        break;
      default:
        break;
    }
  };

  // Toggle screen flashlight
  const toggleScreenTorch = (forceState?: boolean) => {
    const newState = forceState !== undefined ? forceState : !screenTorchActive;
    setScreenTorchActive(newState);
    setTelemetry((prev) => ({ ...prev, flashlightActive: newState }));
    soundEffects.playSwitch();

    // Try hardware camera torch if mobile allows
    if (newState) {
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((stream) => {
            const track = stream.getVideoTracks()[0];
            setHardwareTorchTrack(track);
            (track as any).applyConstraints?.({
              advanced: [{ torch: true }],
            }).catch(() => {});
          })
          .catch(() => {});
      }
    } else {
      if (hardwareTorchTrack) {
        hardwareTorchTrack.stop();
        setHardwareTorchTrack(null);
      }
    }
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Reminders handlers
  const handleAddReminder = (item: Omit<ReminderItem, 'id' | 'createdAt' | 'completed'>) => {
    setReminders((prev) => [
      ...prev,
      {
        ...item,
        id: `r-${Date.now()}`,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleToggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed, triggered: false } : r))
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDismissAlarm = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, triggered: false, completed: true } : r))
    );
    if (ringingAlarm?.id === id) {
      setRingingAlarm(null);
    }
    soundEffects.playAcknowledge();
  };

  // Tactical Note handlers
  const handleAddNote = (note: Omit<TacticalNote, 'id' | 'createdAt'>) => {
    setNotes((prev) => [
      {
        ...note,
        id: `note-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Custom Quick Protocol shortcut handler
  const handleAddProtocol = (protocol: Omit<QuickProtocolItem, 'id'>) => {
    setProtocols((prev) => [
      ...prev,
      {
        ...protocol,
        id: `proto-${Date.now()}`,
      },
    ]);
  };

  // Test Voice trigger
  const handleTestVoice = () => {
    const testPhrase = 'नमस्ते हजुर, म चैते हुँ। मेरो आवाज स्पष्ट सुन्दै हुनुहुन्छ?';
    speakText(testPhrase, 'ne');
  };

  return (
    <div 
      className="relative min-h-screen w-full bg-[#030712] text-cyan-100 flex flex-col justify-between overflow-x-hidden"
      style={{
        filter: telemetry.brightnessLevel < 100 ? `brightness(${Math.max(0.3, telemetry.brightnessLevel / 100)})` : 'none',
      }}
    >
      {/* Background Cybernetic HUD Grid & Radial Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.18),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 pointer-events-none opacity-20 scanlines" />

      {/* Screen Torch Blaster Overlay (When Flashlight is ON) */}
      {screenTorchActive && (
        <div 
          onClick={() => toggleScreenTorch(false)}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-black cursor-pointer animate-fadeIn select-none"
        >
          <Zap className="w-16 h-16 text-amber-500 animate-pulse mb-3" />
          <h2 className="text-2xl font-black font-hud tracking-wider">SCREEN TORCH / टर्च सक्रिय</h2>
          <p className="text-sm font-mono mt-1 opacity-80">टर्च निभाउन स्क्रिनमा जहाँ पनि थिच्नुहोस् (Tap anywhere to Turn Off)</p>
        </div>
      )}

      {/* Ringing Alarm Modal */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-rose-950/90 border-2 border-rose-500 p-5 flex flex-col items-center text-center shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-bounce">
            <Bell className="w-12 h-12 text-rose-300 animate-spin mb-2" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-300">
              CHAITE ALARM PROTOCOL / समय भयो!
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{ringingAlarm.title}</h3>
            <p className="text-xs text-rose-200/80 mt-1">सम्झना वा टाइमर पूरा भयो।</p>
            <button
              onClick={() => handleDismissAlarm(ringingAlarm.id)}
              className="mt-4 w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold font-mono text-sm shadow-lg"
            >
              बन्द गर्नुहोस् (Dismiss Alarm)
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER HUD TELEMETRY BAR */}
      <header className="sticky top-0 z-30 w-full px-3 py-2 hud-glass flex items-center justify-between border-b border-cyan-500/30">
        {/* Left: Chaite Identity & Live Dot */}
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-400/50 flex items-center justify-center font-bold text-xs text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            चै
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-hud text-sm font-black tracking-wider text-cyan-200">CHAITE</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/60 font-semibold">
                JARVIS ne-NP
              </span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400/70 tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              NEURAL STATUS: {isProcessing ? 'CALCULATING' : isListening ? 'LISTENING' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Right: Telemetry Indicators & Quick Actions */}
        <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs">
          {/* Battery Readout */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] bg-black/40 px-2 py-1 rounded-md border border-cyan-500/20">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : 'PWR'}</span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => {
              setQuickAddTab('timer');
              setIsQuickAddOpen(true);
              soundEffects.playBlip();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30 transition-all font-mono font-bold text-[11px] active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            title="नयाँ थप्नुहोस् (Quick Add: Timer, Reminder, Note, Shortcut)"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-300" />
            <span>+ थप्नुहोस्</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              const next = !soundMuted;
              setSoundMuted(next);
              soundEffects.setMuted(next);
            }}
            className="p-1.5 rounded-lg bg-black/40 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100"
            title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Settings / Config Button */}
          <button
            onClick={() => {
              setIsSettingsOpen(true);
              soundEffects.playBlip();
            }}
            className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 transition-all"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-lg mx-auto px-3.5 py-2 flex flex-col justify-between">
        {/* VIEW 1: CORE / ASSISTANT VIEW */}
        {activeTab === 'core' && (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            {/* Holographic Arc Reactor Visualizer */}
            <ArcReactorCore
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              frequencyData={frequencyData}
              onCoreClick={toggleListening}
              statusText={
                isProcessing ? 'COMPUTING RESPONSE...' :
                isSpeaking ? 'TRANSMITTING VOICE...' :
                isListening ? 'LISTENING TO USER...' :
                'CHAITE CORE READY'
              }
            />

            {/* Live Transcript Bubble during speech */}
            {(interimTranscript || isListening) && (
              <div className="mb-2 p-2.5 rounded-xl hud-glass-active border-cyan-300 text-center animate-pulse">
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider font-bold block mb-0.5">
                  LIVE AUDIO TRANSCRIPTION / आवाज विश्लेषण:
                </span>
                <p className="text-sm text-cyan-100 font-semibold font-nepali">
                  {interimTranscript || 'बोल्नुहोस्, म सुन्दै छु... (Speak now...)'}
                </p>
              </div>
            )}

            {/* Recent Conversation Log / Interactive Feed */}
            <div className="w-full my-1">
              <ChatTranscriptPanel
                messages={messages.slice(-4)}
                onReplayAudio={(msg) => {
                  if (msg.spokenText) speakText(msg.spokenText, msg.language);
                }}
                isSpeaking={isSpeaking}
              />
            </div>

            {/* Quick Action Chips Bar */}
            <div className="w-full mt-2">
              <div className="text-[10px] font-mono text-cyan-400/80 mb-1 flex items-center justify-between">
                <span>QUICK PROTOCOLS (द्रुत आदेश):</span>
                <button
                  onClick={() => {
                    setQuickAddTab('protocol');
                    setIsQuickAddOpen(true);
                    soundEffects.playBlip();
                  }}
                  className="text-cyan-300 hover:text-white flex items-center gap-0.5 underline text-[10px]"
                >
                  <Plus className="w-3 h-3" />
                  <span>नयाँ आदेश (+ Protocol)</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {protocols.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleSendMessage(action.query)}
                    className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-cyan-500/30 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-950/60 transition-all shrink-0 font-medium active:scale-95 text-[11px]"
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setQuickAddTab('protocol');
                    setIsQuickAddOpen(true);
                    soundEffects.playBlip();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-dashed border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/30 transition-all shrink-0 font-bold active:scale-95 text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>थप्नुहोस्</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEVICE CONTROLS MATRIX */}
        {activeTab === 'controls' && (
          <div className="flex-1 flex flex-col py-2 animate-fadeIn">
            <DeviceControlPanel
              telemetry={telemetry}
              onToggleTorch={() => toggleScreenTorch()}
              onTriggerVibration={(p) => soundEffects.triggerHaptic(p)}
              onSetBrightness={(val) => setTelemetry((prev) => ({ ...prev, brightnessLevel: val }))}
              onToggleFullscreen={toggleFullscreen}
              onToggleCamera={() => setTelemetry((prev) => ({ ...prev, cameraActive: !prev.cameraActive }))}
              soundMuted={soundMuted}
              onToggleSoundMute={() => {
                const n = !soundMuted;
                setSoundMuted(n);
                soundEffects.setMuted(n);
              }}
              screenTorchActive={screenTorchActive}
              onToggleScreenTorch={() => toggleScreenTorch()}
            />
          </div>
        )}

        {/* VIEW 3: REMINDERS & TIMERS HUB */}
        {activeTab === 'reminders' && (
          <div className="flex-1 flex flex-col py-2 animate-fadeIn">
            <RemindersPanel
              reminders={reminders}
              notes={notes}
              onAddReminder={handleAddReminder}
              onToggleComplete={handleToggleComplete}
              onDeleteReminder={handleDeleteReminder}
              onDismissAlarm={handleDismissAlarm}
              onDeleteNote={handleDeleteNote}
              onSpeakNote={(text) => speakText(text, 'ne')}
              onOpenQuickAdd={(tab) => {
                setQuickAddTab(tab || 'timer');
                setIsQuickAddOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 4: FULL CONVERSATION TRANSCRIPT & SOURCES */}
        {activeTab === 'log' && (
          <div className="flex-1 flex flex-col py-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2 font-mono text-xs">
              <span className="font-bold text-cyan-200">TACTICAL CONVERSATION ARCHIVE</span>
              <button
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem('chaite_messages');
                  soundEffects.playBlip();
                }}
                className="text-[10px] text-rose-400 hover:underline"
              >
                इतिहास खाली गर्नुहोस् (Clear Log)
              </button>
            </div>
            <ChatTranscriptPanel
              messages={messages}
              onReplayAudio={(msg) => {
                if (msg.spokenText) speakText(msg.spokenText, msg.language);
              }}
              isSpeaking={isSpeaking}
            />
          </div>
        )}
      </main>

      {/* BOTTOM CONTROL & NAVIGATION BAR */}
      <footer className="sticky bottom-0 z-30 w-full px-3 py-2.5 hud-glass border-t border-cyan-500/30 flex flex-col gap-2">
        {/* Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="w-full max-w-lg mx-auto flex items-center gap-2"
        >
          {/* Quick Add Modal Trigger Button */}
          <button
            type="button"
            onClick={() => {
              setQuickAddTab('timer');
              setIsQuickAddOpen(true);
              soundEffects.playBlip();
            }}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all bg-black/60 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-500/20 shrink-0 active:scale-95 shadow-md"
            title="नयाँ थप्नुहोस् (Quick Add: Timer, Reminder, Note, Shortcut)"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Primary Voice Mic Trigger */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md shrink-0 active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.7)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            }`}
            title={isListening ? 'Stop Listening' : 'Speak to Chaite'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text input prompt fallback */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "सुन्दैछु... (Listening...)" : "चैतेलाई सोध्नुहोस् वा आदेश दिनुहोस्..."}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-100 placeholder-cyan-500/50 font-sans text-xs focus:outline-none focus:border-cyan-300 pr-10 shadow-inner"
            />
            {inputText.trim() && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Tactical Bottom Navigation Tabs */}
        <div className="w-full max-w-lg mx-auto grid grid-cols-4 gap-1 font-mono text-[10px]">
          <button
            onClick={() => { setActiveTab('core'); soundEffects.playBlip(); }}
            className={`py-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeTab === 'core'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mb-0.5" />
            <span>CORE</span>
          </button>

          <button
            onClick={() => { setActiveTab('controls'); soundEffects.playBlip(); }}
            className={`py-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeTab === 'controls'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 mb-0.5" />
            <span>DEVICE</span>
          </button>

          <button
            onClick={() => { setActiveTab('reminders'); soundEffects.playBlip(); }}
            className={`py-1.5 rounded-lg flex flex-col items-center justify-center transition-all relative ${
              activeTab === 'reminders'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5 mb-0.5" />
            <span>ALERTS</span>
            {reminders.some((r) => !r.completed) && (
              <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab('log'); soundEffects.playBlip(); }}
            className={`py-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeTab === 'log'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold'
                : 'text-cyan-400/60 hover:text-cyan-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 mb-0.5" />
            <span>ARCHIVE</span>
          </button>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={(up) => setConfig((prev) => ({ ...prev, ...up }))}
        onTestVoice={handleTestVoice}
      />

      {/* Quick Add Modal (Timer, Reminder, Tactical Note, Shortcut) */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        initialTab={quickAddTab}
        onClose={() => setIsQuickAddOpen(false)}
        onAddReminder={handleAddReminder}
        onAddNote={handleAddNote}
        onAddProtocol={handleAddProtocol}
      />
    </div>
  );
}
