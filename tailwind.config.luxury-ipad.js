/** @type {import('tailwindcss').Config} */
/**
 * LUXURY IPAD OPTIMIZED TAILWIND CONFIGURATION
 * Priority Lexus Aftermarket Menu
 *
 * This configuration extends the base Tailwind setup with:
 * - iPad-specific breakpoints
 * - Luxury color palette
 * - Premium typography scale
 * - Touch-optimized spacing
 * - Refined design tokens
 */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // FONT FAMILIES
      fontFamily: {
        'sans': ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'teko': ['Teko', 'sans-serif'],
        'display': ['Teko', 'sans-serif'], // Alias for display text

        // Optional premium alternatives (uncomment to use):
        // 'display': ['Playfair Display', 'Georgia', 'serif'],
        // 'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // 'display': ['Montserrat', 'sans-serif'],
      },

      // BREAKPOINTS - iPad Optimized
      screens: {
        'xs': '475px',        // Large phones
        'sm': '640px',        // Phone landscape
        'ipad-p': '768px',    // iPad portrait (768x1024) - iPad 10.2", Air, Pro 11"
        'md': '768px',        // Keep for compatibility
        'ipad-l': '1024px',   // iPad landscape (1024x768)
        'lg': '1024px',       // Keep for compatibility
        'ipad-pro': '1112px', // iPad Pro 11" landscape (1194 - margins)
        'ipad-pro-l': '1366px', // iPad Pro 12.9" landscape
        'xl': '1440px',       // Desktop
        '2xl': '1920px',      // Large desktop
      },

      // COLORS - Luxury Palette
      colors: {
        // Luxury Neutrals
        'luxury-black': '#0A0A0A',
        'luxury-charcoal': '#1A1A1A',
        'luxury-slate': '#2A2A2A',
        'luxury-silver': '#E8E8E8',
        'luxury-platinum': '#F5F5F5',
        'luxury-white': '#FFFFFF',

        // Lexus Brand Blues
        'lexus-blue': {
          50: '#E6F0FF',
          100: '#CCE1FF',
          200: '#99C3FF',
          300: '#66A5FF',
          400: '#4D94FF',
          500: '#0066FF',
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
        },

        // Premium Accent Colors
        'luxury-gold': {
          300: '#E5C576',
          400: '#D4AF37',
          500: '#C5A028',
          600: '#B8941F',
          700: '#A67F15',
        },

        'luxury-green': {
          400: '#00C97A',
          500: '#00B67A',
          600: '#00A66E',
          700: '#009662',
        },

        'luxury-red': {
          400: '#FF1A1A',
          500: '#DC0000',
          600: '#C40000',
          700: '#AD0000',
        },

        'luxury-amber': {
          400: '#FFC107',
          500: '#FFB300',
          600: '#FFA000',
        },
      },

      // SPACING - iPad Touch Optimized
      spacing: {
        // Touch targets
        'touch-min': '44px',        // Apple HIG minimum
        'touch-comfortable': '48px', // Comfortable target
        'touch-luxury': '56px',     // Spacious luxury target

        // iPad-specific spacing scale
        'ipad-xs': '0.75rem',  // 12px
        'ipad-sm': '1rem',     // 16px
        'ipad-md': '1.5rem',   // 24px
        'ipad-lg': '2rem',     // 32px
        'ipad-xl': '3rem',     // 48px
        'ipad-2xl': '4rem',    // 64px
        'ipad-3xl': '6rem',    // 96px
      },

      // MINIMUM DIMENSIONS
      minWidth: {
        'touch': '44px',
        'touch-lg': '56px',
        'ipad-sm': '200px',
        'ipad-md': '300px',
        'ipad-lg': '400px',
      },

      minHeight: {
        'touch': '44px',
        'touch-lg': '56px',
        'ipad-sm': '200px',
        'ipad-md': '300px',
        'ipad-lg': '400px',
      },

      // MAXIMUM DIMENSIONS
      maxWidth: {
        'ipad': '1024px',
        'ipad-pro': '1366px',
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1400px',
      },

      // TYPOGRAPHY - iPad Optimized Scale
      fontSize: {
        // iPad-specific type scale
        'ipad-xs': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'ipad-sm': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        'ipad-base': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
        'ipad-lg': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '0.01em' }],
        'ipad-xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0' }],
        'ipad-2xl': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em' }],
        'ipad-3xl': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.02em' }],
        'ipad-4xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.02em' }],
        'ipad-5xl': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.02em' }],
        'ipad-6xl': ['4rem', { lineHeight: '4.5rem', letterSpacing: '-0.02em' }],
        'ipad-7xl': ['4.5rem', { lineHeight: '5rem', letterSpacing: '-0.02em' }],
      },

      // LETTER SPACING
      letterSpacing: {
        'luxury': '0.05em',
        'luxury-wide': '0.1em',
        'luxury-wider': '0.15em',
        'luxury-widest': '0.2em',
      },

      // LINE HEIGHT
      lineHeight: {
        'luxury-tight': '1.2',
        'luxury-normal': '1.5',
        'luxury-relaxed': '1.75',
        'luxury-loose': '2',
      },

      // BORDER RADIUS
      borderRadius: {
        'luxury-sm': '0.5rem',    // 8px
        'luxury': '0.75rem',      // 12px
        'luxury-lg': '1rem',      // 16px
        'luxury-xl': '1.5rem',    // 24px
        'luxury-2xl': '2rem',     // 32px
        'luxury-full': '9999px',
      },

      // SHADOWS - Refined luxury shadows
      boxShadow: {
        'luxury-sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'luxury': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'luxury-md': '0 8px 24px rgba(0, 0, 0, 0.2)',
        'luxury-lg': '0 12px 32px rgba(0, 0, 0, 0.25)',
        'luxury-xl': '0 20px 48px rgba(0, 0, 0, 0.3)',
        'luxury-2xl': '0 24px 64px rgba(0, 0, 0, 0.35)',
        'luxury-inner': 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
        'glow-blue': '0 0 20px rgba(0, 102, 255, 0.5)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.5)',
      },

      // SCALE - Hover & active states
      scale: {
        '98': '0.98',
        '102': '1.02',
        '103': '1.03',
        '105': '1.05',
      },

      // TRANSITIONS
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },

      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-luxury': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // BACKDROP BLUR
      backdropBlur: {
        'luxury-sm': '10px',
        'luxury': '20px',
        'luxury-lg': '30px',
        'luxury-xl': '40px',
      },

      // Z-INDEX
      zIndex: {
        'header': '30',
        'modal': '50',
        'dropdown': '40',
        'overlay': '45',
        'toast': '60',
      },

      // ANIMATION KEYFRAMES
      keyframes: {
        // Card entrance animation
        'card-entrance': {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px) scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },

        // Fade in
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        // Slide up
        'slide-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.98)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },

        // Slide up fast
        'slide-up-fast': {
          '0%': {
            opacity: '0',
            transform: 'translateY(100%)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },

        // Icon pop in
        'icon-pop-in': {
          '0%': {
            transform: 'scale(0.5)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },

        // Summary item in
        'summary-item-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },

        // Pulse scroll indicator
        'pulse-scroll': {
          '0%, 100%': {
            opacity: '0.4',
            transform: 'translateY(0)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'translateY(-8px)',
          },
        },

        // Shimmer loading
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },

        // Rotate
        'rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },

      // ANIMATIONS
      animation: {
        'card-entrance': 'card-entrance 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'slide-up-fast': 'slide-up-fast 0.3s ease-out forwards',
        'icon-pop-in': 'icon-pop-in 0.3s ease-out forwards',
        'summary-item-in': 'summary-item-in 0.4s ease-out forwards',
        'pulse-scroll': 'pulse-scroll 2s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'rotate 3s linear infinite',
        'spin-luxury': 'rotate 2s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
      },

      // ASPECT RATIOS
      aspectRatio: {
        'ipad': '4/3',
        'ipad-pro': '1366/1024',
      },
    },
  },
  plugins: [],
}
