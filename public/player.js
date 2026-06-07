// ═══════════════════════════════════════════════════
//  PLAYER — plays a real audio file when the track has one
//  (track.audio), and falls back to the Web Audio synthesizer
//  for tracks without a file. Exposes the same interface the
//  app used before, so the rest of the code is unchanged.
// ═══════════════════════════════════════════════════
import { Synth } from './synth.js';

export class Player {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.synth = new Synth();
    this.track = null;
    this.mode = 'file';        // 'file' | 'synth'
    this._vol = 0.7;
    this.ontime = null;
    this.onended = null;

    // Web Audio graph for the file player's visualizer
    this.ctx = null; this.analyser = null; this.srcNode = null;

    this.audio.addEventListener('timeupdate', () => {
      if (this.mode === 'file') this.ontime?.(this.audio.currentTime, this.audio.duration || this.track?.duration || 0);
    });
    this.audio.addEventListener('ended', () => { if (this.mode === 'file') this.onended?.(); });

    // Mirror the synth's callbacks through the same handlers
    this.synth.ontime = (cur, dur) => { if (this.mode === 'synth') this.ontime?.(cur, dur); };
    this.synth.onended = () => { if (this.mode === 'synth') this.onended?.(); };
  }

  _initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.srcNode = this.ctx.createMediaElementSource(this.audio);
      this.srcNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  load(track) {
    this.stop();
    this.track = track;
    this.mode = track && track.audio ? 'file' : 'synth';
    if (this.mode === 'file') {
      this.audio.src = track.audio;
      this.audio.load();
    } else {
      this.synth.load(track);
    }
  }

  play() {
    if (!this.track) return;
    if (this.mode === 'file') {
      // Start playback first (guaranteed audio), then wire up the
      // visualizer best-effort so a Web Audio hiccup can't mute the song.
      this.audio.volume = this._vol;
      const p = this.audio.play();
      if (p && p.catch) p.catch(() => {});
      try { this._initCtx(); } catch {}
    } else {
      this.synth.play();
      this.synth.setVolume(this._vol);
    }
  }

  pause() {
    if (this.mode === 'file') this.audio.pause();
    else this.synth.pause();
  }

  stop() {
    try {
      this.audio.pause();
      this.audio.currentTime = 0;
    } catch {}
    this.synth.stop();
  }

  seek(pct) {
    pct = Math.max(0, Math.min(1, pct));
    if (this.mode === 'file') {
      const dur = this.audio.duration || this.track?.duration || 0;
      if (dur) this.audio.currentTime = pct * dur;
    } else {
      this.synth.seek(pct);
    }
  }

  setVolume(v) {
    this._vol = v;
    this.audio.volume = v;
    this.synth.setVolume(v);
  }

  get isPlaying() { return this.mode === 'file' ? !this.audio.paused && !this.audio.ended : this.synth.isPlaying; }
  get currentTime() { return this.mode === 'file' ? this.audio.currentTime : this.synth.currentTime; }
  get duration() { return this.mode === 'file' ? (this.audio.duration || this.track?.duration || 0) : this.synth.duration; }

  getWaveform() {
    if (this.mode === 'file') {
      if (!this.analyser) return new Uint8Array(32).fill(0);
      const d = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(d);
      return d;
    }
    return this.synth.getWaveform();
  }
}
