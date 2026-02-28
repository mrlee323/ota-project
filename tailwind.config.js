/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6728E0",
          50: "#F4EFFE",
          100: "#E5D9FC",
          200: "#C9B0F9",
          300: "#AD87F5",
          400: "#8B55EF",
          500: "#6728E0",
          600: "#5520B8",
          700: "#431990",
          800: "#311268",
          900: "#1F0B40",
        },
      },
    },
  },
  plugins: [],
};
