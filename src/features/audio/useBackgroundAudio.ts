import { onUnmounted, ref, watch } from 'vue'
import type { Preferences } from '../settings/sessionPreferences'
import { createBreathingMusic } from './breathingMusic.ts'
import type { MusicSession } from './breathingMusic'
import { breathingArrangements, isBreathingSound } from './soundTracks.ts'
import type { SoundId } from './soundTracks'

export function useBackgroundAudio(preferences: Readonly<Preferences>) {
  const playing = ref(false)
  const audioMessage = ref('')
  let background: HTMLAudioElement | undefined
  let activeSound: SoundId = 'off'
  let playbackRequest = 0
  let context: AudioContext | undefined
  let music: ReturnType<typeof createBreathingMusic> | undefined
  let breathingSession: MusicSession | null = null

  function mute() {
    playbackRequest++
    background?.pause()
    music?.stop()
    playing.value = false
  }

  function failedPlayback() {
    mute()
    audioMessage.value = 'Sound couldn’t start. Try again or choose another sound.'
  }

  function setVolume() {
    const volume = preferences.volume / 100
    if (background) background.volume = volume
    music?.setVolume(volume)
  }

  function startMusic() {
    if (!playing.value || !breathingSession || context?.state !== 'running') return
    const arrangement = breathingArrangements.find(({ id }) => id === activeSound)
    if (arrangement) music?.start(breathingSession, arrangement)
  }

  async function resumeMusic(audioContext: AudioContext) {
    const request = playbackRequest
    try {
      if (audioContext.state !== 'running') await audioContext.resume()
      if (request === playbackRequest) startMusic()
    } catch {
      if (request === playbackRequest) failedPlayback()
    }
  }

  function handleContextState() {
    if (context?.state === 'running') {
      void resumeMusic(context)
    } else {
      music?.stop()
    }
  }

  function setBreathingSession(session: MusicSession | null) {
    music?.stop()
    breathingSession = session
    if (session && context && playing.value && isBreathingSound(activeSound)) {
      void resumeMusic(context)
    }
  }

  async function playSound(id: SoundId) {
    audioMessage.value = ''
    if (id === 'off') {
      mute()
      return
    }

    if (activeSound !== id) {
      mute()
      background = undefined
      activeSound = id
    }

    const request = ++playbackRequest
    try {
      if (isBreathingSound(id)) {
        if (!context) {
          context = new window.AudioContext()
          context.addEventListener('statechange', handleContextState)
        }
        music ??= createBreathingMusic(context)
        setVolume()
        playing.value = true
        await resumeMusic(context)
      } else {
        background ??= new Audio(
          globalThis.quietMomentOffline?.sounds[id] || `${import.meta.env.BASE_URL}audio/${id}.wav`,
        )
        background.loop = true
        setVolume()
        playing.value = true
        await background.play()
      }
    } catch {
      if (request === playbackRequest) failedPlayback()
    }
  }

  watch(() => preferences.volume, setVolume)
  onUnmounted(() => {
    mute()
    context?.removeEventListener('statechange', handleContextState)
    if (context && context.state !== 'closed') void context.close()
  })

  return {
    playing,
    audioMessage,
    playSound,
    setBreathingSession,
    readBreathingElapsed: () => music?.readElapsed() ?? null,
  }
}
