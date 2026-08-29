import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#F5E8D4',
          light: '#FBF4E9',
          deep: '#EBD7BD',
        },
        ink: {
          DEFAULT: '#172238',
          soft: '#30405A',
          deep: '#0F172A',
        },
        muted: {
          DEFAULT: '#6E706F',
          light: '#8C8E8D',
        },
        surface: {
          white: '#FFFDF8',
          border: '#DCCCB7',
          'border-subtle': '#E8DCB',
        },
        saffron: {
          DEFAULT: '#D97732',
          dark: '#A84F1F',
          light: '#FCE7D2',
        },
        terracotta: '#B65F46',
        maroon: {
          DEFAULT: '#7E2630',
          dark: '#5F1C24',
          light: '#F5E6E8',
        },
        semantic: {
          success: '#2F7654',
          warning: '#B2762A',
          critical: '#B83A32',
          info: '#386A86',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
        devanagari: ['var(--font-devanagari)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px rgba(23, 34, 56, 0.05)',
        elevated: '0 16px 50px rgba(23, 34, 56, 0.08)',
        emergency: '0 12px 36px rgba(184, 58, 50, 0.15)',
        saffron: '0 8px 24px rgba(217, 119, 50, 0.22)',
      },
      borderRadius: {
        card: '14px',
        feature: '18px',
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.035em',
        tight: '-0.02em',
        wide: '0.04em',
        widest: '0.1em',
      },
    },
  },
  plugins: [],
};

export default config;
