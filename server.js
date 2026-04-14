import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs, resolvers } from './backend/graphql/index.js';
import { connectToDatabase, isDbConfigured } from './backend/db.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const TURNSTILE_COOKIE_NAME = 'turnstile_verified';
const TURNSTILE_COOKIE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

function parseCookieHeader(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const separatorIndex = pair.indexOf('=');
      if (separatorIndex <= 0) {
        return acc;
      }
      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function setTurnstileVerifiedCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(TURNSTILE_COOKIE_NAME, 'true', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: TURNSTILE_COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function isTurnstileVerifiedFromRequest(req) {
  const cookies = parseCookieHeader(req.headers?.cookie ?? '');
  return cookies[TURNSTILE_COOKIE_NAME] === 'true';
}

async function startServer() {
  if (isDbConfigured()) {
    try {
      await connectToDatabase();
      console.log('Connected to MongoDB.');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
    }
  } else {
    console.warn('MONGODB_URI is not configured. Persistence GraphQL resolvers will return an error.');
  }

  await apolloServer.start();

  const turnstileSecretKey = process.env.NODE_ENV === 'production'
    ? process.env.TURNSTILE_SECRET_KEY
    : '1x0000000000000000000000000000000AA';

  // 📝 在抵達 JSON body parser 之前，先中途攔截並印出大小
  app.use('/graphql', (req, res, next) => {
    if (req.headers['content-length']) {
      const sizeMB = (parseInt(req.headers['content-length'], 10) / 1024 / 1024).toFixed(3);
    }
    next();
  }, express.json({ limit: '50mb' }), expressMiddleware(apolloServer, {
    context: async ({ req, res }) => ({
      req,
      res,
      isTurnstileVerified: isTurnstileVerifiedFromRequest(req),
    }),
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.post('/api/admin/login', (req, res) => {
    const configuredPassword = process.env.ADMIN_PASSWORD
    const submittedPassword = req.body?.password;

    if (!configuredPassword) {
      return res.status(500).json({
        success: false,
        message: 'Admin password is not configured.',
      });
    }

    if (typeof submittedPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    if (submittedPassword === configuredPassword) {
      return res.json({ success: true });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid password',
    });
  });

  app.post('/api/turnstile/verify', async (req, res) => {
    const token = req.body?.token;

    if (!turnstileSecretKey) {
      return res.status(500).json({
        success: false,
        message: 'Turnstile secret is not configured on the server.',
      });
    }

    if (typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Turnstile token is required.',
      });
    }

    // In development mode (using test secret), skip Cloudflare API and accept token
    const isTestSecret = turnstileSecretKey === '1x0000000000000000000000000000000AA';
    if (isTestSecret) {
      setTurnstileVerifiedCookie(res);
      return res.json({ success: true, isDevelopment: true });
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    const remoteIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;

    const payload = new URLSearchParams();
    payload.set('secret', turnstileSecretKey);
    payload.set('response', token);
    if (remoteIp) {
      payload.set('remoteip', remoteIp);
    }

    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });

      const result = await response.json();
      const success = result?.success === true;

      if (success) {
        setTurnstileVerifiedCookie(res);
      }

      return res.status(success ? 200 : 400).json({
        success,
        errorCodes: Array.isArray(result?.['error-codes']) ? result['error-codes'] : [],
      });
    } catch (error) {
      return res.status(502).json({
        success: false,
        message: 'Failed to verify Turnstile token.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/turnstile/status', (req, res) => {
    return res.json({
      success: true,
      verified: isTurnstileVerifiedFromRequest(req),
    });
  });

  // Serve static files from the dist directory when running the production bundle.
  app.use(express.static(path.join(__dirname, 'dist')));

  // Send all non-API requests to index.html to support client-side routing.
  app.get(new RegExp('^(?!/graphql).*$'), (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
