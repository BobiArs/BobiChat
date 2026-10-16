/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bobi: {
          bg: "#1E1A17", // Темно-кавовий/картонний фон
          card: "#2A2420", // Карточки, чати
          secondary: "#3A322C", // Другорядні елементи / ховер
          accent: "#E89D43", // Яскравий золотисто-помаранчевий
          warm: "#C89968", // М'який бежевий
          text: "#F4EAE1", // Основний текст
          subtext: "#A6988B", // Другорядний текст
        },
      },
    },
  },
  plugins: [],
};
