/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0e14',
                card: '#161b22',
                border: 'rgba(255,255,255,0.1)',
                muted: '#8b949e',
            },
            fontFamily: {
                heading: ['Outfit', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
