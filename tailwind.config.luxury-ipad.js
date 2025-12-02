/**
 * Luxury iPad Tailwind Configuration
 * 
 * Enhanced Tailwind CSS configuration optimized for iPad displays
 * with premium visual effects, animations, and touch-first design.
 * 
 * Font Loading Strategy:
 * The custom fonts (Roboto, Teko) are loaded via Google Fonts in index.html
 * with font-display: swap for optimal loading. System fonts are provided
 * as fallbacks to prevent layout shifts during font loading.
 * 
 * @see index.html for font preconnect and stylesheet links
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ========================================
      // TYPOGRAPHY
      // Font Loading: Fonts are loaded via Google Fonts with
      // font-display: swap to prevent invisible text during load.
      // System-ui fallbacks prevent layout shifts.
      // ========================================
      fontFamily: {
        'sans': ['Roboto', 'system-ui', 'sans-serif'],
        'teko': ['Teko', 'system-ui', 'sans-serif'],
      },
      
      // Optimized font sizes for iPad viewing at arm's length
      fontSize: {
        'xs-ipad': ['0.875rem', { lineHeight: '1.5' }],    // 14px
        'sm-ipad': ['1rem', { lineHeight: '1.5' }],        // 16px
        'base-ipad': ['1.125rem', { lineHeight: '1.6' }],  // 18px
        'lg-ipad': ['1.25rem', { lineHeight: '1.6' }],     // 20px
        'xl-ipad': ['1.5rem', { lineHeight: '1.4' }],      // 24px
        '2xl-ipad': ['2rem', { lineHeight: '1.3' }],       // 32px
        '3xl-ipad': ['2.5rem', { lineHeight: '1.2' }],     // 40px
        '4xl-ipad': ['3rem', { lineHeight: '1.1' }],       // 48px
        '5xl-ipad': ['4rem', { lineHeight: '1' }],         // 64px
        '6xl-ipad': ['5rem', { lineHeight: '1' }],         // 80px
      },
      
      letterSpacing: {
        'luxury': '0.05em',
        'luxury-wide': '0.1em',
        'luxury-wider': '0.2em',
        'luxury-widest': '0.3em',
      },
      
      // ========================================
      // COLORS - LUXURY PALETTE
      // ========================================
      colors: {
        luxury: {
          // Background colors
          'bg-primary': '#111827',
          'bg-secondary': '#1f2937',
          'bg-tertiary': '#374151',
          
          // Accent colors
          'accent-blue': '#3b82f6',
          'accent-gold': '#fbbf24',
          'accent-green': '#22c55e',
          'accent-red': '#ef4444',
          'accent-purple': '#a855f7',
          
          // Text colors
          'text-primary': '#f9fafb',
          'text-secondary': '#d1d5db',
          'text-muted': '#9ca3af',
          
          // Package tier colors
          'tier-gold': '#fbbf24',
          'tier-elite': '#a855f7',
          'tier-platinum': '#3b82f6',
          
          // Glass effect colors
          'glass-light': 'rgba(255, 255, 255, 0.1)',
          'glass-dark': 'rgba(0, 0, 0, 0.4)',
        },
      },
      
      // ========================================
      // SPACING & SIZING
      // ========================================
      spacing: {
        // Touch-optimized spacing (44pt minimum targets)
        'touch': '44px',
        'touch-lg': '56px',
        'touch-xl': '64px',
        
        // Safe area insets for iPad
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      minHeight: {
        'touch': '44px',
        'touch-lg': '56px',
      },
      
      minWidth: {
        'touch': '44px',
        'touch-lg': '56px',
      },
      
      // ========================================
      // SCALE TRANSFORMS
      // ========================================
      scale: {
        '97': '0.97',
        '98': '0.98',
        '102': '1.02',
        '103': '1.03',
        '105': '1.05',
      },
      
      // ========================================
      // BORDER RADIUS
      // ========================================
      borderRadius: {
        'luxury': '1rem',      // 16px
        'luxury-lg': '1.5rem', // 24px
        'luxury-xl': '2rem',   // 32px
        'luxury-2xl': '2.5rem', // 40px
      },
      
      // ========================================
      // BOX SHADOWS
      // ========================================
      boxShadow: {
        // Layered luxury shadows
        'luxury-sm': '0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
        'luxury': '0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1), 0 16px 32px rgba(0, 0, 0, 0.15)',
        'luxury-lg': '0 8px 16px rgba(0, 0, 0, 0.1), 0 16px 32px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.1)',
        'luxury-xl': '0 16px 32px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.15), 0 64px 128px rgba(0, 0, 0, 0.1)',
        
        // Glow effects
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)',
        'glow-gold': '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)',
        
        // Glass effect shadows
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        
        // Footer shadow (upward)
        'footer': '0 -10px 40px rgba(0, 0, 0, 0.5)',
      },
      
      // ========================================
      // BACKDROP BLUR
      // ========================================
      backdropBlur: {
        'luxury': '20px',
        'luxury-lg': '32px',
        'luxury-xl': '48px',
      },
      
      // ========================================
      // ANIMATIONS
      // ========================================
      animation: {
        // Fade animations
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-out': 'fade-out 0.3s ease-in forwards',
        
        // Slide animations
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'slide-down': 'slide-down 0.3s ease-out forwards',
        'slide-up-fast': 'slide-up-fast 0.3s ease-out forwards',
        
        // Scale animations
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'scale-out': 'scale-out 0.2s ease-in forwards',
        
        // Combined animations
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'fade-in-scale': 'fade-in-scale 0.3s ease-out forwards',
        
        // Interaction animations
        'icon-pop-in': 'icon-pop-in 0.3s ease-out forwards',
        'summary-item-in': 'summary-item-in 0.4s ease-out forwards',
        
        // Continuous animations
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        
        // Selection animation
        'select': 'select 0.3s ease-out forwards',
      },
      
      keyframes: {
        // Fade keyframes
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'fade-out': {
          'from': { opacity: '1' },
          'to': { opacity: '0' },
        },
        
        // Slide keyframes
        'slide-up': {
          'from': { transform: 'translateY(20px) scale(0.98)', opacity: '0' },
          'to': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'slide-down': {
          'from': { transform: 'translateY(-20px) scale(0.98)', opacity: '0' },
          'to': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'slide-up-fast': {
          'from': { transform: 'translateY(100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        
        // Scale keyframes
        'scale-in': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          'from': { transform: 'scale(1)', opacity: '1' },
          'to': { transform: 'scale(0.95)', opacity: '0' },
        },
        
        // Combined keyframes
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        
        // Interaction keyframes
        'icon-pop-in': {
          'from': { transform: 'scale(0.5)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'summary-item-in': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        
        // Continuous keyframes
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        
        // Selection keyframe
        'select': {
          '0%': { transform: 'scale(1)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1.05)', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)' },
        },
      },
      
      // ========================================
      // TRANSITION TIMING FUNCTIONS
      // ========================================
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'luxury-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'luxury-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'luxury-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      
      // ========================================
      // TRANSITION DURATION
      // ========================================
      transitionDuration: {
        'micro': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '400ms',
        'slowest': '500ms',
      },
      
      // ========================================
      // Z-INDEX
      // ========================================
      zIndex: {
        'header': '30',
        'modal': '50',
        'toast': '60',
        'tooltip': '70',
      },
      
      // ========================================
      // GRADIENTS (via backgroundImage)
      // ========================================
      backgroundImage: {
        'luxury-gradient': 'linear-gradient(180deg, rgba(17, 24, 39, 1) 0%, rgba(31, 41, 55, 1) 50%, rgba(17, 24, 39, 1) 100%)',
        'luxury-metallic': 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 25%, #1e3a5f 50%, #2d5a87 75%, #1e3a5f 100%)',
        'luxury-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
      },
      
      // ========================================
      // ASPECT RATIO
      // ========================================
      aspectRatio: {
        'ipad': '4 / 3',
        'ipad-pro': '4.3 / 3',
      },
    },
  },
  
  // ========================================
  // PLUGINS
  // ========================================
  plugins: [
    // Custom plugin for luxury utilities
    function({ addUtilities }) {
      const newUtilities = {
        // Touch-friendly utilities
        '.touch-none': {
          'touch-action': 'none',
        },
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.select-none-touch': {
          '-webkit-user-select': 'none',
          'user-select': 'none',
          '-webkit-touch-callout': 'none',
        },
        
        // Scroll utilities
        '.scroll-smooth-touch': {
          '-webkit-overflow-scrolling': 'touch',
          'overflow-y': 'auto',
          'overscroll-behavior-y': 'contain',
        },
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        // GPU acceleration
        '.gpu-accelerated': {
          'transform': 'translateZ(0)',
          'will-change': 'transform, opacity',
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
        },
        
        // Text shadow
        '.text-shadow-luxury': {
          'text-shadow': '0 2px 10px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-sm': {
          'text-shadow': '0 1px 3px rgba(0, 0, 0, 0.4)',
        },
        
        // Glass morphism
        '.glass': {
          'background': 'rgba(17, 24, 39, 0.8)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.8)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.05)',
        },
        
        // Contain utility for performance
        '.contain-strict': {
          'contain': 'strict',
        },
        '.contain-layout': {
          'contain': 'layout style paint',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
