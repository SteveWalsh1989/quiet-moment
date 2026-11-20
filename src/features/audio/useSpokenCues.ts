import { onUnmounted, ref, watch } from 'vue'
import type { Preferences } from '../../preferences'
import { breathingCues } from '../breathing/breathingTiming'
import type { BreathingPhaseName } from '../breathing/breathingTiming'

export function useSpokenCues(preferences: Readonly<Preferences>) {
  const voiceMessage = ref('')
  const voiceSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  let voiceCue: SpeechSynthesisUtterance | null = null

  function stopVoice() {
    if (voiceCue && voiceSupported) window.speechSynthesis.cancel()
    voiceCue = null
  }

  function speak(text: string) {
    if (!voiceSupported) {
      voiceMessage.value = 'Spoken cues are unavailable in this browser.'
      return
    }

    stopVoice()
    voiceMessage.value = ''
    const cue = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.localService && voice.lang.startsWith('en'))
    cue.voice = voices.find((voice) => /Samantha|Moira/i.test(voice.name)) || voices[0] || null
    cue.lang = cue.voice?.lang || 'en-IE'
    cue.rate = 0.88
    cue.volume = preferences.voiceVolume / 100
    cue.onerror = (event) => {
      if (voiceCue === cue && !['interrupted', 'canceled'].includes(event.error)) {
        voiceMessage.value = 'Voice playback is unavailable. The visual cues are still on.'
      }
    }
    voiceCue = cue
    window.speechSynthesis.speak(cue)
  }

  function cuePhase(phase: BreathingPhaseName) {
    const cue = breathingCues[phase]
    if (!preferences.voice || !cue) return
    const { title, instruction } = cue
    speak(phase === 'prepare' ? title : `${title} ${instruction.toLowerCase()}`)
  }

  watch(
    () => preferences.voice,
    (enabled) => {
      if (!enabled) stopVoice()
    },
  )
  onUnmounted(stopVoice)

  return { voiceMessage, voiceSupported, speak, cuePhase, stopVoice }
}
