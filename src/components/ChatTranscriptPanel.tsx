import React, { useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Volume2, 
  ExternalLink, 
  Globe, 
  CheckCircle2, 
  Cpu, 
  Sparkles,
  Search,
  Copy,
  Check
} from 'lucide-react';
import { ChatMessage } from '../types/chaite';
import { soundEffects } from '../utils/soundEffects';

interface ChatTranscriptPanelProps {
  messages: ChatMessage[];
  onReplayAudio: (message: ChatMessage) => void;
  isSpeaking: boolean;
}

export const ChatTranscriptPanel: React.FC<ChatTranscriptPanelProps> = ({
  messages,
  onReplayAudio,
  isSpeaking,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    soundEffects.playAcknowledge();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-2.5 font-mono text-xs max-h-72 sm:max-h-80 overflow-y-auto pr-1">
      {messages.length === 0 ? (
        <div className="p-4 rounded-xl hud-glass text-center text-cyan-400/60 flex flex-col items-center">
          <Sparkles className="w-6 h-6 text-cyan-400/50 mb-1 animate-pulse" />
          <p className="text-cyan-200 font-bold">CHAITE NEURAL TELEMETRY STANDBY</p>
          <p className="text-[11px] text-cyan-400/70 mt-1">
            "चैते, आज काठमाडौंको मौसम कस्तो छ?" वा "Set a 5 minute timer" भन्नुहोस्।
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          const isChaite = msg.sender === 'chaite';
          return (
            <div
              key={msg.id}
              className={`p-3 rounded-xl border transition-all ${
                isChaite
                  ? 'hud-glass border-cyan-500/30 text-cyan-100 shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                  : 'bg-cyan-950/40 border-cyan-600/30 text-cyan-200 ml-4'
              }`}
            >
              {/* Header meta */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5 font-bold">
                  {isChaite ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-cyan-500/30 border border-cyan-300 flex items-center justify-center text-[10px] text-cyan-200">
                        चै
                      </div>
                      <span className="text-cyan-300">CHAITE (चैते)</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/40 text-cyan-400 border border-cyan-700">
                        FEMALE AI
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-sky-300">USER (हजुर)</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-cyan-400/60">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  {isChaite && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.displayText || msg.text)}
                      className="p-1 hover:text-cyan-200 transition-colors"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                {msg.displayText || msg.text}
              </div>

              {/* Task Execution Badge if triggered */}
              {msg.task && msg.task.action !== 'none' && (
                <div className="mt-2.5 p-1.5 rounded-lg bg-black/40 border border-cyan-400/30 flex items-center gap-2 text-[10px] text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono uppercase font-bold text-emerald-300">TASK EXECUTED:</span>
                  <span className="font-mono text-cyan-200">
                    {msg.task.action.replace('_', ' ')} {msg.task.params?.title ? `(${msg.task.params.title})` : ''}
                  </span>
                </div>
              )}

              {/* Web Search Grounding Citations */}
              {msg.webSources && msg.webSources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-cyan-500/20">
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold mb-1.5">
                    <Globe className="w-3 h-3 text-cyan-300" />
                    <span>GOOGLE SEARCH GROUNDED SOURCES:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.webSources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-black/50 border border-cyan-500/30 hover:border-cyan-300 text-cyan-300 hover:text-cyan-100 flex items-center gap-1 text-[10px] transition-all max-w-[200px] truncate"
                      >
                        <span className="truncate">{source.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-cyan-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Replay Control for Chaite */}
              {isChaite && msg.spokenText && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-cyan-400/80 pt-1">
                  <button
                    onClick={() => onReplayAudio(msg)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 hover:bg-cyan-500/30 text-cyan-200 transition-all font-mono"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-300" />
                    <span>आवाज पुनः सुन्नुहोस् (Replay Audio)</span>
                  </button>

                  {msg.hudMetrics?.tacticalAdvice && (
                    <span className="text-[9px] text-cyan-400/60 italic font-mono">
                      HUD: {msg.hudMetrics.tacticalAdvice}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};
