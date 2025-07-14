/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#1e1e1e",
        "dark-sidebar": "#252526",
        "dark-panel": "#2d2d30",
        "dark-border": "#3e3e42",
        "dark-hover": "#37373d",
        "dark-input": "#3c3c3c",
        "text-primary": "#ffffff",
        "text-secondary": "#cccccc",
        "text-muted": "#858585",
        "accent-blue": "#007acc",
        "accent-orange": "#ff6b35",
      },
      fontFamily: {
        system: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      width: {
        70: "280px",
      },
      minWidth: {
        20: "80px",
      },
    },
  },
  plugins: [],
};
