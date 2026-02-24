/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  extend: {
  colors: {
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
  '1': 'hsl(var(--chart-1))',
  '2': 'hsl(var(--chart-2))',
  '3': 'hsl(var(--chart-3))',
  '4': 'hsl(var(--chart-4))',
  '5': 'hsl(var(--chart-5))'
  },
  sidebar: {
  DEFAULT: 'hsl(var(--sidebar-background))',
  foreground: 'hsl(var(--sidebar-foreground))',
  primary: 'hsl(var(--sidebar-primary))',
  'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  accent: 'hsl(var(--sidebar-accent))',
  'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  border: 'hsl(var(--sidebar-border))',
  ring: 'hsl(var(--sidebar-ring))'
  },
  },
  borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem'
  },
  keyframes: {
  'accordion-down': {
  from: { height: '0' },
  to: { height: 'var(--radix-accordion-content-height)' }
  },
  'accordion-up': {
  from: { height: 'var(--radix-accordion-content-height)' },
  to: { height: '0' }
  },
  'float': {
  '0%, 100%': { transform: 'translateY(0px)' },
  '50%': { transform: 'translateY(-12px)' }
  },
  'shimmer': {
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' }
  },
  'pulse-glow': {
  '0%, 100%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)' },
  '50%': { boxShadow: '0 0 40px rgba(220, 38, 38, 0.6)' }
  },
  'gradient-shift': {
  '0%': { backgroundPosition: '0% 50%' },
  '50%': { backgroundPosition: '100% 50%' },
  '100%': { backgroundPosition: '0% 50%' }
  },
  'fade-up': {
  from: { opacity: '0', transform: 'translateY(30px)' },
  to: { opacity: '1', transform: 'translateY(0)' }
  },
  'fade-in': {
  from: { opacity: '0' },
  to: { opacity: '1' }
  },
  'scale-in': {
  from: { opacity: '0', transform: 'scale(0.95)' },
  to: { opacity: '1', transform: 'scale(1)' }
  },
  'slide-up': {
  from: { opacity: '0', transform: 'translateY(20px)' },
  to: { opacity: '1', transform: 'translateY(0)' }
  },
  'spin-slow': {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' }
  }
  },
  animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out',
  'float': 'float 4s ease-in-out infinite',
  'shimmer': 'shimmer 3s linear infinite',
  'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
  'gradient-shift': 'gradient-shift 6s ease infinite',
  'fade-up': 'fade-up 0.6s ease-out forwards',
  'fade-in': 'fade-in 0.4s ease-out forwards',
  'scale-in': 'scale-in 0.4s ease-out forwards',
  'slide-up': 'slide-up 0.5s ease-out forwards',
  'spin-slow': 'spin-slow 20s linear infinite'
  },
  backgroundImage: {
  'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  'dark-gradient': 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #111111 100%)',
  },
  boxShadow: {
  'glow': '0 0 20px rgba(220, 38, 38, 0.3)',
  'glow-lg': '0 0 40px rgba(220, 38, 38, 0.4)',
  'premium': '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(220, 38, 38, 0.08)',
  }
  }
  },
  plugins: [require("tailwindcss-animate")],
};
