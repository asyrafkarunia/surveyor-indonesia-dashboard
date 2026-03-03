import forms from '@tailwindcss/forms';
import container from '@tailwindcss/container-queries';

export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  safelist: [
    // Brand & primary tokens
    'bg-primary','hover:bg-primary','bg-primary-dark','hover:bg-primary-dark',
    'text-primary','border-primary','ring-primary','ring-primary/30',
    'bg-background-light','text-white','text-slate-900','border-slate-200','bg-white',
    // Common semantic actions
    'bg-emerald-600','hover:bg-emerald-700','text-emerald-600',
    'bg-red-600','hover:bg-red-700','text-red-600',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#d33131",
        "primary-dark": "#b91c1c",
        "background-light": "#f8f6f6",
        "brand-blue": "#0D3B66",
        "brand-teal": "#0FBFBF",
        "accent-orange": "#FF6A00",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
    },
  },
  darkMode: "class",
  plugins: [forms, container],
}