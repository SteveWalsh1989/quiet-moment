const senses = {
  eye: {
    verb: 'see',
    title: 'Look around you.',
    examples: ['A shadow on the wall', 'The edge of your desk', 'A fold in your sleeve'],
  },
  hand: {
    verb: 'feel',
    title: 'Notice what you can feel.',
    examples: [
      'Your feet inside your shoes',
      'The chair beneath you',
      'The texture of your sleeve',
    ],
  },
  hear: {
    verb: 'hear',
    title: 'Listen to your surroundings.',
    examples: ['A fan or radiator', 'Traffic in the distance', 'The rustle of your clothes'],
  },
  scent: {
    verb: 'smell',
    title: 'Notice a scent nearby.',
    examples: ['Tea or coffee', 'The fabric of your jumper', 'The air by a window'],
  },
  taste: {
    verb: 'taste',
    title: 'Notice a taste.',
    examples: ['A sip of water', 'The last thing you ate', 'A taste you can remember'],
  },
}

export interface GroundingStep {
  icon: keyof typeof senses
  count?: number
  title: string
  prompt: string
  examples: readonly string[]
}

function sense(icon: GroundingStep['icon'], count: number): GroundingStep {
  return {
    icon,
    count,
    ...senses[icon],
    prompt: `Name ${count} ${count === 1 ? 'thing' : 'things'} you can ${senses[icon].verb}.`,
  }
}

export const grounding = {
  full: {
    label: '5-4-3-2-1 senses',
    steps: [
      sense('eye', 5),
      sense('hand', 4),
      sense('hear', 3),
      sense('scent', 2),
      sense('taste', 1),
    ],
  },
  quick: {
    label: 'Quick 3-2-1 senses',
    steps: [sense('eye', 3), sense('hear', 2), sense('hand', 1)],
  },
  room: {
    label: 'Orient to the room',
    steps: [
      {
        icon: 'hand',
        title: 'Feel what supports you.',
        prompt: 'Notice where your body meets the seat or floor.',
        examples: ['The chair under you', 'Both feet on the floor'],
      },
      {
        icon: 'eye',
        title: 'Find one ordinary object.',
        prompt: 'Look at its shape, colour or texture for a moment.',
        examples: ['A mug with a curved handle', 'The straight edge of a window'],
      },
      {
        icon: 'hear',
        title: 'Listen near and far.',
        prompt: 'Pick out one sound close by and one farther away.',
        examples: ['The hum of a fan', 'A car passing outside'],
      },
    ],
  },
} satisfies Record<string, { label: string; steps: GroundingStep[] }>

export type GroundingId = keyof typeof grounding
