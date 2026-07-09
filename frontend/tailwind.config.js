/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#f7f5ef",
        pitch: "#dfe7d9",
        boundary: "#ff5a2f",
        trophy: "#f7c948",
        royal: "#3d63ff",
        wicket: "#22b86a",
        "rcb-red": "#be1e2d",
        "csk-yellow": "#f9cb05",
        // Pipeline medallion colors
        bronze: "#cd7f32",
        silver: "#9ea3aa",
        gold: "#d4af37",
        // Extended palette
        "warm-100": "#fdf8f3",
        "warm-200": "#f5ede0",
        "warm-300": "#e8d9c4",
      },
      boxShadow: {
        hard: "8px 8px 0 #171717",
        soft: "0 24px 60px rgba(23, 23, 23, 0.12)",
        player: "0 32px 64px rgba(0,0,0,0.28), 0 8px 16px rgba(0,0,0,0.12)",
        "shape-glow": "0 0 40px rgba(255, 90, 47, 0.3)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "float-medium": "float 4.5s ease-in-out infinite",
        "float-fast": "float 3.5s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite",
        "spin-reverse": "spin-reverse 16s linear infinite",
        "reveal-up": "reveal-up 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
        "reveal-up-1": "reveal-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s forwards",
        "reveal-up-2": "reveal-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s forwards",
        "reveal-up-3": "reveal-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s forwards",
        "reveal-up-4": "reveal-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.45s forwards",
        "reveal-up-5": "reveal-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.6s forwards",
        "pipeline-pulse": "pipeline-pulse 2.5s ease-in-out infinite",
        "dot-flow": "dot-flow 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "spin-reverse": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(-360deg)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(40px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pipeline-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scaleX(1)" },
          "50%": { opacity: "1", transform: "scaleX(1.02)" },
        },
        "dot-flow": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "20%": { opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
