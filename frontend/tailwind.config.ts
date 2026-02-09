import type { Config } from 'tailwindcss';

export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                bkpk: {
                    primary: 'var(--bkpk-color-primary)',
                    'primary-hover': 'var(--bkpk-color-primary-hover)',
                    'primary-active': 'var(--bkpk-color-primary-active)',
                    'primary-fill': 'var(--bkpk-color-primary-fill)',
                    'primary-fill-hover': 'var(--bkpk-color-primary-fill-hover)',
                    'primary-fill-active': 'var(--bkpk-color-primary-fill-active)',
                    bg: 'var(--bkpk-color-bg)',
                    surface: 'var(--bkpk-color-surface)',
                    'surface-elevated': 'var(--bkpk-color-surface-elevated)',
                    glass: 'var(--bkpk-glass-bg)',
                    'glass-border': 'var(--bkpk-glass-border)',
                    success: 'var(--bkpk-color-success)',
                    'success-fill': 'var(--bkpk-color-success-fill)',
                    'success-fill-hover': 'var(--bkpk-color-success-fill-hover)',
                    'success-fill-active': 'var(--bkpk-color-success-fill-active)',
                    danger: 'var(--bkpk-color-danger)',
                    'danger-fill': 'var(--bkpk-color-danger-fill)',
                    'danger-fill-hover': 'var(--bkpk-color-danger-fill-hover)',
                    'danger-fill-active': 'var(--bkpk-color-danger-fill-active)',
                    warning: 'var(--bkpk-color-warning)',
                    'warning-fill': 'var(--bkpk-color-warning-fill)',
                    'warning-fill-hover': 'var(--bkpk-color-warning-fill-hover)',
                    'warning-fill-active': 'var(--bkpk-color-warning-fill-active)',
                    'border-subtle': 'var(--bkpk-border-subtle)',
                    'border-strong': 'var(--bkpk-border-strong)',
                    'text-primary': 'var(--bkpk-text-primary)',
                    'text-secondary': 'var(--bkpk-text-secondary)',
                    'text-muted': 'var(--bkpk-text-muted)',
                    'surface-tint-1': 'var(--bkpk-surface-tint-1)',
                    'surface-tint-2': 'var(--bkpk-surface-tint-2)',
                    'surface-tint-3': 'var(--bkpk-surface-tint-3)',
                    'surface-tint-4': 'var(--bkpk-surface-tint-4)',
                    'surface-tint-5': 'var(--bkpk-surface-tint-5)',
                    'surface-tint-6': 'var(--bkpk-surface-tint-6)',
                    'overlay-weak': 'var(--bkpk-overlay-weak)',
                    'overlay-medium': 'var(--bkpk-overlay-medium)',
                    'overlay-strong': 'var(--bkpk-overlay-strong)',
                    info: 'var(--bkpk-color-info)',
                },
            },
            borderRadius: {
                'bkpk-md': 'var(--bkpk-radius-md)',
                'bkpk-lg': 'var(--bkpk-radius-lg)',
            },
            fontSize: {
                // Display
                'display': ['48px', { lineHeight: '1.1', fontWeight: '900' }],
                'h1': ['30px', { lineHeight: '1.2', fontWeight: '800' }],
                'h2': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
                'h3': ['20px', { lineHeight: '1.4', fontWeight: '700' }],
                // Body
                'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
                'body-bold': ['14px', { lineHeight: '1.6', fontWeight: '700' }],
                // Caption & Metadata
                'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
                'caption-bold': ['12px', { lineHeight: '1.4', fontWeight: '700' }],
                // Small Text Scale
                'xs': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
                '2xs': ['10px', { lineHeight: '1.2', fontWeight: '700' }],
                // Tiny (Discouraged, use sparingly)
                'tiny': ['11px', { lineHeight: '1.2', fontWeight: '700' }],
            },
            backdropBlur: {
                'bkpk-glass': 'var(--bkpk-glass-blur)',
            },
            boxShadow: {
                'bkpk-glow': 'var(--bkpk-shadow-glow)',
            },
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
} satisfies Config;
