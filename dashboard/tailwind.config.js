/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    850: '#151e32',
                    950: '#020617',
                },
                primary: {
                    500: '#10b981', // Emerald 500
                    600: '#059669', // Emerald 600
                },
                danger: {
                    500: '#ef4444', // Red 500
                },
                warning: {
                    500: '#f59e0b', // Amber 500
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
