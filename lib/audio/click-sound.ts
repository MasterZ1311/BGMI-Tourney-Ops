// lib/audio/click-sound.ts
// Official BGMI UI Tactical Audio Controller

class SoundController {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isLoaded = false;
  private isMuted = false;
  private fallbackAudio: HTMLAudioElement | null = null;
  private readonly volume = 0.65;
  private readonly audioSrc = '/BGMI_Click.mp3';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('bgmi_ui_sound_muted');
        this.isMuted = savedMute === 'true';
      } catch {
        this.isMuted = false;
      }
    }
  }

  public init() {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch {
      // AudioContext unavailable
    }

    // Preload audio buffer via fetch for zero-latency Web Audio playback
    fetch(this.audioSrc)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (this.audioContext) {
          return this.audioContext.decodeAudioData(arrayBuffer).then((decoded) => {
            this.audioBuffer = decoded;
            this.isLoaded = true;
          });
        } else {
          this.initFallback();
        }
      })
      .catch(() => {
        this.initFallback();
      });
  }

  private initFallback() {
    try {
      this.fallbackAudio = new Audio(this.audioSrc);
      this.fallbackAudio.preload = 'auto';
      this.fallbackAudio.volume = this.volume;
      this.isLoaded = true;
    } catch {
      // Fallback failed
    }
  }

  public play() {
    if (this.isMuted || typeof window === 'undefined') return;

    // Web Audio API path (Instant hardware buffer playback)
    if (this.audioContext && this.audioBuffer) {
      try {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);
        return;
      } catch {
        // Fall back to HTMLAudioElement if Web Audio fails
      }
    }

    // HTMLAudioElement fallback path
    try {
      if (!this.fallbackAudio) {
        this.fallbackAudio = new Audio(this.audioSrc);
        this.fallbackAudio.volume = this.volume;
      }
      this.fallbackAudio.currentTime = 0;
      const playPromise = this.fallbackAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay protection before first user interaction
        });
      }
    } catch {
      // Silently catch audio playback errors
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bgmi_ui_sound_muted', String(this.isMuted));
        window.dispatchEvent(
          new CustomEvent('bgmi-sound-mute-change', { detail: { isMuted: this.isMuted } })
        );
      } catch {
        // Ignore localStorage error
      }
    }
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}

export const clickSound = new SoundController();

export function playClickSound() {
  clickSound.play();
}
