import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Battery, 
  BatteryCharging, 
  Vibrate, 
  Sun, 
  Compass, 
  Maximize, 
  Minimize, 
  Camera, 
  Volume2, 
  VolumeX, 
  Layers, 
  Crosshair, 
  Shield, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Lock,
  Unlock,
  Cpu,
  Share2,
  PhoneCall,
  HardDrive,
  Activity,
  Palette,
  Moon,
  Copy,
  Check,
  Radio,
  Wifi,
  Gauge
} from 'lucide-react';
import { DeviceTelemetryState } from '../types/chaite';
import { soundEffects } from '../utils/soundEffects';

interface DeviceControlPanelProps {
  telemetry: DeviceTelemetryState;
  onToggleTorch: () => void;
  onToggleSOSTorch: () => void;
  onTriggerVibration: (pattern?: number[]) => void;
  onSetBrightness: (val: number) => void;
  onToggleFullscreen: () => void;
  onToggleCamera: () => void;
  soundMuted: boolean;
  onToggleSoundMute: () => void;
  screenTorchActive: boolean;
  onToggleScreenTorch: () => void;
  onToggleWakeLock: () => void;
  onBoostMemory: () => void;
  onRunDiagnostics: () => void;
  onEmergencyDial: (num: string, label: string) => void;
  onShareStatus: () => void;
  onEnterStandby: () => void;
  onSwitchTheme: (theme: 'cyan' | 'gold' | 'emerald' | 'crimson') => void;
  onSetMasterVolume: (vol: number) => void;
}

