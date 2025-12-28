/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        // Cool blue-tinted dark mode colors
        dark: {
          50: '#E8EEF4',
          100: '#C5D3E0',
          200: '#9FB5CA',
          300: '#7896B4',
          400: '#5A7FA3',
          500: '#3D6892',
          600: '#34597D',
          700: '#2A4966',
          800: '#1E3A50',
          900: '#152A3B',
          950: '#0D1B26',
        },
        // Surface colors for dark mode (blue-tinted)
        surface: {
          dark: '#0F172A',      // Main background - slate-900 with blue tint
          'dark-elevated': '#1E293B', // Cards, elevated surfaces
          'dark-border': '#334155',   // Borders
          'dark-hover': '#1E3A50',    // Hover states
        },
        'heart-rate': '#F43F5E',
        'blood-pressure': '#8B5CF6',
        'sleep': '#6366F1',
        'weight': '#14B8A6',
        'glucose': '#F97316',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'dark-soft': '0 2px 15px -3px rgba(0, 0, 0, 0.3), 0 10px 20px -2px rgba(0, 0, 0, 0.2)',
        'dark-card': '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.3)',
      },
      backgroundColor: {
        'dark-base': '#0F172A',
        'dark-card': '#1E293B',
        'dark-elevated': '#334155',
      },
    },
  },
  plugins: [],
};