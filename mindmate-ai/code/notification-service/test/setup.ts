/**
 * MindMate AI Notification Service - Test Setup
 */

import { config } from '../src/config';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external services
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  messaging: () => ({
    send: jest.fn().mockResolvedValue('mock-message-id'),
  }),
  credential: {
    cert: jest.fn(),
  },
  app: jest.fn(),
}));

jest.mock('twilio', () => {
  return jest.fn().mockReturnValue({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'mock-message-sid',
        status: 'queued',
      }),
    },
    lookups: {
      v2: {
        phoneNumbers: () => ({
          fetch: jest.fn().mockResolvedValue({
            valid: true,
            phoneNumber: '+1234567890',
          }),
        }),
      },
    },
    api: {
      accounts: () => ({
        fetch: jest.fn().mockResolvedValue({ sid: 'mock-account-sid' }),
      }),
    },
  });
});

jest.mock('apn', () => {
  return {
    Provider: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({ sent: [{ device: 'mock-device' }], failed: [] }),
      shutdown: jest.fn(),
    })),
    Notification: jest.fn().mockImplementation(() => ({
      alert: {},
      badge: 0,
      sound: '',
      topic: '',
      payload: {},
      priority: 10,
    })),
  };
});

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
}));

// Global test timeout
jest.setTimeout(30000);

// Cleanup after all tests
afterAll(async () => {
  // Add any global cleanup here
});
