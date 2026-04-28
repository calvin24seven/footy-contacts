#!/usr/bin/env node
/**
 * One-time script to create Stripe products + prices for footy-contacts.
 *
 * Run with your Stripe secret key:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe-plans.mjs
 *
 * After running, copy the price IDs printed at the end and update the DB:
 *   UPDATE plans SET stripe_monthly_price_id = '...', stripe_yearly_price_id = '...' WHERE code = 'pro';
 *   UPDATE plans SET stripe_monthly_price_id = '...', stripe_yearly_price_id = '...' WHERE code = 'agency';
 */

import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error("❌  STRIPE_SECRET_KEY env var is required.")
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: "2025-04-30.basil" })

async function createPlan({ name, code, monthlyAmount, yearlyAmount }) {
  console.log(`\n🔧  Creating product: ${name}`)

  const product = await stripe.products.create({
    name,
    metadata: { plan_code: code },
  })
  console.log(`   Product: ${product.id}`)

  const monthly = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: monthlyAmount,
    recurring: { interval: "month" },
    nickname: `${name} Monthly`,
    metadata: { plan_code: code, billing_period: "monthly" },
  })
  console.log(`   Monthly price: ${monthly.id}  (£${(monthlyAmount / 100).toFixed(2)}/mo)`)

  const yearly = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: yearlyAmount,
    recurring: { interval: "year" },
    nickname: `${name} Yearly`,
    metadata: { plan_code: code, billing_period: "yearly" },
  })
  console.log(`   Yearly price:  ${yearly.id}  (£${(yearlyAmount / 100).toFixed(2)}/yr)`)

  return { code, monthly: monthly.id, yearly: yearly.id }
}

const results = await Promise.all([
  createPlan({ name: "Footy Contacts Pro",    code: "pro",    monthlyAmount: 3900,  yearlyAmount: 39000  }),
  createPlan({ name: "Footy Contacts Agency", code: "agency", monthlyAmount: 14900, yearlyAmount: 149000 }),
])

console.log("\n\n✅  Done! Run the following SQL to link prices to your DB:\n")
for (const r of results) {
  console.log(`UPDATE plans SET`)
  console.log(`  stripe_monthly_price_id = '${r.monthly}',`)
  console.log(`  stripe_yearly_price_id  = '${r.yearly}'`)
  console.log(`WHERE code = '${r.code}';\n`)
}
