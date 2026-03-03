
import { siteConfig, getFontFamily } from './src/config.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': getFontFamily(siteConfig.fonts.families.body).split(', '),
        'heading': getFontFamily(siteConfig.fonts.families.heading).split(', '),
        'prose': getFontFamily(siteConfig.fonts.families.body).split(', ')
      },
      colors: {
        // Dynamic theme colors using CSS custom properties
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        highlight: {
          50: 'rgb(var(--color-highlight-50) / <alpha-value>)',
          100: 'rgb(var(--color-highlight-100) / <alpha-value>)',
          200: 'rgb(var(--color-highlight-200) / <alpha-value>)',
          300: 'rgb(var(--color-highlight-300) / <alpha-value>)',
          400: 'rgb(var(--color-highlight-400) / <alpha-value>)',
          500: 'rgb(var(--color-highlight-500) / <alpha-value>)',
          600: 'rgb(var(--color-highlight-600) / <alpha-value>)',
          700: 'rgb(var(--color-highlight-700) / <alpha-value>)',
          800: 'rgb(var(--color-highlight-800) / <alpha-value>)',
          900: 'rgb(var(--color-highlight-900) / <alpha-value>)',
          950: 'rgb(var(--color-highlight-950) / <alpha-value>)',
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            'h1, h2, h3, h4, h5, h6': {
              fontFamily: getFontFamily(siteConfig.fonts.families.heading),
              fontWeight: '600',
              scrollMarginTop: '2rem',
            },
            a: {
              color: siteConfig.theme === 'oxygen' ? '#0ea5e9' : '#708794',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                color: siteConfig.theme === 'oxygen' ? '#0284c7' : '#5a6d77',
                textDecoration: 'underline',
              }
            },
            code: {
              color: 'inherit',
              backgroundColor: 'rgb(248 250 252 / 0.8)',
              borderRadius: '0.375rem',
              padding: '0.125rem 0.375rem',
              fontSize: '1em',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              padding: '1rem',
              overflow: 'auto',
              fontSize: '1em',
              lineHeight: '1.7142857',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: 'inherit',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            blockquote: {
              fontWeight: '400',
              fontStyle: 'normal',
              color: 'inherit',
              borderLeftWidth: '0.25rem',
              borderLeftColor: '#e2e8f0',
              quotes: '"\\201C""\\201D""\\2018""\\2019"',
              marginTop: '1.6em',
              marginBottom: '1.6em',
              paddingLeft: '1em',
            },
            'blockquote p:first-of-type::before': {
              content: '""',
            },
            'blockquote p:last-of-type::after': {
              content: '""',
            },
          }
        },
        dark: {
          css: {
            color: '#e2e8f0',
            code: {
              backgroundColor: 'rgb(30 41 59 / 0.8)',
            },
            blockquote: {
              borderLeftColor: '#475569',
              color: '#94a3b8',
            },
          }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.text-selection-highlight': {
          '::selection': {
            backgroundColor: siteConfig.theme === 'oxygen' ? '#0ea5e9' : '#708794',
            color: '#ffffff'
          },
          '::-moz-selection': {
            backgroundColor: siteConfig.theme === 'oxygen' ? '#0ea5e9' : '#708794',
            color: '#ffffff'
          }
        }
      })
    }
  ],
}
