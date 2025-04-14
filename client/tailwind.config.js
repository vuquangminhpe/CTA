/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
// const { Container } = require('postcss')
// const plugin = require('tailwindcss/plugin')

import { Container } from 'postcss'
import plugin from 'tailwindcss/plugin'

module.exports = {
  darkMode: ['false'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    container: false
  },
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        customeBlue: 'rgba(1, 180, 228)',
        orange: '#ee4d2d',
        tmdbLightGreen: 'var(--tmdbLightGreen)',
        tmdbLightBlue: 'var(--tmdbLightBlue)',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float-1': {
          '0%': { transform: 'translate(0, 0)', opacity: 0 },
          '50%': { opacity: 1 },
          '100%': { transform: 'translate(10px, -15px)', opacity: 0 }
        },
        'float-2': {
          '0%': { transform: 'translate(0, 0)', opacity: 0 },
          '50%': { opacity: 1 },
          '100%': { transform: 'translate(-10px, -20px)', opacity: 0 }
        },
        'float-3': {
          '0%': { transform: 'translate(0, 0)', opacity: 0 },
          '50%': { opacity: 1 },
          '100%': { transform: 'translate(15px, -10px)', opacity: 0 }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '75%, 100%': { transform: 'scale(1.8)', opacity: 0 }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'float-1': 'float-1 3s ease-in-out infinite',
        'float-2': 'float-2 3.5s ease-in-out infinite',
        'float-3': 'float-3 3.2s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite'
      }
    }
  },
  plugins: [
    plugin(function ({ addComponents, theme }) {
      addComponents({
        '.container': {
          maxWidth: '90rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4xl'),
          paddingRight: theme('spacing.4xl')
        },
        '.glass': {
          width: '400px',
          height: 'auto',
          borderRadius: '16px',
          background: '#ffffff20',
          boxShadow: '0 10px 30px #ffffff50',
          backdropFilter: 'blur(5px)',
          border: '1px solid #ffffff50',
          transition: '0.4s ease all'
        }
      })
    }),
    require('tailwindcss-animate')
  ]
}
