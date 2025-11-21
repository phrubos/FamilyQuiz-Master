// Sound effects manager for FamilyQuiz Master

type SoundType = 'click' | 'correct' | 'wrong' | 'tick' | 'victory' | 'whoosh' | 'countdown' | 'streak';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Generate tones programmatically (no external files needed)
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = this.volume) {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Silent fail if audio context not available
    }
  }

  private playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine') {
    frequencies.forEach(freq => this.playTone(freq, duration, type, this.volume / frequencies.length));
  }

  play(sound: SoundType) {
    if (this.isMuted) return;

    switch (sound) {
      case 'click':
        // Short click sound
        this.playTone(800, 0.05, 'square', this.volume * 0.3);
        break;

      case 'correct':
        // Ascending happy tone
        setTimeout(() => this.playTone(523, 0.15, 'sine'), 0);    // C5
        setTimeout(() => this.playTone(659, 0.15, 'sine'), 100);  // E5
        setTimeout(() => this.playTone(784, 0.3, 'sine'), 200);   // G5
        break;

      case 'wrong':
        // Descending sad tone
        this.playTone(311, 0.3, 'sawtooth', this.volume * 0.3);   // Eb4
        setTimeout(() => this.playTone(233, 0.4, 'sawtooth', this.volume * 0.3), 150); // Bb3
        break;

      case 'tick':
        // Timer tick
        this.playTone(1000, 0.05, 'square', this.volume * 0.2);
        break;

      case 'countdown':
        // Urgent countdown beep
        this.playTone(880, 0.1, 'square', this.volume * 0.4);
        break;

      case 'victory':
        // Triumphant fanfare
        setTimeout(() => this.playChord([523, 659, 784], 0.2), 0);     // C major
        setTimeout(() => this.playChord([587, 740, 880], 0.2), 200);   // D major
        setTimeout(() => this.playChord([659, 784, 988], 0.2), 400);   // E major-ish
        setTimeout(() => this.playChord([784, 988, 1175], 0.5), 600);  // G major high
        break;

      case 'whoosh':
        // Screen transition whoosh
        const ctx = this.getContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;

      case 'streak':
        // Exciting streak sound (higher pitched with each use)
        setTimeout(() => this.playTone(698, 0.1, 'sine'), 0);    // F5
        setTimeout(() => this.playTone(880, 0.1, 'sine'), 80);   // A5
        setTimeout(() => this.playTone(1047, 0.15, 'sine'), 160); // C6
        break;
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  toggle(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
