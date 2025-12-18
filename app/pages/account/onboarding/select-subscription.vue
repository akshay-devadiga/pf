<template>
  <!-- Use Stripe Pricing Table to present plans and embedded checkout in one step -->
  <section class="max-w-screen-lg mx-auto mt-16 px-4">
    <h2 class="text-2xl font-semibold mb-4 text-center">Choose your subscription</h2>
    <p class="text-gray-600 mb-8 text-center">Pick a bundle and complete payment in one step.</p>
    <!-- ClientOnly ensures the pricing table renders only on the client side -->
    <ClientOnly>
      <div class="w-full">
        <div v-if="error" class="text-center text-red-600 font-medium">{{ error }}</div>
        <stripe-pricing-table
          v-else
          :pricing-table-id="pricingTableId"
          :publishable-key="publishableKey"
        />
      </div>
    </ClientOnly>
  </section>
</template>

<script setup lang="ts">
import { useRuntimeConfig, useHead } from '#imports'
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

// Access public runtime configuration for Stripe keys
const config = useRuntimeConfig()
const publishableKey = config.public.stripePublishableKey as string
const pricingTableId = config.public.stripePricingTableId as string
const router = useRouter()

// Inject the Stripe Pricing Table script into the document head if config is present
if (!publishableKey || !pricingTableId) {
  // Inform the developer immediately in the UI if required config is missing
  error.value = 'Missing STRIPE_PUBLISHABLE_KEY or STRIPE_PRICING_TABLE_ID. Check `.env`.'
} else {
  useHead({
    script: [
      {
        src: 'https://js.stripe.com/v3/pricing-table.js',
        defer: true
      }
    ]
  })
}

// Listen for postMessage events from the Stripe embed. When a checkout
// completes the embed will often post a message; we handle common message
// shapes and redirect the user to `/dashboard` on success. We also support
// a fallback where the message contains a `session_id` — in that case we
// verify the session via `/api/session-status` before redirecting.
const error = ref<string | null>(null)

// Listen for postMessage events from the Stripe embed. When a checkout
// completes the embed will often post a message; we handle common message
// shapes and redirect the user to `/dashboard` on success. We also support
// a fallback where the message contains a `session_id` — in that case we
// verify the session via `/api/session-status` before redirecting.
//
// See Stripe docs for Pricing Table embeds and common event shapes:
// https://stripe.com/docs/payments/pricing-tables
const handleMessage = async (event: any) => {
  if (!event?.data) return

  // Only accept messages that originate from Stripe domains for security.
  // Stripe embeds post messages from stripe.com subdomains (e.g. checkout.stripe.com).
  if (typeof event.origin === 'string' && !event.origin.includes('stripe.com')) return

  const data = event.data
  // Debugging help when diagnosing embed behavior
  // console.debug('Stripe embed message', data)

  // Common cases: string messages containing a completion marker
  if (typeof data === 'string') {
    if (data.includes('checkout.session.completed') || data.includes('Checkout.session.completed')) {
      router.push('/dashboard')
      return
    }
  }

  // Object messages: look for well-known fields
  if (typeof data === 'object') {
    // If the embed gives us a session id, verify the session status before redirecting
    const sessionId = data.session_id || data.sessionId || data.checkout_session_id || data.checkout?.id
    if (sessionId) {
      try {
        const res: any = await $fetch('/api/session-status', { method: 'GET', params: { session_id: sessionId } })
        if (res?.status === 'complete') {
          router.push('/dashboard')
        }
      } catch (err) {
        console.warn('Failed to verify session status', err)
      }
      return
    }

    // Some embeds post an explicit `type` field
    const type = (data.type as string) || data.event || ''
    if (type && type.includes('checkout.session.completed')) {
      router.push('/dashboard')
      return
    }
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>