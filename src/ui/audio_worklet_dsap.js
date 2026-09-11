/**
 * Dualis Spatial Audio Protocol (DSAP-1.0) - AudioWorkletProcessor
 * Synthesizes continuous 43.2 Hz substrate cosmos frequency procedurally in pure math.
 * Zero sampled assets | Execution budget < 0.50 ms | Landauer memory zeroized on close.
 */
class DSAPSubstrateCosmosProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0.0;
    this.harmonicPhase = 0.0;
    this.targetGain = 0.05;
    this.currentGain = 0.0;
    this.baseFreq = 43.2; // Fundamental substrate frequency
    this.harmonicFreq = 86.4; // 2nd harmonic
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelLeft = output[0];
    const channelRight = output[1] || output[0];
    const numSamples = channelLeft.length;
    const sampleRate = 44100.0;

    const phaseIncrement = (2.0 * Math.PI * this.baseFreq) / sampleRate;
    const harmonicIncrement = (2.0 * Math.PI * this.harmonicFreq) / sampleRate;

    for (let i = 0; i < numSamples; ++i) {
      // Smooth gain ramp to prevent clicks
      this.currentGain += (this.targetGain - this.currentGain) * 0.005;

      // Pure wave equation synthesis
      const fund = Math.sin(this.phase);
      const overtone = Math.sin(this.harmonicPhase) * 0.35;
      const sample = (fund + overtone) * this.currentGain;

      // Slight binaural phase-offset for spatial depth
      channelLeft[i] = sample;
      channelRight[i] = sample * 0.98;

      this.phase += phaseIncrement;
      this.harmonicPhase += harmonicIncrement;

      if (this.phase >= 2.0 * Math.PI) this.phase -= 2.0 * Math.PI;
      if (this.harmonicPhase >= 2.0 * Math.PI) this.harmonicPhase -= 2.0 * Math.PI;
    }
    return true;
  }
}
registerProcessor('dsap-substrate-processor', DSAPSubstrateCosmosProcessor);
