import { defineNuxtConfig } from 'nuxt/config'

/**
 * Nuxt configuration for the onboarding application.
 *
 * - Exposes Stripe publishable key to the client via the public runtimeConfig.
 * - Keeps secret and webhook keys on the server side only.
 */
export default defineNuxtConfig({
  // Include Tailwind CSS module for styling.  This pulls in Tailwind at build
  // time and eliminates the need for injecting a CDN link.  It also reads
  // the CSS file defined below.
  modules: ['@nuxtjs/tailwindcss'],
  // Import our Tailwind entrypoint so Nuxt can compile it.  If this file
  // doesn't exist yet it will be created in assets/css/tailwind.css.
  css: ['@/assets/css/tailwind.css'],
  // Use Nitro server routes and composables
  runtimeConfig: {
    // These secrets should be defined in your environment (e.g. .env file)
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    // Values under the `public` key are exposed to the client.
    public: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      // The ID of your Stripe Pricing Table.  Create a pricing table in
      // Stripe Dashboard and set STRIPE_PRICING_TABLE_ID in your .env file.
      stripePricingTableId: process.env.STRIPE_PRICING_TABLE_ID,
      baseURL: process.env.PUBLIC_BASE_URL || 'http://localhost:3000'
    }
  },
  // Optional: enable source maps in development for easier debugging
  sourcemap: {
    server: true,
    client: true
  }
})

