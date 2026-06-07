// ═══════════════════════════════════════════════════
//  WEB AUDIO SYNTHESIZER
//  Generates audio in the browser from a track's bpm / key /
//  mood / genre. Nothing is downloaded or licensed.
// ═══════════════════════════════════════════════════
export class Synth {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.track = null;
    this.gainNode = null;
    this.analyser = null;
    this._scheduleId = null;
    this._vol = 0.7;
    this.onended = null;
    this.ontime = null;
  }

  _init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _keyFreq(key) {
    const map = { 'C':261.63,'Cm':261.63,'D':293.66,'Dm':293.66,'E':329.63,'Em':329.63,
      'F':349.23,'Fm':349.23,'G':392,'Gm':392,'A':440,'Am':440,'Bb':466.16,'Bm':493.88 };
    return map[key] || 261.63;
  }

  _chord(root, minor) {
    const third = minor ? root * 1.1892 : root * 1.2599;
    const fifth = root * 1.4983;
    return [root, third, fifth];
  }

  load(track) {
    this.stop();
    this.track = track;
    this.pauseOffset = 0;
  }

  play() {
    if (!this.track) return;
    this._init();
    const t = this.track;
    const ctx = this.ctx;
    const key = t.music_key || t.key || 'Am';
    const isMinor = key.includes('m');
    const root = this._keyFreq(key);
    const bps = (t.bpm || 110) / 60;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.analyser);

    this.nodes = [this.gainNode];
    this.startTime = ctx.currentTime - this.pauseOffset;
    this.isPlaying = true;

    const duration = t.duration;
    const beatLen = 1 / bps;

    // Bass line
    const bassFreqs = this._chord(root / 2, isMinor);
    for (let beat = 0; beat < duration * bps; beat++) {
      const time = this.startTime + beat * beatLen;
      if (time < ctx.currentTime) continue;
      const freq = bassFreqs[beat % bassFreqs.length];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = t.genre === 'electronic' ? 'sawtooth' : t.genre === 'jazz' ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.18, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + beatLen * 0.8);
      osc.connect(g); g.connect(this.gainNode);
      osc.start(time); osc.stop(time + beatLen);
      this.nodes.push(osc, g);
    }

    // Melody — every 2 beats (skip for calm moods)
    const melFreqs = [...this._chord(root, isMinor), root * 2];
    if (t.mood !== 'calm') {
      for (let beat = 0; beat < duration * bps; beat += 2) {
        const time = this.startTime + beat * beatLen;
        if (time < ctx.currentTime) continue;
        const freq = melFreqs[Math.floor(beat/2) % melFreqs.length] * (t.genre === 'electronic' ? 2 : 1.5);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = t.genre === 'rock' ? 'square' : 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.08, time + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, time + beatLen * 1.6);
        osc.connect(g); g.connect(this.gainNode);
        osc.start(time); osc.stop(time + beatLen * 2);
        this.nodes.push(osc, g);
      }
    }

    // Pad / atmosphere — long sustained chords
    const padFreqs = this._chord(root, isMinor);
    const padLen = beatLen * 8;
    for (let i = 0; i * padLen < duration; i++) {
      const time = this.startTime + i * padLen;
      if (time < ctx.currentTime) continue;
      padFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * (t.genre === 'ambient' ? 1 : 0.75);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.05, time + padLen * 0.2);
        g.gain.linearRampToValueAtTime(0.05, time + padLen * 0.8);
        g.gain.linearRampToValueAtTime(0, time + padLen);
        osc.connect(g); g.connect(this.gainNode);
        osc.start(time); osc.stop(time + padLen);
        this.nodes.push(osc, g);
      });
    }

    // Fade in master, restore volume
    this.gainNode.gain.linearRampToValueAtTime(this._vol, ctx.currentTime + 0.5);

    this._scheduleId = setInterval(() => {
      if (!this.isPlaying) return;
      const elapsed = ctx.currentTime - this.startTime;
      this.pauseOffset = elapsed;
      if (this.ontime) this.ontime(elapsed, t.duration);
      if (elapsed >= t.duration) {
        this.isPlaying = false;
        clearInterval(this._scheduleId);
        if (this.onended) this.onended();
      }
    }, 200);
  }

  pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.ctx.currentTime - this.startTime;
    this._teardown();
  }

  stop() { this.pauseOffset = 0; this._teardown(); }

  seek(pct) {
    if (!this.track) return;
    this.pauseOffset = pct * this.track.duration;
    if (this.isPlaying) { this._teardown(); this.play(); }
  }

  setVolume(v) {
    this._vol = v;
    if (this.gainNode) this.gainNode.gain.value = v;
  }

  _teardown() {
    this.isPlaying = false;
    clearInterval(this._scheduleId);
    this.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(e){} });
    this.nodes = [];
    this.gainNode = null;
  }

  get currentTime() { return this.isPlaying ? (this.ctx?.currentTime - this.startTime) : this.pauseOffset; }
  get duration()    { return this.track?.duration || 0; }

  getWaveform() {
    if (!this.analyser) return new Uint8Array(32).fill(0);
    const d = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(d);
    return d;
  }
}
