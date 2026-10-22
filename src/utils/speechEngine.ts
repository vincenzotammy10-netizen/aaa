export interface SpeechEngineCallbacks {
  onTranscriptChange?: (text: string, isFinal: boolean) => void;
  onListeningStateChange?: (isListening: boolean) => void;
  onSpeakingStateChange?: (isSpeaking: boolean) => void;
  onAudioFrequency?: (frequencyArray: Uint8Array) => void;
  onError?: (errorMessage: string) => void;
}

export class ChaiteSpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private callbacks: SpeechEngineCallbacks = {};

  // Voice preferences
  public femalePitch: number = 1.18; // Warm female pitch
  public speakingRate: number = 0.96; // Articulate speed
  public currentLang: 'ne-NP' | 'en-US' | 'auto' = 'ne-NP';

  constructor(callbacks: SpeechEngineCallbacks = {}) {
    this.callbacks = callbacks;
    this.initRecognition();
  }

  public updateCallbacks(callbacks: SpeechEngineCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.currentLang === 'auto' ? 'ne-NP' : this.currentLang;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onListeningStateChange?.(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          this.callbacks.onTranscriptChange?.(text, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        // "no-speech" is common when user pauses, ignore silently
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
          this.callbacks.onError?.(`Mic: ${event.error}`);
        }
        this.isListening = false;
        this.callbacks.onListeningStateChange?.(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onListeningStateChange?.(false);
        this.stopMicAnalyser();
      };
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e);
    }
  }

  public setLanguage(lang: 'ne-NP' | 'en-US' | 'auto') {
    this.currentLang = lang;
    if (this.recognition) {
      this.recognition.lang = lang === 'auto' ? 'ne-NP' : lang;
    }
  }

  /**
   * Start listening to user voice with real-time waveform analysis
   */
  public async startListening(): Promise<boolean> {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        this.callbacks.onError?.('Speech recognition not supported in this browser.');
        return false;
      }
    }

    try {
      if (this.isListening) {
        this.recognition.stop();
      }

      // Configure language before start
      this.recognition.lang = this.currentLang === 'auto' ? 'ne-NP' : this.currentLang;
      this.recognition.start();

      // Start mic waveform frequency capture
      this.startMicAnalyser();
      return true;
    } catch (err: any) {
      console.warn('Could not start recognition:', err);
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.isListening = false;
    this.callbacks.onListeningStateChange?.(false);
    this.stopMicAnalyser();
  }

  /**
   * Setup AudioContext AnalyserNode for mic input to visualize the user's voice
   */
  private async startMicAnalyser() {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser);

      this.startFrequencyLoop();
    } catch {
      // User may decline mic audio visualization, recognition continues
    }
  }

  private stopMicAnalyser() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }

  private startFrequencyLoop() {
    if (!this.analyser) return;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);
      this.callbacks.onAudioFrequency?.(dataArray);

      if (this.isListening || this.isSpeaking) {
        this.animationFrameId = requestAnimationFrame(update);
      }
    };

    update();
  }

  /**
   * Find the most expressive female Nepali / South Asian / clear voice
   */
  public getBestFemaleVoice(language: 'ne' | 'en' | 'auto'): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Look for explicit Nepali voice
    const nepaliVoice = voices.find(v => v.lang.startsWith('ne') || v.name.toLowerCase().includes('nepali'));
    if (nepaliVoice && language !== 'en') return nepaliVoice;

    // 2. Look for Indian/Hindi female voice (has exact phonetic mapping for Devanagari/Nepali)
    const hindiFemale = voices.find(v => 
      (v.lang.startsWith('hi') || v.lang.includes('IN')) && 
      (v.name.toLowerCase().includes('female') || v.name.includes('Lekha') || v.name.includes('Kalpana') || v.name.includes('Neerja') || v.name.includes('Google हिन्दी'))
    );
    if (hindiFemale && language !== 'en') return hindiFemale;

    const anyHindi = voices.find(v => v.lang.startsWith('hi'));
    if (anyHindi && language !== 'en') return anyHindi;

    // 3. High-quality natural English female voice
    const femaleEnglish = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.includes('Samantha') || 
       v.name.includes('Zira') || 
       v.name.includes('Karen') || 
       v.name.includes('Moira') || 
       v.name.includes('Google UK English Female') ||
       v.name.includes('Google US English'))
    );
    if (femaleEnglish) return femaleEnglish;

    // 4. Any female voice or fallback first voice
    const anyFemale = voices.find(v => v.name.toLowerCase().includes('female'));
    return anyFemale || voices[0] || null;
  }

  /**
   * Speak response using Web Speech Synthesis with Chaite female characteristics
   */
  public speakWithWebSpeech(text: string, language: 'ne' | 'en' | 'auto' = 'auto'): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      this.stopSpeaking();

      // Clean text for speech
      const cleanText = text
        .replace(/[*_#`~[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      if (!cleanText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const isNepali = /[\u0900-\u097F]/.test(cleanText) || language === 'ne';

      utterance.rate = this.speakingRate;
      utterance.pitch = this.femalePitch; // Higher pitch for graceful female persona

      const voice = this.getBestFemaleVoice(isNepali ? 'ne' : 'en');
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = isNepali ? 'ne-NP' : 'en-US';
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.callbacks.onSpeakingStateChange?.(true);
        // Start synthetic frequency pulse for visualizer during speech
        this.startSimulatedFrequencyAnimation();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks.onSpeakingStateChange?.(false);
        this.stopMicAnalyser();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        this.isSpeaking = false;
        this.callbacks.onSpeakingStateChange?.(false);
        this.stopMicAnalyser();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Play server-rendered audio from Gemini TTS
   */
  public playAudioData(base64Data: string, mimeType: string = 'audio/wav'): Promise<void> {
    return new Promise((resolve) => {
      this.stopSpeaking();

      try {
        const audio = new Audio(`data:${mimeType};base64,${base64Data}`);
        this.currentAudioElement = audio;

        // Connect to AudioContext for live frequency visualization
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaElementSource(audio);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
          this.startFrequencyLoop();
        } catch {}

        audio.onplay = () => {
          this.isSpeaking = true;
          this.callbacks.onSpeakingStateChange?.(true);
        };

        audio.onended = () => {
          this.isSpeaking = false;
          this.callbacks.onSpeakingStateChange?.(false);
          this.currentAudioElement = null;
          this.stopMicAnalyser();
          resolve();
        };

        audio.onerror = () => {
          this.isSpeaking = false;
          this.callbacks.onSpeakingStateChange?.(false);
          this.currentAudioElement = null;
          this.stopMicAnalyser();
          resolve();
        };

        audio.play().catch(() => {
          this.isSpeaking = false;
          this.callbacks.onSpeakingStateChange?.(false);
          resolve();
        });
      } catch (err) {
        console.warn('Failed to play audio data:', err);
        resolve();
      }
    });
  }

  /**
   * Generates organic frequency wave animation when Web Speech API plays
   */
  private startSimulatedFrequencyAnimation() {
    const dummyData = new Uint8Array(32);
    let phase = 0;

    const loop = () => {
      if (!this.isSpeaking) return;
      phase += 0.15;
      for (let i = 0; i < dummyData.length; i++) {
        const val = Math.sin(phase + i * 0.4) * 0.5 + 0.5;
        const noise = (Math.random() - 0.5) * 0.2;
        dummyData[i] = Math.min(255, Math.max(20, Math.floor((val + noise) * 220)));
      }
      this.callbacks.onAudioFrequency?.(dummyData);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    this.isSpeaking = false;
    this.callbacks.onSpeakingStateChange?.(false);
    this.stopMicAnalyser();
  }
}
