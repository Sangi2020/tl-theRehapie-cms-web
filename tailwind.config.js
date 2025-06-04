/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
import animations from '@midudev/tailwind-animations';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui, animations],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#3B82F6", // bright blue
          secondary: "#6366F1", // indigo
          accent: "#F59E0B", // amber
          neutral: "#F3F4F6", // light gray
          "neutral-content": "#111827", // dark text
          "base-100": "#FFFFFF", // background
          "base-200": "#F9FAFB",
          "base-300": "#E5E7EB",
          stroke: "#D1D5DB", // border
          info: "#0EA5E9", // sky
          success: "#10B981", // emerald
          warning: "#FBBF24", // yellow
          error: "#EF4444", // red
        },
        dark: {
          primary: "#60A5FA", // soft blue
          secondary: "#A78BFA", // light violet
          accent: "#FCD34D", // warm yellow
          neutral: "#1F2937", // gray-800
          "neutral-content": "#F9FAFB", // near white
          "base-100": "#111827", // background
          "base-200": "#1E293B",
          "base-300": "#374151",
          stroke: "#4B5563", // border
          info: "#38BDF8", // sky
          success: "#34D399", // green
          warning: "#FBBF24", // yellow
          error: "#F87171", // red
        }
      }
    ],
  },
}
