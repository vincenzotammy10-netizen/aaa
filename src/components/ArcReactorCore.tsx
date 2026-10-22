import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Cpu } from 'lucide-react';

interface ArcReactorCoreProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  frequencyData: Uint8Array | null;
  onCoreClick: () => void;
  statusText?: string;
  themeColor?: 'cyan' | 'amber' | 'crimson';
  activeGestureAlert?: { name: string; feedback: string; triggerWord?: string } | null;
  onOpenGestures?: () => void;
  voiceGesturesEnabled?: boolean;
}

export const ArcReactorCore: React.FC<ArcReactorCoreProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  frequencyData,
  onCoreClick,
  statusText = 'SYSTEM READY',
  themeColor = 'cyan',
  activeGestureAlert = null,
  onOpenGestures,
  voiceGesturesEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time canvas radial audio waveform drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 64;

      ctx.clearRect(0, 0, width, height);

      // Draw central energy field
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius + 20);
      if (isListening) {
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
        gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.15)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else if (isProcessing) {
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
        gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.2)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else if (isSpeaking) {
        gradient.addColorStop(0, 'rgba(34, 211, 238, 0.55)');
        gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.25)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Audio frequency radiating bars
      const numBars = 36;
      const angleStep = (Math.PI * 2) / numBars;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 8;
        if (frequencyData && frequencyData.length > 0) {
          const freqIndex = Math.floor((i / numBars) * (frequencyData.length / 2));
          const val = frequencyData[freqIndex] || 0;
          barHeight = 6 + (val / 255) * 44;
        } else if (isProcessing) {
          const time = Date.now() * 0.005;
          barHeight = 8 + Math.sin(time + i * 0.5) * 12;
        } else if (isListening) {
          barHeight = 10 + Math.random() * 8;
        }

        const angle = i * angleStep;
        const x1 = centerX + Math.cos(angle) * (radius - 2);
        const y1 = centerY + Math.sin(angle) * (radius - 2);
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = isProcessing 
          ? 'rgba(245, 158, 11, 0.85)' 
          : isListening 
          ? 'rgba(34, 211, 238, 0.95)' 
          : isSpeaking
          ? 'rgba(56, 189, 248, 0.95)'
          : 'rgba(6, 182, 212, 0.4)';
        
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isListening, isSpeaking, isProcessing, frequencyData]);

  return (
    <div className="relative flex flex-col items-center justify-center my-4 select-none">
      {/* Outer Holographic Arc Reactor Chamber */}
      <div 
        onClick={onCoreClick}
        role="button"
        tabIndex={0}
        aria-label="Toggle voice input"
        className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center cursor-pointer transition-transform active:scale-95 group"
      >
        {/* Background glow flare */}
        <div 
          className={`absolute inset-4 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none ${
            isListening 
              ? 'bg-cyan-500/30 opacity-100 scale-110' 
              : isSpeaking 
              ? 'bg-sky-400/35 opacity-100' 
              : isProcessing 
              ? 'bg-amber-500/30 opacity-90' 
              : 'bg-cyan-600/15 opacity-60'
          }`} 
        />

        {/* Ring 1: Outer Azimuth & Degree Ticks (Rotates Slow Clockwise) */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/25 animate-spin-slow pointer-events-none">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-t-2 border-r-2 border-cyan-400 rotate-45" />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-b-2 border-l-2 border-cyan-400 rotate-45" />
          <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 -rotate-45" />
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 border-b-2 border-r-2 border-cyan-400 -rotate-45" />
          
          {/* Subtle Degree Markers */}
          <div className="absolute top-3 right-6 text-[8px] font-mono text-cyan-400/60 tracking-widest">045°</div>
          <div className="absolute bottom-3 left-6 text-[8px] font-mono text-cyan-400/60 tracking-widest">225°</div>
        </div>

        {/* Ring 2: Segmented Arc Ring (Rotates Reverse Medium) */}
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-400/35 animate-spin-reverse-slow pointer-events-none" />

        {/* Ring 3: Tactical Target Reticles & Triangles */}
        <div className="absolute inset-8 rounded-full border border-cyan-500/40 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-b-2 border-cyan-300/50 rounded-full animate-spin-medium" />
        </div>

        {/* Ring 4: Inner Core Bezel with Metallic Cyan Hue */}
        <div className={`absolute inset-12 rounded-full hud-glass flex items-center justify-center transition-all duration-300 ${
          isListening ? 'border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)]' :
          isSpeaking ? 'border-sky-300 shadow-[0_0_25px_rgba(56,189,248,0.45)]' :
          isProcessing ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)]' :
          'border-cyan-500/30'
        }`}>
          {/* Audio Waveform Canvas */}
          <canvas 
            ref={canvasRef} 
            width={240} 
            height={240} 
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Central Reactor Heart with CHAITE / चैते Monogram */}
          <div className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
            isListening 
              ? 'bg-cyan-950/90 border border-cyan-300 shadow-[inset_0_0_18px_rgba(6,182,212,0.8)] scale-105' 
              : isSpeaking
              ? 'bg-sky-950/90 border border-sky-300 shadow-[inset_0_0_18px_rgba(56,189,248,0.7)]'
              : isProcessing
              ? 'bg-amber-950/90 border border-amber-400 shadow-[inset_0_0_18px_rgba(245,158,11,0.7)]'
              : 'bg-slate-950/80 border border-cyan-500/40 group-hover:border-cyan-300 shadow-[inset_0_0_12px_rgba(6,182,212,0.3)]'
          }`}>
            {/* Center Icon/Emblem */}
            {isListening ? (
              <div className="flex flex-col items-center animate-pulse">
                <Mic className="w-7 h-7 text-cyan-300 mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider text-cyan-200">सुन्दैछु...</span>
              </div>
            ) : isSpeaking ? (
              <div className="flex flex-col items-center animate-bounce">
                <Volume2 className="w-7 h-7 text-sky-300 mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider text-sky-200">बोल्दैछु</span>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center">
                <Sparkles className="w-7 h-7 text-amber-300 animate-spin mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider text-amber-200">सोच्दैछु</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-cyan-300 tracking-wider font-nepali drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                  चैते
                </span>
                <span className="text-[9px] font-mono tracking-widest text-cyan-400/80 font-bold uppercase mt-0.5">
                  CHAITE AI
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sci-Fi Decorative Corner Brackets */}
        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />
      </div>

      {/* Real-time Status Readout Pill */}
      <div className="mt-3 flex items-center gap-2 px-3.5 py-1 rounded-full hud-glass text-xs font-mono tracking-wider">
        <span className={`w-2 h-2 rounded-full ${
          isListening ? 'bg-cyan-400 animate-ping' :
          isSpeaking ? 'bg-sky-400 animate-pulse' :
          isProcessing ? 'bg-amber-400 animate-spin' :
          'bg-emerald-400'
        }`} />
        <span className="text-cyan-200 uppercase font-semibold text-[11px]">
          {isListening ? 'LISTENING / अडियो लिँदैछ' :
           isSpeaking ? 'TRANSMITTING / चैते सक्रिय' :
           isProcessing ? 'NEURAL COMPUTE / विश्लेषण' :
           statusText}
        </span>
      </div>

      {/* Voice Gesture Detected Holographic Alert */}
      {activeGestureAlert && (
        <div className="mt-2 px-3 py-1 rounded-xl bg-cyan-950/90 border border-cyan-300 text-cyan-200 text-xs font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          <span className="font-bold uppercase tracking-wider text-[11px]">
            GESTURE TRIGGERED: {activeGestureAlert.feedback}
          </span>
          {activeGestureAlert.triggerWord && (
            <span className="px-1.5 py-0.2 rounded bg-cyan-900 border border-cyan-600 text-[10px] text-cyan-300">
              "{activeGestureAlert.triggerWord}"
            </span>
          )}
        </div>
      )}

      {/* Quick Tap & Voice Gestures Helper Pill */}
      <div className="flex flex-col items-center mt-1">
        <p className="text-[11px] text-cyan-400/70 font-mono tracking-wide">
          {isListening ? 'ट्याप गरेर रोक्नुहोस् (Tap to finish)' : 'बोल्न यहाँ थिच्नुहोस् (Tap Core to Speak)'}
        </p>

        {voiceGesturesEnabled && (
          <button
            onClick={onOpenGestures}
            className="mt-1 px-2.5 py-0.5 rounded-full bg-black/40 border border-cyan-500/30 hover:border-cyan-400 text-[10px] text-cyan-300/80 font-mono flex items-center gap-1.5 transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>VOICE GESTURES ACTIVE: SAY "SHH", "STOP", "बन्द"</span>
          </button>
        )}
      </div>
    </div>
  );
};
