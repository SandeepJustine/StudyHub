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
        navy: {
          DEFAULT: '#0D1B3D',
          light: '#1A2D5A',
          dark: '#0A152E',
          50: '#E8ECF3',
          100: '#C5CDE1',
          200: '#9EACCB',
          300: '#778BB5',
          400: '#5A72A4',
          500: '#3D5993',
          600: '#374E84',
          700: '#2F4270',
          800: '#27365C',
          900: '#0D1B3D',
        },
        red: {
          DEFAULT: '#E63946',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#E63946',
          700: '#DC2626',
          800: '#B91C1C',
          900: '#7F1D1D',
        },
        green: {
          DEFAULT: '#16A34A',
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
        'grey-light': '#F2F4F7',
        'grey-medium': '#9CA3AF',
        'grey-dark': '#333333',
        slate: {
          300: '#CBD5E1',
          400: '#94A3B8',
          700: '#334155',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;