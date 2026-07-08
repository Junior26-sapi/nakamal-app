import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-01-27.acme' as any // Standard stable or modern API version
    });
  }
  return stripeClient;
}

// Persistent in-memory mock invoices for real-time local updates
let globalMockInvoices = [
  { id: 'inv_101', amount: 29, status: 'paid', date: Date.now() - 86400000 * 15, description: 'Monthly Pro Subscription' },
  { id: 'inv_102', amount: 99, status: 'unpaid', date: Date.now() - 86400000 * 45, description: 'Enterprise Custom SLA' },
  { id: 'inv_103', amount: 49, status: 'unpaid', date: Date.now() - 86400000 * 10, description: 'Starter Yearly Billing' },
  { id: 'inv_104', amount: 299, status: 'paid', date: Date.now() - 86400000 * 60, description: 'Custom Portal Integration' },
];

let supabaseAdmin: any = null;
function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[SUPABASE ADMIN] Supabase URL or Key missing in environmental variables.');
    return null;
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseAdmin;
}

// Process webhook transactions asynchronously
async function processWebhookEventAsynchronously(event: any) {
  console.log(`[STRIPE WEBHOOK] Asynchronously processing event type: ${event.type}`);

  const obj = event.data?.object || event;
  if (!obj) return;

  const metadata = obj.metadata || {};
  const userId = metadata.userId;
  const planId = metadata.planId || 'monthly';
  const invoiceId = metadata.invoiceId;

  console.log('[STRIPE WEBHOOK] Metadata extracted:', { userId, planId, invoiceId });

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'payment_intent.succeeded' ||
    event.type === 'simulated.payment.succeeded'
  ) {
    // 1. Harmonize state check triggers for immediate live view feedback
    if (invoiceId) {
      const inv = globalMockInvoices.find(i => i.id === invoiceId);
      if (inv) {
        inv.status = 'paid';
        console.log(`[STRIPE WEBHOOK] Success: Synchronized local mock invoice: ${invoiceId}`);
      }
    }

    // 2. Perform asynchronous Supabase database update
    if (userId) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        let durationMs = 30 * 24 * 60 * 60 * 1000;
        switch (planId) {
          case 'quarterly': durationMs = 90 * 24 * 60 * 60 * 1000; break;
          case 'annual': durationMs = 365 * 24 * 60 * 60 * 1000; break;
        }
        const currentPeriodEnd = Date.now() + durationMs;

        const updatedSubscriptionObj = {
          planId,
          status: 'active',
          currentPeriodEnd,
          autoRenew: true,
          isTrial: false
        };

        console.log(`[STRIPE WEBHOOK] Asynchronously syncing subscription parameters for User: ${userId}`);

        const { error } = await supabase
          .from('users')
          .update({
            subscription_active: true,
            subscription: updatedSubscriptionObj,
            approved: true,
            "subscriptionActive": true
          })
          .eq('id', userId);

        if (error) {
          console.error(`[STRIPE WEBHOOK] Database write failure:`, error.message);
        } else {
          console.log(`[STRIPE WEBHOOK] Asynchronously updated database tables for account validation successfully.`);
        }
      }
    }
  }
}


import { b2bMessagingFlow } from './src/ai/flows/b2bMessaging.js';
import { productPromoFlow } from './src/ai/flows/productPromo.js';

dotenv.config();

