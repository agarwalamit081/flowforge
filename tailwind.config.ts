import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16211d",
        "ink-light": "#2a3f36",
        moss: "#2e5e4e",
        "moss-light": "#3d7a6a",
        leaf: "#a9c9b8",
        "leaf-light": "#c8ddd1",
        "leaf-dark": "#88b0a0",
        cream: "#f5f0e6",
        coral: "#e98c68",
        "coral-light": "#f0a882"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(22, 33, 29, 0.12)",
        "soft-lg": "0 30px 80px rgba(22, 33, 29, 0.15)"
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem"
      }
    }
  },
  plugins: []
} satisfies Config;
