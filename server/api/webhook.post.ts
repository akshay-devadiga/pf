import Stripe from 'stripe'
import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

/**
 * Stripe webhook handler.
 *
 * Stripe can be configured to send events to this endpoint.  The handler
 * verifies the signature using your webhook secret and logs important events
 * such as `checkout.session.completed`.  In a real application you would
 * persist the event details to a database and update your business logic
 * accordingly.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripeSecretKey = config.stripeSecretKey
  const webhookSecret = config.stripeWebhookSecret
  if (!stripeSecretKey || !webhookSecret) {
    throw new Error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
  }
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16'
  })
  const signature = event.node.req.headers['stripe-signature'] as string | undefined
  // Read the raw request body from the Node.js incoming message stream. This
  // avoids relying on h3 helpers that may not be available in the production
  // build and preserves the exact bytes required by Stripe's signature check.
  const chunks: Uint8Array[] = []
  for await (const chunk of event.node.req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const rawBody = Buffer.concat(chunks)
  let stripeEvent: Stripe.Event
  try {
    if (!signature) throw new Error('Missing stripe-signature header')
    stripeEvent = stripe.webhooks.constructEvent(rawBody as any, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed', err.message)
    return { error: `Webhook signature verification failed: ${err.message}` }
  }
  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      // Here you could update your database or trigger additional actions.
      console.log(`✅ Payment succeeded for session ${session.id}`)
      break
    }
    default:
      console.log(`Received unhandled event: ${stripeEvent.type}`)
      break
  }
  return { received: true }
})