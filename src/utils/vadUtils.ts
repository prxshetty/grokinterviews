// Dynamic import to prevent SSR issues
let MicVAD: any = null;

export interface VADConfig {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechPause?: () => void; // Called immediately when speech detection ends
  onVADMisfire?: () => void;
  positiveSpeechThreshold?: number;
  negativeSpeechThreshold?: number;
  preSpeechPadFrames?: number;
  redemptionFrames?: number;
  frameSamples?: number;
  minSpeechFrames?: number;
  submitUserSpeechOnPause?: boolean;
}

export class VoiceActivityDetector {
  private vad: any = null;
  private isInitialized = false;
  private isListening = false;
  private config: VADConfig;
  private silenceTimer: NodeJS.Timeout | null = null;
  private readonly SILENCE_TIMEOUT = 2500; // 2.5 seconds of silence before stopping

  constructor(config: VADConfig = {}) {
    this.config = {
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.35,
      preSpeechPadFrames: 1,
      redemptionFrames: 8,
      frameSamples: 1536,
      minSpeechFrames: 4,
      submitUserSpeechOnPause: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🎯 Initializing Voice Activity Detector...');

      // Dynamic import to prevent SSR issues
      if (!MicVAD && typeof window !== 'undefined') {
        const vadModule = await import('@ricky0123/vad-web');
        MicVAD = vadModule.MicVAD;
      }

      if (!MicVAD) {
        throw new Error('VAD not available in this environment');
      }

      this.vad = await MicVAD.new({
        positiveSpeechThreshold: this.config.positiveSpeechThreshold!,
        negativeSpeechThreshold: this.config.negativeSpeechThreshold!,
        preSpeechPadFrames: this.config.preSpeechPadFrames!,
        redemptionFrames: this.config.redemptionFrames!,
        frameSamples: this.config.frameSamples!,
        minSpeechFrames: this.config.minSpeechFrames!,
        submitUserSpeechOnPause: this.config.submitUserSpeechOnPause!,
        onSpeechStart: () => {
          this.clearSilenceTimer();
          this.config.onSpeechStart?.();
        },
        onSpeechEnd: (_audio: Float32Array) => {
          // Call onSpeechPause immediately when speech detection ends
          this.config.onSpeechPause?.();
          this.startSilenceTimer();
          // Note: We don't immediately call onSpeechEnd here
          // We wait for the silence timeout to ensure the user is truly done
        },
        onVADMisfire: () => {
          console.log('⚠️ VAD misfire detected');
          this.config.onVADMisfire?.();
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize VAD:', error);
      throw new Error('Failed to initialize Voice Activity Detector');
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.vad || this.isListening) return;

    try {
      this.vad.start();
      this.isListening = true;
    } catch (error) {
      console.error('❌ Failed to start VAD:', error);
      throw new Error('Failed to start Voice Activity Detector');
    }
  }

  async pause(): Promise<void> {
    if (!this.vad || !this.isListening) return;

    try {
      console.log('⏸️ Pausing VAD listening...');
      this.vad.pause();
      this.isListening = false;
      this.clearSilenceTimer();
    } catch (error) {
      console.error('❌ Failed to pause VAD:', error);
    }
  }

  async resume(): Promise<void> {
    if (!this.vad || this.isListening) return;

    try {
      this.vad.start();
      this.isListening = true;
    } catch (error) {
      console.error('❌ Failed to resume VAD:', error);
    }
  }

  async stop(): Promise<void> {
    if (!this.vad || !this.isListening) return;

    try {
      this.vad.pause();
      this.isListening = false;
      this.clearSilenceTimer();
    } catch (error) {
      console.error('❌ Failed to stop VAD:', error);
    }
  }

  destroy(): void {
    if (this.vad) {
      this.vad.destroy();
      this.vad = null;
    }
    this.clearSilenceTimer();
    this.isInitialized = false;
    this.isListening = false;
  }

  private startSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      console.log('⏰ Silence timeout reached - user finished speaking');
      this.config.onSpeechEnd?.();
    }, this.SILENCE_TIMEOUT);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  get isActive(): boolean {
    return this.isListening;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  // Update configuration
  updateConfig(newConfig: Partial<VADConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): VADConfig {
    return { ...this.config };
  }
}

// Utility function to check if VAD is supported
export function isVADSupported(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      'MediaRecorder' in window &&
      'getUserMedia' in navigator.mediaDevices &&
      'AudioContext' in window
    );
  } catch {
    return false;
  }
}

// Utility function to create a VAD instance with default config
export function createVAD(config?: VADConfig): VoiceActivityDetector {
  return new VoiceActivityDetector(config);
}