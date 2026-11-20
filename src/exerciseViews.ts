export const exerciseViews = [
  {
    id: 'reset',
    label: 'Quick reset',
    icon: 'reset',
    title: 'A moment to settle.',
    intro: 'Start with a gentle breath, then bring your attention back to the room.',
  },
  {
    id: 'breathe',
    label: 'Breathing',
    icon: 'breathe',
    title: 'Find an easy rhythm.',
    intro: 'Follow the circle at a pace that feels comfortable to you.',
  },
  {
    id: 'ground',
    label: 'Grounding',
    icon: 'ground',
    title: 'Come back to the room.',
    intro: 'Follow a few simple prompts to notice what’s around you.',
  },
  {
    id: 'focus',
    label: 'Distraction',
    icon: 'focus',
    title: 'Give your mind a small task.',
    intro: 'Something simple to turn your attention to for a moment.',
  },
] as const

export type ExerciseView = (typeof exerciseViews)[number]['id']
