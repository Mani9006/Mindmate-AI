/**
 * Centralized Configuration
 * All environment variables and app settings
 */

import dotenv from 'dotenv';

dotenv.config();

// Helper to get env var with default
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Helper to get boolean env var
const getBoolEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// Helper to get number env var
const getNumEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
};

export const config = {
  // Application
  app: {
    env: getEnv('NODE_ENV', 'development'),
    port: getNumEnv('PORT', 8080),
    version: getEnv('API_VERSION', 'v1'),
    apiPrefix: getEnv('API_PREFIX', '/v1'),
    build: getEnv('BUILD', 'development'),
    isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
    isProduction: getEnv('NODE_ENV', 'development') === 'production',
    isTest: getEnv('NODE_ENV', 'development') === 'test',
  },

  // Security
  security: {
    jwtSecret: getEnv('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
    jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    jwtAccessExpiration: getEnv('JWT_ACCESS_EXPIRATION', '15m'),
    jwtRefreshExpiration: getEnv('JWT_REFRESH_EXPIRATION', '30d'),
    jwtIssuer: getEnv('JWT_ISSUER', 'mindmate-ai'),
    jwtAudience: getEnv('JWT_AUDIENCE', 'mindmate-ai-api'),
    bcryptRounds: getNumEnv('BCRYPT_ROUNDS', 12),
  },

  // Database
  database: {
    url: getEnv('DATABASE_URL', 'postgresql://localhost:5432/mindmate_ai'),
    poolSize: getNumEnv('DATABASE_POOL_SIZE', 20),
  },

  // Redis
  redis: {
    url: getEnv('REDIS_URL', 'redis://localhost:6379'),
    password: getEnv('REDIS_PASSWORD', ''),
    db: getNumEnv('REDIS_DB', 0),
    keyPrefix: getEnv('REDIS_KEY_PREFIX', 'mindmate:'),
  },

  // Rate Limiting
  rateLimit: {
    anonymous: getNumEnv('RATE_LIMIT_ANONYMOUS', 10),
    authenticated: getNumEnv('RATE_LIMIT_AUTHENTICATED', 100),
    premium: getNumEnv('RATE_LIMIT_PREMIUM', 500),
    admin: getNumEnv('RATE_LIMIT_ADMIN', 1000),
    windowMs: getNumEnv('RATE_LIMIT_WINDOW_MS', 60000),
  },

  // CORS
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: getBoolEnv('CORS_CREDENTIALS', true),
  },

  // Logging
  log: {
    level: getEnv('LOG_LEVEL', 'debug'),
    format: getEnv('LOG_FORMAT', 'combined'),
    filePath: getEnv('LOG_FILE_PATH', './logs'),
    maxFiles: getNumEnv('LOG_MAX_FILES', 30),
  },

  // File Upload
  upload: {
    maxFileSize: getNumEnv('MAX_FILE_SIZE', 5 * 1024 * 1024), // 5MB
    path: getEnv('UPLOAD_PATH', './uploads'),
    allowedImageTypes: getEnv('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/webp').split(','),
  },

  // OAuth Providers
  oauth: {
    google: {
      clientId: getEnv('GOOGLE_CLIENT_ID', ''),
      clientSecret: getEnv('GOOGLE_CLIENT_SECRET', ''),
    },
    apple: {
      clientId: getEnv('APPLE_CLIENT_ID', ''),
      teamId: getEnv('APPLE_TEAM_ID', ''),
      keyId: getEnv('APPLE_KEY_ID', ''),
      privateKey: getEnv('APPLE_PRIVATE_KEY', ''),
    },
    facebook: {
      appId: getEnv('FACEBOOK_APP_ID', ''),
      appSecret: getEnv('FACEBOOK_APP_SECRET', ''),
    },
  },

  // Email
  email: {
    provider: getEnv('EMAIL_PROVIDER', 'sendgrid'),
    from: getEnv('EMAIL_FROM', 'noreply@mindmate.ai'),
    fromName: getEnv('EMAIL_FROM_NAME', 'MindMate AI'),
    sendgridApiKey: getEnv('SENDGRID_API_KEY', ''),
  },

  // SMS
  sms: {
    twilioAccountSid: getEnv('TWILIO_ACCOUNT_SID', ''),
    twilioAuthToken: getEnv('TWILIO_AUTH_TOKEN', ''),
    twilioPhoneNumber: getEnv('TWILIO_PHONE_NUMBER', ''),
  },

  // AI Service
  ai: {
    provider: getEnv('AI_PROVIDER', 'claude'),
    claudeApiKey: getEnv('CLAUDE_API_KEY', ''),
    claudeModel: getEnv('CLAUDE_MODEL', 'claude-3-opus-20240229'),
    openaiApiKey: getEnv('OPENAI_API_KEY', ''),
    openaiModel: getEnv('OPENAI_MODEL', 'gpt-4-turbo-preview'),
  },

  // Push Notifications
  push: {
    fcmServerKey: getEnv('FCM_SERVER_KEY', ''),
    apnsKeyId: getEnv('APNS_KEY_ID', ''),
    apnsTeamId: getEnv('APNS_TEAM_ID', ''),
    apnsBundleId: getEnv('APNS_BUNDLE_ID', ''),
    apnsPrivateKey: getEnv('APNS_PRIVATE_KEY', ''),
  },

  // Monitoring
  monitoring: {
    sentryDsn: getEnv('SENTRY_DSN', ''),
    datadogApiKey: getEnv('DATADOG_API_KEY', ''),
  },

  // Feature Flags
  features: {
    mfa: getBoolEnv('FEATURE_MFA', true),
    oauth: getBoolEnv('FEATURE_OAUTH', true),
    pushNotifications: getBoolEnv('FEATURE_PUSH_NOTIFICATIONS', true),
    analytics: getBoolEnv('FEATURE_ANALYTICS', true),
    crisisDetection: getBoolEnv('FEATURE_CRISIS_DETECTION', true),
  },

  // Crisis Support
  crisis: {
    hotlines: {
      US: getEnv('CRISIS_HOTLINE_US', '988'),
      UK: getEnv('CRISIS_HOTLINE_UK', '116123'),
      CA: getEnv('CRISIS_HOTLINE_CA', '8334564566'),
    },
  },

  // Admin
  admin: {
    defaultEmail: getEnv('ADMIN_DEFAULT_EMAIL', 'admin@mindmate.ai'),
    defaultPassword: getEnv('ADMIN_DEFAULT_PASSWORD', 'change-this-password'),
  },
};

// Validate required configuration in production
if (config.app.isProduction) {
  const requiredInProd = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
  ];

  for (const key of requiredInProd) {
    if (!process.env[key]) {
      throw new Error(`Missing required production environment variable: ${key}`);
    }
  }
}

export default config;
