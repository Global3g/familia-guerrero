const audioCtx = typeof AudioContext !== 'undefined' ? new AudioContext() : null

function playTone(frequency = 440, duration = 0.15, volume = 0.05) {
  if (!audioCtx) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = frequency
    osc.type = 'sine'
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch (e) {}
}

export const sounds = {
  save: () => { playTone(523, 0.1, 0.04); setTimeout(() => playTone(659, 0.1, 0.04), 100) },
  delete: () => playTone(330, 0.2, 0.03),
  click: () => playTone(880, 0.05, 0.02),
  candle: () => { playTone(392, 0.3, 0.03); setTimeout(() => playTone(440, 0.3, 0.03), 200) },
}

export default sounds
