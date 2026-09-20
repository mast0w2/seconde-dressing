/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-jost)', 'Jost', 'Avenir Next', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        // Seconde — palette chaleureuse & responsable (vert forêt / sauge / crème)
        'noir': '#2e3a2c',
        'gris-fonce': '#23301e',
        'gris-moyen': '#5c6653',
        'gris-clair': '#ede9df',
        'gris-tres-clair': '#faf8f3',
        'blanc': '#f4f1ea',
        'beige': '#faf8f3',
        'creme': '#f4f1ea',

        // Accents botaniques
        'sauge': '#8b9a7a',
        'sauge-clair': '#c7d0b7',
        'sauge-fonce': '#6f7d62',
        'foret': '#2e3a2c',

        // Semantic colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'brand': '0px',
        'brand-sm': '2px',
      },
      spacing: {
        'brand-xs': '8px',
        'brand-sm': '16px',
        'brand-md': '24px',
        'brand-lg': '32px',
        'brand-xl': '40px',
        'brand-2xl': '48px',
        'brand-3xl': '80px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
