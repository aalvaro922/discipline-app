import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        surface: '#111111',
        'surface-2': '#1c1c1c',
        border: '#272727',
        muted: '#616161',
        accent: '#ffffff',
        'accent-dim': '#1f1f1f',
        warn: '#a3a3a3',
        'warn-dim': '#1a1a1a',
        danger: '#6b6b6b',
        'danger-dim': '#161616',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}

export default config
