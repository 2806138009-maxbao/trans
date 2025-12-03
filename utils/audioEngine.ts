// Luminous Lab - Haptic Audio Engine
// "Synesthesia" for the digital age.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private dragOsc: OscillatorNode | null = null;
  private dragGain: GainNode | null = null;
  private dragFilter: BiquadFilterNode | null = null;
  private isDragPlaying: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Initialize on first user interaction to comply with autoplay policies
  }

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.createNoiseBuffer();
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    } else {
        this.init();
    }
  }

  // 1. Intro: "Energy Injection"
  // Low hum rising + Crisp snap
  public playIntro() {
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Low Hum (Power up)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 2.0);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 3.0);

    // Crisp "Snap" (Injection) at t+2.0s (sync with visual growth?)
    // Let's make it immediate for the "Shift" effect or slightly delayed?
    // User said: "0s - 3s: Smith Chart is hero... 4s: Title floats".
    // "Opening: Extremely low freq hum + Crisp energy sound".
    
    // High frequency ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(800, t);
    ping.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    
    pingGain.gain.setValueAtTime(0, t);
    pingGain.gain.linearRampToValueAtTime(0.1, t + 0.05);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    ping.connect(pingGain);
    pingGain.connect(this.ctx.destination);
    ping.start(t);
    ping.stop(t + 0.5);
  }

  // 2. Drag: White noise with velocity
  public startDragSound() {
    this.resume();
    if (!this.ctx || !this.noiseBuffer || this.isDragPlaying) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 100; // Start low

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start();
    
    this.isDragPlaying = true;
    this.dragGain = gain;
    this.dragFilter = filter;

    // Keep reference to stop later
    // (We'll stop by disconnecting or gain=0, but ideally stop source)
    // For simplicity in this singleton, we assume one drag at a time.
    (this as any).dragSource = source;
  }

  public setDragVelocity(velocity: number) {
    if (!this.ctx || !this.dragGain || !this.dragFilter) return;
    
    // Map velocity (0 to ~50?) to audio params
    // Velocity is pixels per frame? 
    // Assume v ranges 0-20 roughly.
    
    const v = Math.min(Math.abs(velocity), 20);
    const normalizedV = v / 20;

    // Frequency: 100Hz -> 2000Hz
    const targetFreq = 100 + normalizedV * 1900;
    this.dragFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

    // Gain: 0 -> 0.1 (faint)
    const targetGain = normalizedV * 0.15;
    this.dragGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }

  public stopDragSound() {
    if (!this.ctx || !this.isDragPlaying) return;
    
    if (this.dragGain) {
      this.dragGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    
    setTimeout(() => {
      if ((this as any).dragSource) {
        (this as any).dragSource.stop();
        (this as any).dragSource.disconnect();
      }
      this.isDragPlaying = false;
      this.dragGain = null;
      this.dragFilter = null;
    }, 150);
  }

  // 3. Snap: "Thud" - Mechanical click
  // RAUNO-TIER: Micro-Variance to prevent "Machine Gun Effect"
  // Real-world impacts are never identical
  public playSnap() {
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Micro-Variance: ±5% random detune for frequency
    const freqDetune = 1 + (Math.random() * 0.1 - 0.05); // -5% to +5%
    const baseFreq = 80;
    const endFreq = 30;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * freqDetune, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq * freqDetune, t + 0.15);
    
    // Micro-Variance: ±5% random variation for gain
    const gainDetune = 1 + (Math.random() * 0.1 - 0.05); // -5% to +5%
    const baseGain = 0.3;
    
    gain.gain.setValueAtTime(baseGain * gainDetune, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 4. Tick: Short high-pitched click for scrubbing (5ms)
  private lastTickTime: number = 0;
  public playTick() {
    this.resume();
    if (!this.ctx) return;
    
    // Debounce: max 20 ticks per second
    const now = performance.now();
    if (now - this.lastTickTime < 50) return;
    this.lastTickTime = now;
    
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.005);
    
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.005);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.01);
  }

  // 5. Click: Mechanical click for component added
  public playClick() {
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Higher frequency "click"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
    
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // 6. Success: Chime for VSWR < 1.1 (Impedance Matched)
  public playSuccess() {
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Two-tone ascending chime
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)
    
    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.5);
    });
  }

  // 7. Error/Warning: Low tone
  public playWarning() {
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.setValueAtTime(100, t + 0.1);
    
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // 8. Undo sound
  public playUndo() {
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // ==========================================
  // SYNESTHESIA ENGINE (Impedance Sonification)
  // ==========================================
  
  private sonificationOsc: OscillatorNode | null = null;
  private sonificationGain: GainNode | null = null;
  
  // Inductive (+x): Low Frequency Rumble (Tremolo)
  private sonificationLFO: OscillatorNode | null = null;
  private sonificationLFOGain: GainNode | null = null;
  
  // Capacitive (-x): High Frequency Shimmer (FM Synthesis)
  private sonificationFM: OscillatorNode | null = null;
  private sonificationFMGain: GainNode | null = null;
  
  private isSonifying: boolean = false;

  public startSonification() {
    this.resume();
    if (!this.ctx || this.isSonifying) return;
    
    const t = this.ctx.currentTime;
    
    // 1. Carrier Oscillator (The "Soul" of the signal)
    this.sonificationOsc = this.ctx.createOscillator();
    this.sonificationOsc.type = 'sine';
    this.sonificationOsc.frequency.setValueAtTime(261.63, t); // Start at C4 (50Ω)
    
    // 2. Main Gain
    this.sonificationGain = this.ctx.createGain();
    this.sonificationGain.gain.setValueAtTime(0, t);
    this.sonificationGain.gain.linearRampToValueAtTime(0.15, t + 0.1); // Fade in
    
    // 3. Inductive LFO (Tremolo) setup
    this.sonificationLFO = this.ctx.createOscillator();
    this.sonificationLFO.type = 'sine';
    this.sonificationLFO.frequency.setValueAtTime(15, t); // 15Hz rumble
    
    this.sonificationLFOGain = this.ctx.createGain();
    this.sonificationLFOGain.gain.value = 0; // Starts clean
    
    // LFO modulates the Main Gain
    // Signal flow: LFO -> LFO_Gain -> Main_Gain.gain
    this.sonificationLFO.connect(this.sonificationLFOGain);
    this.sonificationLFOGain.connect(this.sonificationGain.gain);
    
    // 4. Capacitive FM (Shimmer) setup
    this.sonificationFM = this.ctx.createOscillator();
    this.sonificationFM.type = 'sawtooth'; // Richer harmonic content for "screech"
    this.sonificationFM.frequency.setValueAtTime(523.25, t); // 2x Carrier
    
    this.sonificationFMGain = this.ctx.createGain();
    this.sonificationFMGain.gain.value = 0; // Starts clean
    
    // FM modulates the Carrier Frequency
    // Signal flow: FM -> FM_Gain -> Carrier.frequency
    this.sonificationFM.connect(this.sonificationFMGain);
    this.sonificationFMGain.connect(this.sonificationOsc.frequency);
    
    // 5. Connect to Output
    this.sonificationOsc.connect(this.sonificationGain);
    this.sonificationGain.connect(this.ctx.destination);
    
    // Start everything
    this.sonificationOsc.start(t);
    this.sonificationLFO.start(t);
    this.sonificationFM.start(t);
    
    this.isSonifying = true;
  }

  public updateSonification(r: number, x: number) {
    if (!this.ctx || !this.isSonifying || !this.sonificationOsc) return;
    
    const t = this.ctx.currentTime;
    const rampTime = 0.05; // Fast response
    
    // --- 1. Resistance (R) -> Pitch ---
    // Center (50Ω, r=1) = C4 (261.63 Hz)
    // Range: r=0 (Short) -> Low C3, r=High -> High C6
    // Use log mapping for natural pitch perception
    // Clamp r to avoid Infinity/Zero issues
    const safeR = Math.max(0.05, Math.min(20, r));
    const baseFreq = 261.63;
    // Log2(r) gives octaves relative to center
    const octaves = Math.log2(safeR); 
    const targetFreq = baseFreq * Math.pow(2, octaves * 0.5); // 0.5 scaling to keep it within comfortable range
    
    // Apply pitch (base frequency)
    // Note: FM modulation adds to this value
    this.sonificationOsc.frequency.setTargetAtTime(targetFreq, t, rampTime);
    
    // --- 2. Reactance (X) -> Texture ---
    
    // Inductive (+x): Low Frequency Rumble (Tremolo)
    if (x > 0.05) {
      // x goes from 0 to ~5+
      const intensity = Math.min(1, x / 3);
      
      // LFO Rate: 10Hz (slow rumble) -> 30Hz (fast flutter)
      this.sonificationLFO!.frequency.setTargetAtTime(10 + intensity * 20, t, rampTime);
      
      // LFO Depth: 0 -> 0.5 (heavy tremolo)
      this.sonificationLFOGain!.gain.setTargetAtTime(intensity * 0.1, t, rampTime);
      
      // Kill FM
      this.sonificationFMGain!.gain.setTargetAtTime(0, t, rampTime);
    } 
    // Capacitive (-x): High Frequency Screech (FM)
    else if (x < -0.05) {
      const intensity = Math.min(1, Math.abs(x) / 3);
      
      // FM Ratio: Keep it non-integer for metallic sound? Or harmonic?
      // Let's track the carrier frequency for ratio
      const fmFreq = targetFreq * 2.5; // 2.5 ratio = metallic
      this.sonificationFM!.frequency.setTargetAtTime(fmFreq, t, rampTime);
      
      // FM Depth: 0 -> 500Hz deviation
      this.sonificationFMGain!.gain.setTargetAtTime(intensity * 300, t, rampTime);
      
      // Kill LFO
      this.sonificationLFOGain!.gain.setTargetAtTime(0, t, rampTime);
    } 
    // Near Resonance (x ~ 0)
    else {
      // Clean sound
      this.sonificationLFOGain!.gain.setTargetAtTime(0, t, rampTime);
      this.sonificationFMGain!.gain.setTargetAtTime(0, t, rampTime);
    }
    
    // --- 3. Match Feedback (The "Sweet Spot") ---
    // If very close to 1+j0, boost volume slightly and ensure purity
    const isMatched = Math.abs(r - 1) < 0.1 && Math.abs(x) < 0.1;
    if (isMatched) {
      // "Lock-in" effect
      this.sonificationOsc.frequency.setTargetAtTime(261.63, t, 0.02); // Snap to C4
      this.sonificationGain!.gain.setTargetAtTime(0.2, t, 0.1); // Slight boost
    } else {
      this.sonificationGain!.gain.setTargetAtTime(0.15, t, 0.1); // Normal level
    }
  }

  public stopSonification() {
    if (!this.ctx || !this.isSonifying) return;
    
    const t = this.ctx.currentTime;
    
    // Fade out
    if (this.sonificationGain) {
      this.sonificationGain.gain.setTargetAtTime(0, t, 0.1);
    }
    
    // Cleanup after fade
    setTimeout(() => {
      this.sonificationOsc?.stop();
      this.sonificationLFO?.stop();
      this.sonificationFM?.stop();
      
      this.sonificationOsc?.disconnect();
      this.sonificationLFO?.disconnect();
      this.sonificationFM?.disconnect();
      this.sonificationGain?.disconnect();
      
      this.sonificationOsc = null;
      this.sonificationLFO = null;
      this.sonificationFM = null;
      this.sonificationGain = null;
      this.sonificationLFOGain = null;
      this.sonificationFMGain = null;
      
      this.isSonifying = false;
    }, 150);
  }
}

export const audio = new AudioEngine();
