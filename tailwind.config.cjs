const palette = [
  'paper',
  'topbar',
  'panel',
  'control',
  'ink',
  'muted',
  'line',
  'field-line',
  'hover',
  'selected',
  'selection',
  'accent-ink',
  'accent',
  'focus',
  'player-glow',
  'player-mid',
  'player-edge',
  'on-player',
  'player-muted',
  'player-highlight',
  'player-border',
  'player-control',
  'player-control-hover',
  'action',
  'action-ink',
  'breath-in',
  'breath-out',
  'breath-hold',
]

module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: Object.fromEntries(palette.map((name) => [name, `var(--${name})`])),
      fontFamily: {
        body: ['Manrope', 'sans-serif'],
        display: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
