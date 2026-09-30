class AudioEngine {
  private ctx: AudioContext | null = null
  private audioBuffers = new Map<string, AudioBuffer>()
  private currentSources = new Map<string, AudioBufferSourceNode>()

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  // 解析并生成简化的波形采样数组 (例如 120 个点)
  async loadAudio(url: string, samples = 120): Promise<{ buffer: AudioBuffer; waveform: number[] }> {
    const cached = this.audioBuffers.get(url)
    if (cached) {
      return { buffer: cached, waveform: this.extractWaveform(cached, samples) }
    }

    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const ctx = this.getContext()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    this.audioBuffers.set(url, buffer)

    const waveform = this.extractWaveform(buffer, samples)
    return { buffer, waveform }
  }

  private extractWaveform(buffer: AudioBuffer, samples: number): number[] {
    const rawData = buffer.getChannelData(0)
    const blockSize = Math.floor(rawData.length / samples)
    const waveform: number[] = []

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i
      let sum = 0
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j] || 0)
      }
      waveform.push(Math.min(1, (sum / blockSize) * 2.5))
    }
    return waveform
  }

  // 在指定的图层和时间开始播放
  playLayer(layerId: string, url: string, startOffset: number, duration: number) {
    this.stopLayer(layerId)
    const buffer = this.audioBuffers.get(url)
    if (!buffer) return

    const ctx = this.getContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gainNode = ctx.createGain()
    gainNode.gain.value = 1.0

    source.connect(gainNode)
    gainNode.connect(ctx.destination)

    const when = ctx.currentTime
    const offset = Math.max(0, startOffset)
    const playDur = Math.max(0, duration - offset)

    if (offset < buffer.duration && playDur > 0) {
      source.start(when, offset, playDur)
      this.currentSources.set(layerId, source)
    }
  }

  stopLayer(layerId: string) {
    const source = this.currentSources.get(layerId)
    if (source) {
      try {
        source.stop()
        source.disconnect()
      } catch {
        // ignore already stopped
      }
      this.currentSources.delete(layerId)
    }
  }

  stopAll() {
    for (const [id] of this.currentSources) {
      this.stopLayer(id)
    }
  }

  // 生成默认演示节奏波形
  generateMockWaveform(samples = 100): number[] {
    const wave: number[] = []
    for (let i = 0; i < samples; i++) {
      // 模拟有规律的鼓点和旋律波形
      const beat = i % 8 === 0 ? 0.9 : i % 4 === 0 ? 0.65 : 0.25 + 0.3 * Math.sin(i * 0.4)
      wave.push(Math.max(0.15, Math.min(1, beat)))
    }
    return wave
  }
}

export const audioEngine = new AudioEngine()
