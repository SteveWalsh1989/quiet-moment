export const colorThemes = [
  { id: 'purple', label: 'Purple' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'teal', label: 'Teal' },
  { id: 'forest', label: 'Forest' },
  { id: 'olive', label: 'Olive' },
  { id: 'amber', label: 'Amber' },
  { id: 'clay', label: 'Clay' },
  { id: 'rose', label: 'Rose' },
  { id: 'slate', label: 'Slate' },
] as const

export type ColorTheme = (typeof colorThemes)[number]['id']
