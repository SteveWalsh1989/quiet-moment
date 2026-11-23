import { createApp } from 'vue'
import App from './App.vue'
import { inject } from '@vercel/analytics'
import './styles/base.css'
import './styles/palettes.css'
import './styles/layout.css'
import './styles/player.css'
import './styles/settings.css'
import './styles/responsive.css'

createApp(App).mount('#app')

if (import.meta.env.PROD && !globalThis.quietMomentOffline) {
  inject({ beforeSend: (event) => ({ ...event, url: location.origin + location.pathname }) })
}