const __dirname = path.resolve();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  // Map of connected clients by user id
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    let clientId = '';
    console.log('[WS] Client connection initiated');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'auth') {
          clientId = data.userId;
          clients.set(clientId, ws);
          console.log(`[WS] Authenticated user connected: ${clientId}`);
          ws.send(JSON.stringify({ type: 'authenticated', status: 'ok' }));
        } else if (data.type === 'broadcast') {
          const recipientIds = data.recipientIds || [];
          const payload = JSON.stringify({
            type: data.payloadType || 'sync',
            payload: data.payload,
            senderId: clientId
          });
          
          if (recipientIds.length === 0) {
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(payload);
              }
            });
          } else {
            recipientIds.forEach((id: string) => {
              const clientWs = clients.get(id);
              if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(payload);
              }
            });
          }
        }
      } catch (err) {
        console.error('[WS] Error processing message:', err);
      }
    });

    ws.on('close', () => {
      if (clientId) {
        clients.delete(clientId);
        console.log(`[WS] Client disconnected: ${clientId}`);
      }
    });
  });

  // Stripe webhook event listener (MUST be parsed with raw body to verify signatures)
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.warn('[STRIPE WEBHOOK] Missing stripe-signature or STRIPE_WEBHOOK_SECRET. Bypassing check & running simulation for dev sandboxes.');
      // Execute asynchronously on the payload for friendly sandbox simulation if keys aren't provisioned yet
      try {
        const payload = JSON.parse(req.body.toString());
        processWebhookEventAsynchronously(payload).catch((err) => {
          console.error('[STRIPE WEBHOOK] Async simulated processing failed:', err);
        });
        return res.json({ received: true, simulated: true });
      } catch (err: any) {
        return res.status(400).send(`Webhook simulation fallback error: ${err.message}`);
      }
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe backend client is unconfigured.' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[STRIPE WEBHOOK] Verification error: ${err.message}`);
      return res.status(400).send(`Webhook Signature Authentication Failed: ${err.message}`);
    }

    // Process of Stripe Event asynchronously to guarantee quick 200 OK callback acknowledgment
    processWebhookEventAsynchronously(event).catch((err) => {
      console.error('[STRIPE WEBHOOK] Async transaction processing crash:', err);
    });

    res.json({ received: true });
  });

  app.use(express.json());

  // Real-time programmatic broadcast endpoint
  app.post('/api/realtime/broadcast', (req, res) => {
    const { recipientIds, type, payload } = req.body;
    const wsPayload = JSON.stringify({ type, payload });

    if (!recipientIds || recipientIds.length === 0) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(wsPayload);
        }
      });
    } else {
      recipientIds.forEach((id: string) => {
        const clientWs = clients.get(id);
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(wsPayload);
        }
      });
    }

    res.json({ success: true, clientsConnected: wss.clients.size });
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Git Status Endpoint for Live Telemetry
  app.get('/api/git/status', async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD');
      const { stdout: remoteOut } = await execAsync('git remote get-url origin');
      
      // Get last 3 commits
      const { stdout: commitsOut } = await execAsync('git log -n 3 --oneline');

      // Get status short
      const { stdout: statusOut } = await execAsync('git status -s');

      res.json({
        success: true,
        branch: branchOut.trim(),
        remote: remoteOut.trim().replace(/ghp_[a-zA-Z0-9]+@/, '***@'), // Mask sensitive token for security
        commits: commitsOut.trim().split('\n').filter(Boolean),
        statusSummary: statusOut.trim() || 'Working directory clean and synchronized.'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to read Git repository status.'
      });
    }
  });

  // Secure Git Commit & Push Endpoint
  app.post('/api/git/sync', async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const commitMessage = req.body.message || `Production design upgrade via v0 AI System - ${new Date().toLocaleDateString()}`;

      // 1. Stage all changes
      await execAsync('git add .');

      // 2. Commit changes
      let commitOut = '';
      try {
        const { stdout } = await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
        commitOut = stdout;
      } catch (err: any) {
        if (err.stdout && (err.stdout.includes('nothing to commit') || err.stdout.includes('working tree clean'))) {
          commitOut = 'Nothing to commit, working tree clean.';
        } else {
          throw err;
        }
      }

      // 3. Push to main branch
      const { stdout: pushOut, stderr: pushErr } = await execAsync('git push origin main');

      res.json({
        success: true,
        commit: commitOut.trim(),
        push: (pushOut + '\n' + (pushErr || '')).trim(),
        message: 'Changes successfully pushed and committed to GitHub repository!'
      });
    } catch (error: any) {
      console.error('[GIT SYNC ERROR]:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute push to GitHub.',
        stderr: error.stderr || ''
      });
    }
  });

  // Genkit AI B2B Messaging Flow
  app.post('/api/ai/b2b-message', async (req, res) => {
    try {
      const result = await b2bMessagingFlow(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('[AI] Flow error:', error);
      res.status(500).json({ error: error.message || 'Internal AI error' });
    }
  });

  // Genkit AI Product Promotion Flow
  app.post('/api/ai/product-promo', async (req, res) => {
    try {
      const result = await productPromoFlow(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('[AI] Product Promo Flow error:', error);
      res.status(500).json({ error: error.message || 'Internal AI error' });
    }
  });

  // Google Gemini TTS Speech Synthesis Flow
  app.post('/api/ai/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text content is required for speech synthesis.' });
      }

      // Check for Google Gen AI Key
      if (!process.env.GEMINI_API_KEY) {
        console.warn('[SERVER] GEMINI_API_KEY is not defined in environments.');
        return res.status(500).json({ error: 'Gemini API environment variable is not configured.' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const voiceName = voice || 'Kore';  // Options: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      
      const response = await aiClient.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'Failed to synthesize audio using Gemini TTS.' });
      }

      res.json({ audio: base64Audio });
    } catch (error: any) {
      console.error('[AI] TTS synthesis error:', error);
      res.status(500).json({ error: error.message || 'Gemini TTS synthesis failed.' });
    }
  });

  // Google Gemini Real-Time Translation Flow
  app.post('/api/ai/translate', async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text content is required for translation.' });
      }

      const targetLabelMap: Record<string, string> = {
        fr: 'French',
        bi: 'Bislama',
        en: 'English'
      };
      
      const langName = targetLabelMap[targetLang] || targetLang || 'English';

      if (!process.env.GEMINI_API_KEY) {
        console.warn('[SERVER] GEMINI_API_KEY is not defined. Using mock translator.');
        let mockTranslation = text;
        if (targetLang === 'fr') {
          mockTranslation = `[FR] ${text} (Traduction)`;
        } else if (targetLang === 'bi') {
          mockTranslation = `[BI] ${text} (Translesen)`;
        }
        return res.json({ translatedText: mockTranslation });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are a professional multilingual translator for the Pacific Kava Ecosystem platform.
Translate the following text into ${langName}.
Keep all structural tags, numbers, user handles, and preserve the original emotional tone.
Only output the exact translated text. Do not add any greeting, intro, note, quotes unless part of original text, or explanation.

Text to translate:
${text}`,
      });

      const translatedText = response.text?.trim() || text;
      res.json({ translatedText });
    } catch (error: any) {
      console.error('[AI] Translation error:', error);
      res.status(500).json({ error: error.message || 'Gemini translation failed.' });
    }
  });

  // Manual Billing Instructions
  app.post('/api/create-checkout-session', async (req, res) => {
    const { planId, userId } = req.body;

    // Directing to manual payment instead of Stripe
    res.json({ 
      id: 'manual_' + Date.now(), 
      url: null, 
      instructions: true,
      bankDetails: {
        bank: 'Kava Global Bank',
        account: 'Kava Platform Operations',
        iban: 'KV98 7654 3210 1234 5678',
        swift: 'KAVAXK1'
      }
    });
  });

  // Backend Renewal Logic
  app.post('/api/admin/verify-payment', (req, res) => {
    const { userId, planId, isTrial } = req.body;
    
    let durationMs = 0;
    const now = Date.now();

    if (isTrial) {
      durationMs = 14 * 24 * 60 * 60 * 1000; // 14 Days
    } else {
      switch (planId) {
        case 'monthly': durationMs = 30 * 24 * 60 * 60 * 1000; break;
        case 'quarterly': durationMs = 90 * 24 * 60 * 60 * 1000; break;
        case 'annual': durationMs = 365 * 24 * 60 * 60 * 1000; break;
        default: durationMs = 30 * 24 * 60 * 60 * 1000;
      }
    }

    const currentPeriodEnd = now + durationMs;

    res.json({
      success: true,
      subscription: {
        planId: isTrial ? 'monthly' : planId,
        status: 'active',
        currentPeriodEnd,
        autoRenew: !isTrial,
        isTrial: !!isTrial
      }
    });
  });

  // Automated Expiry Check (Triggered via API)
  app.post('/api/subscriptions/check-expiry', (req, res) => {
    console.log('[SERVER] Received expiration check request');
    try {
      const { users } = req.body; 
      
      if (!Array.isArray(users)) {
        console.warn('[SERVER] Expiry check failed: Users is not an array');
        return res.status(400).json({ error: 'Users must be an array' });
      }

      const now = Date.now();
      let modifiedCount = 0;
      
      const updatedUsers = users.map((user: any) => {
        if (user.role === 'admin' || user.role === 'user') return user;
        
        const sub = user.subscription;
        if (sub && sub.status === 'active' && now > sub.currentPeriodEnd) {
          modifiedCount++;
          // Handle Auto-renewal if enabled
          if (sub.autoRenew && !sub.isTrial) {
            let durationMs = 30 * 24 * 60 * 60 * 1000;
            switch (sub.planId) {
              case 'quarterly': durationMs = 90 * 24 * 60 * 60 * 1000; break;
              case 'annual': durationMs = 365 * 24 * 60 * 60 * 1000; break;
            }
            return {
              ...user,
              subscription: {
                ...sub,
                currentPeriodEnd: sub.currentPeriodEnd + durationMs,
                status: 'active'
              }
            };
          }

          return {
            ...user,
            approved: false, // Automated disapproval upon expiry
            subscriptionActive: false,
            subscription: {
              ...sub,
              status: 'past_due'
            }
          };
        }
        return user;
      });

      console.log(`[SERVER] Expiry check complete. Updated ${modifiedCount} users.`);
      res.json({ updatedUsers });
    } catch (err) {
      console.error('[SERVER] Expiry check error:', err);
      res.status(500).json({ error: 'Internal server error during expiry check' });
    }
  });

  // Mock Online Card Payment
  app.post('/api/process-payment', (req, res) => {
    const { userId, planId, cardInfo } = req.body;
    
    // Simulating gateway delay
    setTimeout(() => {
      let durationMs = 30 * 24 * 60 * 60 * 1000;
      switch (planId) {
        case 'quarterly': durationMs = 90 * 24 * 60 * 60 * 1000; break;
        case 'annual': durationMs = 365 * 24 * 60 * 60 * 1000; break;
      }
      
      const currentPeriodEnd = Date.now() + durationMs;

      res.json({
        success: true,
        subscription: {
          planId,
          status: 'active',
          currentPeriodEnd,
          autoRenew: true,
          isTrial: false
        },
        transactionId: 'txn_' + Math.random().toString(36).substr(2, 9)
      });
    }, 1500);
  });

  // Persistent in-memory mock invoices are now managed at module scope for webhook consistency

  // Toggle Auto-renew
  app.post('/api/subscriptions/toggle-auto-renew', (req, res) => {
    const { userId, autoRenew } = req.body;
    res.json({ success: true, autoRenew });
  });

  // Mock Billing History
  app.get('/api/billing-history', (req, res) => {
    res.json(globalMockInvoices);
  });

  // Update Invoice Status
  app.post('/api/admin/invoices/update-status', (req, res) => {
    const { invoiceId, status } = req.body;
    const inv = globalMockInvoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.status = status;
      res.json({ success: true, invoice: inv });
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  });

  // Create Stripe Payment Intent
  app.post('/api/payment/create-payment-intent', async (req, res) => {
    try {
      const { invoiceId, amount, description } = req.body;
      if (!invoiceId || !amount) {
        return res.status(400).json({ error: 'Invoice ID and Amount are required.' });
      }

      const stripe = getStripeClient();
      if (stripe) {
        // Create a real payment intent with the real Stripe SDK
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // convert dollars to cents
          currency: 'usd',
          metadata: { invoiceId, description: description || '' },
          automatic_payment_methods: { enabled: true },
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
          isMock: false,
          publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
        });
      } else {
        // If STRIPE_SECRET_KEY is missing, gracefully return mock secrets to allow the frontend elements simulator to work flawlessly
        console.log(`[STRIPE] Keys missing. Initiating sandbox mock PaymentIntent for Invoice ${invoiceId} ($${amount})`);
        res.json({
          clientSecret: `pi_mock_${invoiceId}_` + Math.random().toString(36).substring(2, 10),
          isMock: true,
          publishableKey: 'pk_test_mock_stripe_publishable_key'
        });
      }
    } catch (err: any) {
      console.error('[STRIPE] Error creating payment intent:', err);
      res.status(500).json({ error: err.message || 'Stripe initialization failed.' });
    }
  });

  // Verify and Confirm Stripe Payment
  app.post('/api/payment/confirm-payment', async (req, res) => {
    try {
      const { invoiceId, paymentIntentId, isMock } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ error: 'Invoice ID is required' });
      }

      let verified = false;
      let referenceId = paymentIntentId || 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      if (isMock) {
        verified = true;
      } else {
        const stripe = getStripeClient();
        if (stripe && paymentIntentId) {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (pi.status === 'succeeded' && pi.metadata.invoiceId === invoiceId) {
            verified = true;
            referenceId = pi.id;
          }
        } else {
          // Fallback if client marked isMock incorrectly but we lack Stripe key
          verified = true;
        }
      }

      if (verified) {
        const inv = globalMockInvoices.find(i => i.id === invoiceId);
        if (inv) {
          inv.status = 'paid';
          res.json({ success: true, invoice: inv, referenceId });
        } else {
          res.status(404).json({ error: 'Invoice not found' });
        }
      } else {
        res.status(400).json({ error: 'Stripe transaction status could not be verified' });
      }
    } catch (err: any) {
      console.error('[STRIPE] Error confirming payment:', err);
      res.status(500).json({ error: err.message || 'Internal confirmation failed' });
    }
  });


  // Admin Revenue Stats
  app.get('/api/admin/revenue', (req, res) => {
    // In a real app, aggregate from database
    res.json({
      totalRevenue: 5430,
      monthlyRevenue: 850,
      activeSubscriptions: 42,
      failedPaymentsCount: 1,
      trends: [
        { month: 'Jan', revenue: 420, activeUsers: 20, billingCycles: 15 },
        { month: 'Feb', revenue: 580, activeUsers: 24, billingCycles: 18 },
        { month: 'Mar', revenue: 790, activeUsers: 29, billingCycles: 22 },
        { month: 'Apr', revenue: 980, activeUsers: 34, billingCycles: 28 },
        { month: 'May', revenue: 1210, activeUsers: 38, billingCycles: 33 },
        { month: 'Jun', revenue: 1450, activeUsers: 42, billingCycles: 40 },
      ],
      plansBreakdown: [
        { name: 'Starter', count: 18, revenue: 522 },
        { name: 'Pro VIP', count: 18, revenue: 1602 },
        { name: 'Enterprise', count: 6, revenue: 3306 },
      ]
    });
  });

  // Catch-all for unhandled API routes to prevent falling through to Vite (which returns HTML)
  app.all('/api/*', (req, res) => {
    console.warn(`[SERVER] Unhandled API request: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Booted successfully`);
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[SERVER] Failed to start:', err);
});
