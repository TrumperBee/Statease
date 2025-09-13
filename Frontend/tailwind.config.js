/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom colors (optional, so you don’t repeat hex values everywhere)
                primary: {
                    DEFAULT: "#2563eb", // blue-600
                    dark: "#1d4ed8", // blue-700
                },
                secondary: {
                    DEFAULT: "#e5e7eb", // gray-200
                    dark: "#d1d5db", // gray-300
                },
            },
            fontFamily: {
                // lets you do font-sans, font-serif, font-mono easily
                sans: ["Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"), // better form styles
        require("@tailwindcss/typography"), // prose for articles/docs
        require("@tailwindcss/aspect-ratio"), // easy responsive images/videos
    ],
}