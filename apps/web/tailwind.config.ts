import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        base: ['1rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
};

export default config;
