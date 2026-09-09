/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Be Vietnam Pro", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        ink: "#172033",
        brand: { 50: "#fff7ed", 100: "#ffedd5", 500: "#f47a1f", 600: "#e56812", 700: "#bd4f0d" },
      },
      boxShadow: {
        soft: "0 18px 55px -28px rgba(23,32,51,.28)",
        card: "0 14px 40px -26px rgba(23,32,51,.3)",
      },
    },
  },
  plugins: [],
};
