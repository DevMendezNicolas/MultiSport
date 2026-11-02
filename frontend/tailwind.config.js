/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          sport: '#258653',
          'sport-hover': '#1E6E44',
          british: '#164734',
          soft: '#A7B9A5',
          dark: '#0B0B0B',
          'dark-surface': '#141414',
          cream: '#F4F1EA',
          'cream-card': '#ECE7DD',
          'cream-text': '#8A8275',
          yellow: '#F5BD1F',
          'yellow-hover': '#E0AA10',
          // Alias de transición para que pantallas preexistentes adopten el verde deportivo antes de la limpieza de la Etapa 2
          red: '#258653',
          'red-hover': '#1E6E44',
          'red-dark': '#164734',
          'red-subtle': '#2586531A',
        },
        stitch: {
          amber: '#D46211',
          'amber-hover': '#E37A24',
          'amber-light': '#FFB786',
          'amber-muted': 'rgba(212, 98, 17, 0.1)',
          green: '#327357',
          'green-light': '#92D4B3',
          'green-hover': '#285E46',
          dark: '#17181C',
          'dark-surface': '#111215',
          'dark-card': '#22242B',
          'dark-card-hover': '#292A2E',
          border: '#31343E',
          text: '#F2F3F5',
          muted: '#9497A1',
        },
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
