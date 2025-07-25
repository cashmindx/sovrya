import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, email, amount, item_name } = req.body;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX === 'true';
  const baseUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  try {
    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await authResponse.json();

    // Create product
    const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        name: 'Sovrya Premium',
        type: 'SERVICE',
        description: 'Premium subscription for Sovrya AI',
      }),
    });
    const { id: productId } = await productResponse.json();

    // Create subscription plan
    const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        name: 'Sovrya Premium Subscription',
        description: item_name,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: amount.toFixed(2), currency_code: 'USD' } },
          },
        ],
        payment_preferences: { auto_bill_outstanding: true },
      }),
    });
    const { id: planId } = await planResponse.json();

    // Create subscription
    const subscriptionResponse = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: { email_address: email },
        custom_id: `sovrya_${userId}`,
        application_context: {
          return_url: 'https://sovrya-ai.netlify.app/success',
          cancel_url: 'https://sovrya-ai.netlify.app/cancel',
        },
      }),
    });
    const { id: subscriptionId } = await subscriptionResponse.json();

    // Store in Firebase
    await setDoc(doc(db, 'subscriptions', subscriptionId), {
      userId,
      status: 'pending',
      plan: 'premium',
      paypalSubscriptionId: subscriptionId,
      amount: parseFloat(amount),
      currency: 'USD',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return res.status(200).json({ subscriptionId });
  } catch (error) {
    console.error('PayPal error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
