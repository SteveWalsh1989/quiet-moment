const senses = {
  eye: {
    label: 'Sight',
    verb: 'see',
    example: 'Maybe a shadow on the wall or a fold in your sleeve.',
  },
  hand: {
    label: 'Touch',
    verb: 'feel',
    example: 'Maybe the chair beneath you or the texture of your sleeve.',
  },
  hear: {
    label: 'Sound',
    verb: 'hear',
    example: 'Maybe the hum of a fan or traffic in the distance.',
  },
  scent: {
    label: 'Smell',
    verb: 'smell',
    example: 'Maybe tea, coffee or the fabric of your jumper.',
    note: 'If nothing comes to mind, you can move on.',
  },
  taste: {
    label: 'Taste',
    verb: 'taste',
    example: 'Maybe a sip of water or the taste of the last thing you ate.',
    note: 'If nothing comes to mind, you can move on.',
  },
}

const countWords = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' }

export interface GroundingStep {
  icon: keyof typeof senses
  label: string
  title: string
  example: string
  count?: number
  note?: string
}

function sense(icon: GroundingStep['icon'], count: keyof typeof countWords): GroundingStep {
  const { verb, ...content } = senses[icon]
  return {
    icon,
    count,
    ...content,
    title: `Notice ${countWords[count]} ${count === 1 ? 'thing' : 'things'} you can ${verb}.`,
  }
}

export const grounding = {
  full: {
    label: '5-4-3-2-1 senses',
    detail: 'A prompt for each of the five senses',
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
    detail: 'Three short prompts for sight, sound and touch',
    steps: [sense('eye', 3), sense('hear', 2), sense('hand', 1)],
  },
  room: {
    label: 'Orient to the room',
    detail: 'Notice your surroundings without counting',
    steps: [
      {
        icon: 'hand',
        label: senses.hand.label,
        title: 'Feel what supports you.',
        example: 'Notice where your feet meet the floor or how the chair supports you.',
      },
      {
        icon: 'eye',
        label: senses.eye.label,
        title: 'Find one ordinary object.',
        example: 'Notice a detail, like the curve of a mug handle.',
      },
      {
        icon: 'hear',
        label: senses.hear.label,
        title: 'Listen near and far.',
        example: 'Maybe the hum of a fan nearby or a car passing outside.',
      },
    ],
  },
} satisfies Record<string, { label: string; detail: string; steps: GroundingStep[] }>

export type GroundingId = keyof typeof grounding
