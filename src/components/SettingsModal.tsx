import React from 'react';
import { 
  X, 
  Volume2, 
  Sliders, 
  HelpCircle, 
  Sparkles, 
  Check, 
  Mic, 
  Smartphone, 
  Globe,
  Radio
} from 'lucide-react';
import { VoiceConfig } from '../types/chaite';
import { soundEffects } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VoiceConfig;
  onUpdateConfig: (config: Partial<VoiceConfig>) => void;
  onTestVoice: () => void;
  onOpenGesturesModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTestVoice,
  onOpenGesturesModal,
}) => {
  const [activeTab, setActiveTab] = React.useState<'voice' | 'commands'>('voice');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl hud-glass-active p-5 flex flex-col gap-4 font-mono text-xs border border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-cyan-200">
              CHAITE CONFIG & PROTOCOLS
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              soundEffects.playBlip();
            }}
            className="p-1 rounded-lg text-cyan-400 hover:text-cyan-100 hover:bg-cyan-500/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-black/40 p-1 border border-cyan-500/30">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-1.5 rounded-md font-bold text-center transition-all ${
              activeTab === 'voice' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-cyan-400/60'
            }`}
          >
            FEMALE VOICE & AUDIO
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`flex-1 py-1.5 rounded-md font-bold text-center transition-all ${
              activeTab === 'commands' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'text-cyan-400/60'
            }`}
          >
            VOICE COMMANDS (आदेश)
          </button>
        </div>

        {/* Tab 1: Voice & Audio Settings */}
        {activeTab === 'voice' && (
          <div className="flex flex-col gap-3.5 max-h-96 overflow-y-auto pr-1">
            {/* Preferred Language */}
            <div className="flex flex-col gap-1.5">
              <label className="text-cyan-300 font-bold flex items-center justify-between">
                <span>SPEECH LANGUAGE / भाषा</span>
                <span className="text-[10px] text-cyan-400/70">{config.language}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ne-NP', label: 'नेपाली (Nepali)' },
                  { id: 'en-US', label: 'English' },
                  { id: 'auto', label: 'Auto (दुवै)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onUpdateConfig({ language: item.id as any })}
                    className={`py-2 px-1 rounded-lg border text-center transition-all text-[11px] ${
                      config.language === item.id
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100 font-bold'
                        : 'bg-black/30 border-cyan-500/20 text-cyan-400/70 hover:border-cyan-400/40'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TTS Engine */}
            <div className="flex flex-col gap-1.5">
              <label className="text-cyan-300 font-bold">SPEECH ENGINE</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateConfig({ engine: 'webspeech' })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    config.engine === 'webspeech'
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                      : 'bg-black/30 border-cyan-500/20 text-cyan-400/70'
                  }`}
                >
                  <div className="font-bold text-[11px]">Web Speech API</div>
                  <div className="text-[9px] text-cyan-400/60">Instant low latency female voice</div>
                </button>

                <button
                  onClick={() => onUpdateConfig({ engine: 'gemini-tts' })}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    config.engine === 'gemini-tts'
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                      : 'bg-black/30 border-cyan-500/20 text-cyan-400/70'
                  }`}
                >
                  <div className="font-bold text-[11px]">Gemini 3.8 Flash TTS</div>
                  <div className="text-[9px] text-cyan-400/60">High fidelity neural female audio</div>
                </button>
              </div>
            </div>

            {/* Pitch Controller */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-cyan-300">
                <span>FEMALE PITCH MODULATOR:</span>
                <span className="font-bold text-cyan-200">{config.femalePitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.9}
                max={1.4}
                step={0.02}
                value={config.femalePitch}
                onChange={(e) => onUpdateConfig({ femalePitch: Number(e.target.value) })}
                className="w-full accent-cyan-400 bg-cyan-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-cyan-500">
                <span>Deep</span>
                <span>Warm Female</span>
                <span>High Frequency</span>
              </div>
            </div>

            {/* Speaking Rate */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-cyan-300">
                <span>SPEAKING CADENCE:</span>
                <span className="font-bold text-cyan-200">{config.speakingRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={config.speakingRate}
                onChange={(e) => onUpdateConfig({ speakingRate: Number(e.target.value) })}
                className="w-full accent-cyan-400 bg-cyan-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Voice Gestures Fast Control Banner */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-cyan-200">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>VOICE GESTURES (इशारा आदेश)</span>
                </div>
                <button
                  onClick={() => onUpdateConfig({ voiceGesturesEnabled: !(config.voiceGesturesEnabled ?? true) })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    (config.voiceGesturesEnabled ?? true)
                      ? 'bg-cyan-500 text-black border-cyan-300'
                      : 'bg-black/40 text-slate-400 border-slate-700'
                  }`}
                >
                  {(config.voiceGesturesEnabled ?? true) ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              <p className="text-[10px] text-cyan-400/70">
                सुन्दै गर्दा "Shh", "Stop", "चुप" वा "बन्द" भनेर तुरुन्तै आवाज वा अलार्म रोक्नुहोस्।
              </p>
              {onOpenGesturesModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGesturesModal();
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-center font-bold text-[11px]"
                >
                  इशाराहरू सम्पादन गर्नुहोस् (Manage Voice Gestures)
                </button>
              )}
            </div>

            {/* Test Voice Button */}
            <button
              onClick={() => {
                onTestVoice();
                soundEffects.playAcknowledge();
              }}
              className="mt-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>आवाज परीक्षण गर्नुहोस् (Test Chaite Voice)</span>
            </button>
          </div>
        )}

        {/* Tab 2: Voice Commands Cheatsheet */}
        {activeTab === 'commands' && (
          <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
            <p className="text-[11px] text-cyan-300/80">
              चैतेलाई सोझै आवाज वा टेक्स्ट मार्फत निम्न कार्यहरू भन्न सक्नुहुन्छ:
            </p>

            <div className="flex flex-col gap-2">
              <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-400/40">
                <span className="text-cyan-200 font-bold text-[11px]">🖐️ VOICE GESTURES (द्रुत इशारा कमान्ड):</span>
                <p className="text-[11px] text-cyan-100 mt-0.5">"Shh!" वा "मौन" ➔ तुरुन्त आवाज रोक्छ (Silence)</p>
                <p className="text-[11px] text-cyan-100 mt-0.5">"Stop!" वा "चुप" ➔ आपतकालीन बन्द (Halt speech/alarm)</p>
                <p className="text-[10px] text-cyan-400/70">"बत्ती" (Torch) / "कम्पन" (Vibrate) / "Dismiss" (Alarm off)</p>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                <span className="text-cyan-300 font-bold text-[11px]">⏰ REMINDERS & TIMERS:</span>
                <p className="text-[11px] text-cyan-100 mt-0.5">"चैते, ५ मिनेटको टाइमर राख"</p>
                <p className="text-[10px] text-cyan-400/70">"चैते, मलाई भोलि बिहान ७ बजे सम्झाउ"</p>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                <span className="text-cyan-300 font-bold text-[11px]">🔍 REAL-TIME WEB SEARCH:</span>
                <p className="text-[11px] text-cyan-100 mt-0.5">"आज काठमाडौंको मौसम कस्तो छ?"</p>
                <p className="text-[10px] text-cyan-400/70">"सुनको भाउ कति पुग्यो?" वा "Nepal cricket score"</p>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                <span className="text-cyan-300 font-bold text-[11px]">⚡ DEVICE CONTROLS:</span>
                <p className="text-[11px] text-cyan-100 mt-0.5">"बत्ती बाल" / "Turn on flashlight"</p>
                <p className="text-[10px] text-cyan-400/70">"फोन भाइब्रेट गर" / "Battery कति प्रतिशत छ?"</p>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                <span className="text-cyan-300 font-bold text-[11px]">🧠 HIGH KNOWLEDGE & SCIENCE:</span>
                <p className="text-[11px] text-cyan-100 mt-0.5">"चैते, सगरमाथाको उचाइ र इतिहास बताउ"</p>
                <p className="text-[10px] text-cyan-400/70">"Quantum physics सरल भाषामा सम्झाउ"</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-cyan-500/20 flex justify-between items-center text-[10px] text-cyan-500">
          <span>CHAITE v3.8 JARVIS HUD</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-cyan-900/40 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-900/70"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
