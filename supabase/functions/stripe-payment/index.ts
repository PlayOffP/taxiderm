import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-12-18.acacia',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    // Create Payment Intent
    if (path === 'create-payment-intent' && req.method === 'POST') {
      const { jobId, amount, paymentType, customerId } = await req.json();

      if (!jobId || !amount) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: jobId, amount' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('job')
        .select('*, customer:customer_id(*)')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Create or get Stripe customer
      let stripeCustomerId = customerId;
      if (!stripeCustomerId && job.customer?.email) {
        const customer = await stripe.customers.create({
          email: job.customer.email,
          name: job.customer.name,
          phone: job.customer.phone,
          metadata: {
            customer_id: job.customer.id,
          },
        });
        stripeCustomerId = customer.id;
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: stripeCustomerId,
        metadata: {
          job_id: jobId,
          invoice_no: job.invoice_no,
          payment_type: paymentType || 'deposit',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          customerId: stripeCustomerId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Confirm Payment and Record in Database
    if (path === 'confirm-payment' && req.method === 'POST') {
      const {
        jobId,
        paymentIntentId,
        amount,
        paymentType,
        processingFee,
      } = await req.json();

      if (!jobId || !paymentIntentId || !amount) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Retrieve payment intent to get payment details
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return new Response(
          JSON.stringify({ error: 'Payment not completed' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get charge details for card info
      const charge = paymentIntent.latest_charge
        ? await stripe.charges.retrieve(paymentIntent.latest_charge as string)
        : null;

      const cardLast4 = charge?.payment_method_details?.card?.last4 || null;
      const cardBrand = charge?.payment_method_details?.card?.brand || null;

      // Record payment in database
      const { data: payment, error: paymentError } = await supabase
        .from('payment')
        .insert({
          job_id: jobId,
          method: 'card',
          total: amount,
          payment_type: paymentType || 'deposit',
          stripe_payment_intent_id: paymentIntentId,
          stripe_charge_id: charge?.id || null,
          stripe_customer_id: paymentIntent.customer as string,
          card_last4: cardLast4,
          card_brand: cardBrand,
          processing_fee: processingFee || 0,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (paymentError) {
        return new Response(
          JSON.stringify({ error: 'Failed to record payment', details: paymentError }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update job status
      if (paymentType === 'deposit') {
        await supabase
          .from('job')
          .update({
            deposit_paid: true,
            deposit_amount: amount,
          })
          .eq('id', jobId);
      } else if (paymentType === 'final') {
        await supabase
          .from('job')
          .update({
            status: 'paid',
          })
          .eq('id', jobId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          payment,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Payment History
    if (path === 'payment-history' && req.method === 'GET') {
      const jobId = url.searchParams.get('jobId');

      if (!jobId) {
        return new Response(
          JSON.stringify({ error: 'Missing jobId parameter' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: payments, error } = await supabase
        .from('payment')
        .select('*')
        .eq('job_id', jobId)
        .order('paid_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch payments' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ payments }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});