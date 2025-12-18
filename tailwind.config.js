/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Scan within the `app/` directory for any classes used in Vue files.
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.ts'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}