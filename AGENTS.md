# Working on Quiet Moment

Use Vue 3 Composition API with `<script setup lang="ts">` and the existing Tailwind utilities. Use one owner for each piece of state and typed props and events between views. Use the existing styles in `src/styles/` for changes to the player, settings, or shell.

| If you are changing                                | Start here                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| Exercise navigation, session transitions, or focus | `src/App.vue`                                                            |
| Breathing controls or circle                       | `src/features/breathing/BreathingPlayer.vue`                             |
| Countdown, phase transitions, or pause/resume      | `src/features/breathing/breathingTiming.ts` and `useBreathingSession.ts` |
| Sound choices or playback, or the optional voice   | `src/features/audio/`                                                    |
| Grounding or distraction prompts                   | `src/features/grounding/` and `src/features/distraction/`                |
| Session form fields or persisted values            | `src/components/SessionSettings.vue` and `src/preferences.ts`            |

The breathing clock drives the countdown, circle, and Breathing lo-fi envelope. Keep those cues on the same clock. Pause must hold the phase and the synced track’s playback position, and resume must continue from those positions. Regular background tracks are independent of the breathing clock.

Follow the system’s Reduce Motion setting by default. A user can explicitly enable animation in the player. Preserve the labelled, keyboard-operable centre button and the separate Pause and Reset controls during a session.

Keep stored settings backward compatible through `normalizePreferences`. Keep audio and speech opt-in and offline-capable. Leave analytics limited to the production entry point and preserve its URL filtering.

Run `pnpm run check` before handing off a change. For player changes, also exercise the affected path in a browser through Start, Pause, Resume, and Reset. Use `pnpm run build:offline` to check the portable preview when changing assets or the entry point.

Use a commit message that describes the behavior or maintenance change. Keep the existing Git signing configuration.
