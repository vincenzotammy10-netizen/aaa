export type TaskAction = 
  | 'reminder' 
  | 'timer' 
  | 'note'
  | 'quick_add'
  | 'flashlight_on' 
  | 'flashlight_off' 
  | 'vibrate' 
  | 'battery_check' 
  | 'web_search' 
  | 'camera_scan' 
  | 'fullscreen' 
  | 'compass' 
  | 'brightness' 
  | 'none';

export interface TaskDetails {
  action: TaskAction;
  params?: {
    title?: string;
    content?: string;
    targetTime?: string;
    durationSeconds?: number;
    query?: string;
    level?: number;
    tab?: 'timer' | 'reminder' | 'note' | 'protocol';
  };
}

export interface TacticalNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  category?: 'general' | 'work' | 'personal' | 'tactical';
}

export interface QuickProtocolItem {
  id: string;
  label: string;
  query: string;
  isCustom?: boolean;
}


export interface WebSource {
  title: string;
  uri: string;
}

export interface HudMetrics {
  status: 'ONLINE' | 'ENGAGED' | 'EXECUTING' | 'SCANNING' | 'ALERT';
  tacticalAdvice?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'chaite';
  text: string;
  spokenText?: string;
  displayText?: string;
  timestamp: string;
  language?: 'ne' | 'en' | 'auto';
  task?: TaskDetails;
  hudMetrics?: HudMetrics;
  webSources?: WebSource[];
  audioUrl?: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueTime?: string; // ISO string
  durationSeconds?: number;
  remainingSeconds?: number;
  isTimer: boolean;
  completed: boolean;
  createdAt: string;
  triggered?: boolean;
}

export interface DeviceTelemetryState {
  batteryLevel: number | null; // 0 - 100
  isCharging: boolean | null;
  compassHeading: number | null; // 0 - 360 deg
  pitch: number | null;
  roll: number | null;
  networkOnline: boolean;
  flashlightActive: boolean;
  brightnessLevel: number; // 0 - 100
  cameraActive: boolean;
  isFullscreen: boolean;
}

export interface VoiceConfig {
  engine: 'auto' | 'gemini-tts' | 'webspeech';
  femalePitch: number; // 0.8 - 1.5 (default 1.2 for warm female)
  speakingRate: number; // 0.8 - 1.4 (default 1.0)
  language: 'ne-NP' | 'en-US' | 'auto';
  soundEffectsEnabled: boolean;
  autoSpeak: boolean;
  hapticFeedbackEnabled: boolean;
}
