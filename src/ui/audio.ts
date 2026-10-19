export class Sound {
  private context?: AudioContext;
  private master?: GainNode;
  private isEnabled = false;
  get enabled(): boolean {
    return this.isEnabled;
  }
  set enabled(value: boolean) {
    this.isEnabled = value;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        value ? 1 : 0,
        this.context.currentTime,
        0.015,
      );
  }
  play(event: "light" | "ready" | "home" | "achievement"): boolean {
    if (!this.enabled) return true;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
      }
      void this.context.resume().catch(() => {});
      const notes = {
        light: [523.25, 783.99],
        ready: [659.25, 783.99],
        home: [523.25, 659.25, 783.99, 1046.5],
        achievement: [783.99, 1046.5, 1318.5],
      }[event];
      notes.forEach((hz, i) => {
        const osc = this.context!.createOscillator(),
          gain = this.context!.createGain();
        const when = this.context!.currentTime + i * 0.13;
        osc.type = "sine";
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(0.065, when + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.7);
        osc.connect(gain);
        gain.connect(this.master!);
        osc.start(when);
        osc.stop(when + 0.72);
      });
      return true;
    } catch {
      return false;
    }
  }
}
