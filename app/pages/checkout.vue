<template>
  <section class="checkout-section">
    <h2 class="title">Secure Payment</h2>
    <p class="subtitle">Complete your purchase using our embedded payment form.</p>
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-if="loading" class="loading">
      Loading checkout...
    </div>
    <div v-show="!loading" id="checkout-element" class="checkout-element"></div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { loadStripe } from '@stripe/stripe-js'

const config = useRuntimeConfig()
const route = useRoute()

const loading = ref(true)
const error = ref<string | null>(null)

/**
 * Initializes the embedded Stripe Checkout.  It requests a client secret
 * from the server based on the selected price ID and then mounts the
 * embedded checkout element into the page.  When the user completes
 * payment, Stripe automatically redirects them to the return URL.
 */
onMounted(async () => {
  const priceId = route.query.priceId as string
  if (!priceId) {
    error.value = 'Missing priceId parameter.'
    loading.value = false
    return
  }
  // Ensure the publishable key is available before loading Stripe.js
  const publishableKey = config.public.stripePublishableKey as string | undefined
  if (!publishableKey) {
    error.value = 'Missing STRIPE_PUBLISHABLE_KEY. Copy `.env.example` to `.env` and set your publishable key.'
    loading.value = false
    return
  }
  // Load the Stripe.js library using the publishable key from runtime config
  const stripe = await loadStripe(publishableKey)
  if (!stripe) {
    error.value = 'Unable to load Stripe.js'
    loading.value = false
    return
  }
  try {
    // Request a client secret from our backend
    const { clientSecret } = await $fetch('/api/create-checkout-session', {
      method: 'POST',
      body: { priceId }
    })
    // Initialise the embedded checkout as described in Stripe’s docs【672376252665153†L593-L609】
    const checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret: async () => clientSecret
    })
    checkout.mount('#checkout-element')
    loading.value = false
  } catch (err: any) {
    console.error(err)
    error.value = err?.message ?? 'Failed to initialise checkout.'
    loading.value = false
  }
})
</script>

<style scoped>
.checkout-section {
  max-width: 600px;
  margin: 2rem auto;
  background-color: #fff;
  padding: 2rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}
.loading {
  color: #666;
  margin-bottom: 1rem;
}
.error {
  color: #c90000;
  margin-bottom: 1rem;
}
.checkout-element {
  width: 100%;
}
</style>