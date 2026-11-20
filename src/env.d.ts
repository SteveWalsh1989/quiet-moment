import type { SoundId } from './features/audio/soundTracks'

declare global {
  var quietMomentOffline:
    { mark: string; sounds: Record<Exclude<SoundId, 'off'>, string> } | undefined
}
