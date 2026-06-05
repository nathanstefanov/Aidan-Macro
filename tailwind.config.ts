import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#19724b",
          dark: "#0d5d3c",
          soft: "#eff8f2",
        },
        bg: "#faf9f5",
        card: "#ffffff",
        ink: "#17231c",
        muted: "#708078",
        line: "#e8ebe5",
        accent: "#ff8b46",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "DM Sans", "sans-serif"],
        display: ["var(--font-display)", "Manrope", "sans-serif"],
      },
      boxShadow: {
        card: "0 16px 40px rgba(31,53,42,0.08)",
        meal: "0 9px 27px rgba(61,94,78,0.07)",
        hero: "0 20px 40px rgba(89,134,96,0.12)",
        search: "0 14px 28px rgba(89,134,96,0.094)",
      },
    },
  },
  plugins: [],
};

export default config;
