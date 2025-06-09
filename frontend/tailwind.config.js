/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Catppuccin Mocha (dark) theme colors
                rosewater: {
                    DEFAULT: '#f5e0dc',
                    dark: '#f5e0dc',
                },
                flamingo: {
                    DEFAULT: '#f2cdcd',
                    dark: '#f2cdcd',
                },
                pink: {
                    DEFAULT: '#f5c2e7',
                    dark: '#f5c2e7',
                },
                mauve: {
                    DEFAULT: '#cba6f7',
                    dark: '#cba6f7',
                },
                red: {
                    DEFAULT: '#f38ba8',
                    dark: '#f38ba8',
                },
                maroon: {
                    DEFAULT: '#eba0ac',
                    dark: '#eba0ac',
                },
                peach: {
                    DEFAULT: '#fab387',
                    dark: '#fab387',
                },
                yellow: {
                    DEFAULT: '#f9e2af',
                    dark: '#f9e2af',
                },
                green: {
                    DEFAULT: '#a6e3a1',
                    dark: '#a6e3a1',
                },
                teal: {
                    DEFAULT: '#94e2d5',
                    dark: '#94e2d5',
                },
                sky: {
                    DEFAULT: '#89dceb',
                    dark: '#89dceb',
                },
                sapphire: {
                    DEFAULT: '#74c7ec',
                    dark: '#74c7ec',
                },
                blue: {
                    DEFAULT: '#89b4fa',
                    dark: '#89b4fa',
                },
                lavender: {
                    DEFAULT: '#b4befe',
                    dark: '#b4befe',
                },
                text: {
                    DEFAULT: '#4c4f69', // Latte
                    dark: '#cdd6f4', // Mocha
                },
                subtext1: {
                    DEFAULT: '#5c5f77', // Latte
                    dark: '#bac2de', // Mocha
                },
                subtext0: {
                    DEFAULT: '#6c6f85', // Latte
                    dark: '#a6adc8', // Mocha
                },
                overlay2: {
                    DEFAULT: '#7c7f93', // Latte
                    dark: '#9399b2', // Mocha
                },
                overlay1: {
                    DEFAULT: '#8c8fa1', // Latte
                    dark: '#7f849c', // Mocha
                },
                overlay0: {
                    DEFAULT: '#9ca0b0', // Latte
                    dark: '#6c7086', // Mocha
                },
                surface2: {
                    DEFAULT: '#acb0be', // Latte
                    dark: '#585b70', // Mocha
                },
                surface1: {
                    DEFAULT: '#bcc0cc', // Latte
                    dark: '#45475a', // Mocha
                },
                surface0: {
                    DEFAULT: '#ccd0da', // Latte
                    dark: '#313244', // Mocha
                },
                base: {
                    DEFAULT: '#eff1f5', // Latte
                    dark: '#1e1e2e', // Mocha
                },
                mantle: {
                    DEFAULT: '#e6e9ef', // Latte
                    dark: '#181825', // Mocha
                },
                crust: {
                    DEFAULT: '#dce0e8', // Latte
                    dark: '#11111b', // Mocha
                },
            },
        },
    },
    plugins: [],
} 