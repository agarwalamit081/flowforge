import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16211d",
        moss: "#2e5e4e",
        leaf: "#a9c9b8",
        cream: "#f5f0e6",
        coral: "#e98c68"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(22, 33, 29, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