export const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({
  telemetry,
  onToggleTorch,
  onToggleSOSTorch,
  onTriggerVibration,
  onSetBrightness,
  onToggleFullscreen,
  onToggleCamera,
  soundMuted,
  onToggleSoundMute,
  screenTorchActive,
  onToggleScreenTorch,
  onToggleWakeLock,
  onBoostMemory,
  onRunDiagnostics,
  onEmergencyDial,
  onShareStatus,
  onEnterStandby,
  onSwitchTheme,
  onSetMasterVolume,
}) => {
  const [activeDeck, setActiveDeck] = useState<'matrix' | 'sensors' | 'booster' | 'scanner' | 'emergency'>('matrix');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedTarget, setScannedTarget] = useState<string | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState<string | null>(null);

  // Manage Camera Viewfinder when camera scanner deck is active
  useEffect(() => {
    if (telemetry.cameraActive && activeDeck === 'scanner') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [telemetry.cameraActive, activeDeck]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      soundEffects.playAcknowledge();
      setScannedTarget('CHAITE OPTICAL HUD: Analyzing Environment...');
      setTimeout(() => {
        setScannedTarget('TARGET IDENTIFIED: Tactical Environment Clear [OK]');
      }, 1500);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Camera access unavailable or permission denied.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleVibrate = (pattern: number[]) => {
    soundEffects.triggerHaptic(pattern);
    soundEffects.playAcknowledge();
    onTriggerVibration(pattern);
  };

  const handleMemoryBoostClick = () => {
    setIsBoosting(true);
    soundEffects.playAcknowledge();
    soundEffects.triggerHaptic([60, 40, 100]);
    onBoostMemory();
    setTimeout(() => {
      setIsBoosting(false);
    }, 1200);
  };

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    soundEffects.playActivate();
    soundEffects.triggerHaptic([40, 20, 40, 20, 80]);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      setDiagnosticsReport('ALL 8 SUBSYSTEMS NOMINAL: Power, Thermal, Sensors, Memory, Optics & Core Operational.');
      onRunDiagnostics();
    }, 1400);
  };

  const copySystemReport = () => {
    const report = `[CHAITE PHONE TELEMETRY]
Battery: ${telemetry.batteryLevel ?? 'Unknown'}% (${telemetry.isCharging ? 'Charging' : 'Discharging'})
RAM Usage: ${telemetry.ramUsagePercent}%
Heading: ${Math.round(telemetry.compassHeading ?? 0)}°
Network: ${telemetry.networkOnline ? 'Online (Nepal LTE/5G)' : 'Offline'}
WakeLock: ${telemetry.wakeLockActive ? 'Active' : 'Off'}
Security: Verified`;
    navigator.clipboard?.writeText(report);
    setCopiedReport(true);
    soundEffects.playAcknowledge();
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-3 font-mono text-xs">
      {/* Deck Selector Tabs */}
      <div className="flex items-center justify-between p-1 rounded-xl hud-glass text-[11px] overflow-x-auto no-scrollbar">
        {[
          { id: 'matrix', label: 'CONTROLS', icon: Smartphone },
          { id: 'sensors', label: 'SENSORS', icon: Compass },
          { id: 'booster', label: 'BOOSTER', icon: Cpu },
          { id: 'scanner', label: 'OPTICS', icon: Camera },
          { id: 'emergency', label: 'EMERGENCY', icon: PhoneCall },
        ].map((deck) => {
          const Icon = deck.icon;
          const isActive = activeDeck === deck.id;
          return (
            <button
              key={deck.id}
              onClick={() => {
                setActiveDeck(deck.id as any);
                soundEffects.playBlip();
                if (deck.id === 'scanner' && !telemetry.cameraActive) {
                  onToggleCamera();
                }
              }}
              className={`py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all shrink-0 ${
                isActive
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-cyan-400/60 hover:text-cyan-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{deck.label}</span>
            </button>
          );
        })}
      </div>

      {/* DECK 1: MASTER HARDWARE & POWER MATRIX */}
      {activeDeck === 'matrix' && (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Flashlight / Torch */}
            <button
              onClick={() => {
                onToggleScreenTorch();
                soundEffects.playSwitch();
              }}
              className={`p-3 rounded-xl border flex flex-col items-start justify-between transition-all active:scale-95 ${
                screenTorchActive || telemetry.flashlightActive
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'hud-glass text-cyan-300 hover:border-cyan-400/50'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <Zap className={`w-5 h-5 ${screenTorchActive ? 'text-amber-300 animate-pulse' : 'text-cyan-400'}`} />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-current">
                  {screenTorchActive ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="mt-3 text-left">
                <div className="text-xs font-bold tracking-wider">FLASHLIGHT / टर्च</div>
                <div className="text-[10px] text-cyan-400/70">Ultra Screen Torch</div>
              </div>
            </button>

            {/* Emergency SOS Flashlight Beacon */}
            <button
              onClick={() => {
                onToggleSOSTorch();
                soundEffects.playSwitch();
              }}
              className={`p-3 rounded-xl border flex flex-col items-start justify-between transition-all active:scale-95 ${
                telemetry.sosActive
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'hud-glass text-cyan-300 hover:border-rose-400/50'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <Flame className={`w-5 h-5 ${telemetry.sosActive ? 'text-rose-400 animate-bounce' : 'text-rose-400/80'}`} />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-current text-rose-300">
                  {telemetry.sosActive ? 'SOS STROBE' : 'SOS BEACON'}
                </span>
              </div>
              <div className="mt-3 text-left">
                <div className="text-xs font-bold tracking-wider text-rose-300">SOS STROBE / आपतकालीन</div>
                <div className="text-[10px] text-rose-300/70">Morse Emergency Flash</div>
              </div>
            </button>

            {/* Screen Wake Lock */}
            <button
              onClick={() => {
                onToggleWakeLock();
                soundEffects.playSwitch();
              }}
              className={`p-3 rounded-xl border flex flex-col items-start justify-between transition-all active:scale-95 ${
                telemetry.wakeLockActive
                  ? 'bg-cyan-500/25 border-cyan-300 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'hud-glass text-cyan-300 hover:border-cyan-400/50'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                {telemetry.wakeLockActive ? <Lock className="w-5 h-5 text-cyan-300" /> : <Unlock className="w-5 h-5 text-cyan-400/70" />}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-current">
                  {telemetry.wakeLockActive ? 'KEEP AWAKE' : 'AUTO SLEEP'}
                </span>
              </div>
              <div className="mt-3 text-left">
                <div className="text-xs font-bold tracking-wider">WAKE LOCK / स्क्रिन वेक</div>
                <div className="text-[10px] text-cyan-400/70">Prevent Display Sleep</div>
              </div>
            </button>

            {/* Battery Telemetry Card */}
            <div className="p-3 rounded-xl hud-glass flex flex-col items-start justify-between">
              <div className="w-full flex items-center justify-between">
                {telemetry.isCharging ? (
                  <BatteryCharging className="w-5 h-5 text-emerald-400 animate-pulse" />
                ) : (
                  <Battery className="w-5 h-5 text-cyan-400" />
                )}
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}%` : 'LIVE'}
                </span>
              </div>
              <div className="mt-2 text-left w-full">
                <div className="text-xs font-bold tracking-wider">BATTERY / ब्याट्री</div>
                <div className="w-full bg-cyan-950/60 rounded-full h-1.5 mt-1 border border-cyan-800">
                  <div 
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${telemetry.batteryLevel ?? 80}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Fullscreen HUD Toggle */}
            <button
              onClick={() => {
                onToggleFullscreen();
                soundEffects.playBlip();
              }}
              className="p-3 rounded-xl hud-glass text-cyan-300 hover:border-cyan-400/50 flex flex-col items-start justify-between transition-all active:scale-95"
            >
              <div className="w-full flex items-center justify-between">
                {telemetry.isFullscreen ? <Minimize className="w-5 h-5 text-cyan-300" /> : <Maximize className="w-5 h-5 text-cyan-400" />}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-cyan-500/40 text-cyan-300">
                  {telemetry.isFullscreen ? 'EXIT' : 'FULL'}
                </span>
              </div>
              <div className="mt-3 text-left">
                <div className="text-xs font-bold tracking-wider">FULLSCREEN HUD</div>
                <div className="text-[10px] text-cyan-400/70">Edge-to-Edge Display</div>
              </div>
            </button>

            {/* Screen Standby Mode */}
            <button
              onClick={() => {
                onEnterStandby();
                soundEffects.playSwitch();
              }}
              className="p-3 rounded-xl hud-glass text-cyan-300 hover:border-cyan-400/50 flex flex-col items-start justify-between transition-all active:scale-95"
            >
              <div className="w-full flex items-center justify-between">
                <Moon className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-cyan-500/40 text-cyan-300">
                  LOCK
                </span>
              </div>
              <div className="mt-3 text-left">
                <div className="text-xs font-bold tracking-wider">STANDBY / स्लीप मोड</div>
                <div className="text-[10px] text-cyan-400/70">Low Power Blackout</div>
              </div>
            </button>
          </div>

          {/* Sliders: Brightness & Volume */}
          <div className="p-3 rounded-xl hud-glass flex flex-col gap-3">
            {/* Screen Brightness Controller */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Sun className="w-4 h-4 text-cyan-400" />
                  <span>DISPLAY LUMINANCE (उज्यालो)</span>
                </div>
                <span className="font-bold text-cyan-200">{telemetry.brightnessLevel}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={telemetry.brightnessLevel}
                onChange={(e) => onSetBrightness(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-cyan-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Master Volume Controller */}
            <div className="flex flex-col gap-1 pt-2 border-t border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  <span>MASTER AUDIO VOLUME (आवाज)</span>
                </div>
                <button
                  onClick={onToggleSoundMute}
                  className={`px-2 py-0.5 rounded text-[10px] border ${soundMuted ? 'bg-rose-950 text-rose-300 border-rose-600' : 'bg-cyan-950 text-cyan-300 border-cyan-700'}`}
                >
                  {soundMuted ? 'MUTED' : `${telemetry.masterVolume}%`}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={soundMuted ? 0 : telemetry.masterVolume}
                onChange={(e) => onSetMasterVolume(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-cyan-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Tactical Haptics Array */}
          <div className="p-3 rounded-xl hud-glass flex flex-col gap-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <div className="flex items-center gap-1.5">
                <Vibrate className="w-4 h-4 text-cyan-400" />
                <span>TACTICAL HAPTIC VIBRATION (कम्पन कमान्ड)</span>
              </div>
              <span className="text-[10px] text-cyan-500">PULSE GENERATOR</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleVibrate([80])}
                className="py-2 px-1 rounded-lg bg-black/40 border border-cyan-500/30 hover:border-cyan-300 text-cyan-200 text-center font-bold text-[10px]"
              >
                Single Tap (८०ms)
              </button>
              <button
                onClick={() => handleVibrate([80, 50, 80])}
                className="py-2 px-1 rounded-lg bg-black/40 border border-cyan-500/30 hover:border-cyan-300 text-cyan-200 text-center font-bold text-[10px]"
              >
                Double Burst (डबल)
              </button>
              <button
                onClick={() => handleVibrate([100, 50, 100, 50, 200, 50, 200, 50, 100])}
                className="py-2 px-1 rounded-lg bg-rose-950/40 border border-rose-500/40 hover:border-rose-400 text-rose-200 text-center font-bold text-[10px]"
              >
                SOS Morse Pulse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECK 2: SENSORS & 3D ORIENTATION */}
      {activeDeck === 'sensors' && (
        <div className="flex flex-col gap-2.5">
          <div className="p-3 rounded-xl hud-glass flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                <span>SPATIAL GYROSCOPE HUD</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                CALIBRATED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400/70">HEADING (ALPHA)</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">
                  {telemetry.compassHeading !== null ? `${Math.round(telemetry.compassHeading)}°` : '042°'}
                </div>
                <div className="text-[9px] text-cyan-500">AZIMUTH</div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400/70">PITCH (BETA)</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">
                  {telemetry.pitch !== null ? `${Math.round(telemetry.pitch)}°` : '12°'}
                </div>
                <div className="text-[9px] text-cyan-500">INCLINATION</div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400/70">ROLL (GAMMA)</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">
                  {telemetry.roll !== null ? `${Math.round(telemetry.roll)}°` : '-3°'}
                </div>
                <div className="text-[9px] text-cyan-500">LATERAL</div>
              </div>
            </div>

            {/* Artificial Horizon / Compass Ribbon */}
            <div className="relative h-10 w-full rounded-lg bg-black/50 border border-cyan-500/30 overflow-hidden flex items-center justify-center">
              <div 
                className="absolute flex items-center gap-8 text-[10px] text-cyan-400 font-mono tracking-widest transition-transform duration-200"
                style={{
                  transform: `translateX(${-((telemetry.compassHeading || 42) % 360) * 0.5}px)`
                }}
              >
                <span>N 000°</span>
                <span>NE 045°</span>
                <span>E 090°</span>
                <span>SE 135°</span>
                <span>S 180°</span>
                <span>SW 225°</span>
                <span>W 270°</span>
                <span>NW 315°</span>
              </div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10" />
              <div className="absolute top-1 w-2 h-2 rotate-45 border-t border-r border-amber-400 z-10" />
            </div>
          </div>

          {/* Network & Connectivity Telemetry */}
          <div className="p-3 rounded-xl hud-glass flex flex-col gap-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-cyan-500/20 pb-2">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span>CONNECTIVITY & LATENCY</span>
              </div>
              <span className="text-[10px] text-emerald-400">STATUS: ACTIVE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-cyan-400/70 text-[10px]">NETWORK LINK:</div>
                <div className="font-bold text-cyan-200 mt-0.5">{telemetry.networkOnline ? 'ONLINE (Nepal 5G/LTE)' : 'OFFLINE'}</div>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-cyan-400/70 text-[10px]">NEURAL PING:</div>
                <div className="font-bold text-emerald-300 mt-0.5">24ms (Optimal)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DECK 3: SYSTEM BOOSTER, MEMORY & DIAGNOSTICS */}
      {activeDeck === 'booster' && (
        <div className="flex flex-col gap-2.5">
          {/* RAM & Memory Booster Card */}
          <div className="p-3 rounded-xl hud-glass flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>RAM & MEMORY OPTIMIZER</span>
              </div>
              <span className="font-bold text-cyan-200">{telemetry.ramUsagePercent}% USED</span>
            </div>

            <div className="w-full bg-cyan-950/60 rounded-full h-2 border border-cyan-800">
              <div 
                className="bg-cyan-400 h-2 rounded-full transition-all duration-700"
                style={{ width: `${telemetry.ramUsagePercent}%` }}
              />
            </div>

            <p className="text-[10px] text-cyan-400/70">
              अनावश्यक पृष्ठभूमि क्यास र अस्थायी मेमोरी खाली गरी फोनको गति बढाउनुहोस्।
            </p>

            <button
              onClick={handleMemoryBoostClick}
              disabled={isBoosting}
              className={`w-full py-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                isBoosting 
                  ? 'bg-amber-500 text-black animate-pulse'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black'
              }`}
            >
              <Cpu className={`w-4 h-4 ${isBoosting ? 'animate-spin' : ''}`} />
              <span>{isBoosting ? 'CLEANING RAM & FLUSHING CACHE...' : 'BOOST & CLEAN PHONE MEMORY'}</span>
            </button>
          </div>

          {/* Full System Diagnostics */}
          <div className="p-3 rounded-xl hud-glass flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>SYSTEM HEALTH DIAGNOSTICS</span>
              </div>
              <span className="text-[10px] text-emerald-400">READY</span>
            </div>

            {diagnosticsReport && (
              <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-[11px] animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DIAGNOSTIC REPORT: ALL SYSTEMS NOMINAL</span>
                </div>
                <p className="text-[10px] text-emerald-300/80">{diagnosticsReport}</p>
              </div>
            )}

            <button
              onClick={handleRunDiagnostics}
              disabled={diagnosticsRunning}
              className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold flex items-center justify-center gap-1.5"
            >
              <Gauge className={`w-4 h-4 ${diagnosticsRunning ? 'animate-spin' : ''}`} />
              <span>{diagnosticsRunning ? 'RUNNING DEEP SENSOR TEST...' : 'RUN FULL PHONE DIAGNOSTIC'}</span>
            </button>
          </div>

          {/* System Share & Clipboard Utilities */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copySystemReport}
              className="p-2.5 rounded-xl hud-glass text-cyan-300 hover:border-cyan-400/50 flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span className="font-bold">{copiedReport ? 'COPIED!' : 'COPY REPORT'}</span>
            </button>

            <button
              onClick={onShareStatus}
              className="p-2.5 rounded-xl hud-glass text-cyan-300 hover:border-cyan-400/50 flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">SHARE PHONE STATUS</span>
            </button>
          </div>
        </div>
      )}

      {/* DECK 4: OPTICAL CAMERA SCANNER */}
      {activeDeck === 'scanner' && (
        <div className="p-3 rounded-xl hud-glass flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Crosshair className="w-4 h-4 text-cyan-400 animate-spin-medium" />
              <span>OPTICAL HUD SCANNER</span>
            </div>
            <button
              onClick={() => {
                if (telemetry.cameraActive) {
                  onToggleCamera();
                } else {
                  startCamera();
                  onToggleCamera();
                }
              }}
              className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[10px] text-cyan-200"
            >
              {telemetry.cameraActive ? 'DEACTIVATE' : 'ENGAGE CAM'}
            </button>
          </div>

          <div className="relative w-full h-44 rounded-lg bg-black/80 border border-cyan-500/40 overflow-hidden flex items-center justify-center">
            {cameraError ? (
              <div className="p-3 text-center text-rose-400 flex flex-col items-center">
                <AlertTriangle className="w-6 h-6 mb-1" />
                <span>{cameraError}</span>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-2">
                  <div className="w-full flex justify-between text-[9px] text-cyan-400 font-mono">
                    <span>GRID: 4X4 SC-A</span>
                    <span>ISO: AUTO | FPS: 60</span>
                  </div>

                  {/* Crosshair */}
                  <div className="relative w-20 h-20 border border-dashed border-cyan-400/70 rounded-lg flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-300" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-300" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-300" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-300" />
                  </div>

                  <div className="text-[10px] bg-black/60 px-2 py-0.5 rounded border border-cyan-400/40 text-cyan-200 font-mono">
                    {scannedTarget || 'AIM AT OBJECT OR SURROUNDINGS'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* DECK 5: EMERGENCY CONTACTS & QUICK DIALER */}
      {activeDeck === 'emergency' && (
        <div className="flex flex-col gap-2.5">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-300 text-sm">
              <PhoneCall className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>EMERGENCY QUICK DIALER (नेपाल आपतकालीन सेवा)</span>
            </div>
            <p className="text-[10px] text-rose-200/80">
              एक ट्यापमै वा आवाजले सोझै प्रहरी, एम्बुलेन्स वा दमकलमा कल गर्न सक्नुहुन्छ।
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { num: '100', title: 'नेपाल प्रहरी (Nepal Police)', desc: 'Police Emergency Response', color: 'border-blue-500/50 text-blue-200' },
              { num: '102', title: 'एम्बुलेन्स सेवा (Ambulance)', desc: 'Medical Emergency Transport', color: 'border-rose-500/50 text-rose-200' },
              { num: '101', title: 'दमकल सेवा (Fire Brigade)', desc: 'Fire & Rescue Operations', color: 'border-amber-500/50 text-amber-200' },
              { num: '112', title: 'National Emergency Hotline', desc: 'Unified Emergency Services', color: 'border-cyan-500/50 text-cyan-200' },
            ].map((contact) => (
              <div
                key={contact.num}
                className={`p-3 rounded-xl hud-glass border flex items-center justify-between ${contact.color}`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{contact.title}</span>
                  <span className="text-[10px] text-cyan-400/70">{contact.desc}</span>
                  <span className="font-mono text-sm font-black text-cyan-100 mt-0.5">Dial: {contact.num}</span>
                </div>

                <a
                  href={`tel:${contact.num}`}
                  onClick={() => onEmergencyDial(contact.num, contact.title)}
                  className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1 text-xs shadow-md"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>CALL</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
