import { onUnmounted, ref, watch } from 'vue'
import type { Preferences } from '../../preferences'
import type { SoundId } from './soundTracks'

export function useBackgroundAudio(preferences: Readonly<Preferences>) {
  const playing = ref(false)
  const audioMessage = ref('')
  const breathingSound = 'breath-lofi'
  let background: HTMLAudioElement | undefined
  let activeSound: SoundId = 'off'
  let playbackRequest = 0
  let audioContext: AudioContext | undefined
  let backgroundSource: MediaElementAudioSourceNode | null = null
  let backgroundGain: GainNode | null = null
  let breathExpansion: number | null = null
  let breathingPaused = false

  function pauseBackground() {
    playbackRequest++
    background?.pause()
  }

  function mute() {
    pauseBackground()
    playing.value = false
  }

  function disconnectSound() {
    backgroundSource?.disconnect()
    backgroundGain?.disconnect()
    backgroundSource = null
    backgroundGain = null
  }

  function connectBreathingSound(track: HTMLAudioElement) {
    if (!('AudioContext' in window)) return
    try {
      audioContext ??= new window.AudioContext()
      const gain = audioContext.createGain()
      gain.gain.value = 0
      backgroundSource = audioContext.createMediaElementSource(track)
      backgroundSource.connect(gain).connect(audioContext.destination)
      backgroundGain = gain
    } catch {
      // Use the media element's volume when a Web Audio graph is unavailable.
    }
  }

  function setSoundVolume() {
    if (!background) return
    const swell = activeSound === breathingSound ? 0.6 + 0.4 * (breathExpansion ?? 0.3) : 1
    const volume = (preferences.volume / 100) * swell
    if (backgroundGain && audioContext) {
      backgroundGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.08)
    } else {
      background.volume = volume
    }
  }

  function setBreathExpansion(expansion: number | null) {
    breathExpansion = expansion
    if (activeSound === breathingSound && playing.value) setSoundVolume()
  }

  async function startBackground() {
    if (!background) return
    const request = ++playbackRequest
    try {
      const resume =
        backgroundGain && audioContext?.state !== 'running' ? audioContext?.resume() : null
      await Promise.all([background.play(), resume])
    } catch {
      if (request === playbackRequest) {
        mute()
        audioMessage.value = 'Sound couldn’t start. Try again or choose another sound.'
      }
    }
  }

  function setBreathingPaused(paused: boolean) {
    breathingPaused = paused
    if (activeSound !== breathingSound || !playing.value) return
    if (paused) pauseBackground()
    else startBackground()
  }

  async function playSound(id: SoundId = preferences.sound) {
    audioMessage.value = ''
    if (id === 'off') {
      mute()
      return
    }
    if (activeSound !== id) {
      mute()
      disconnectSound()
      background = new Audio(
        globalThis.quietMomentOffline?.sounds[id] || `${import.meta.env.BASE_URL}audio/${id}.wav`,
      )
      background.loop = true
      activeSound = id
      if (id === breathingSound) connectBreathingSound(background)
    }
    setSoundVolume()
    playing.value = true
    if (id !== breathingSound || !breathingPaused) return startBackground()
  }

  watch(() => preferences.volume, setSoundVolume)
  onUnmounted(() => {
    mute()
    disconnectSound()
    if (audioContext && audioContext.state !== 'closed') void audioContext.close()
  })

  return { playing, audioMessage, playSound, setBreathExpansion, setBreathingPaused }
}
