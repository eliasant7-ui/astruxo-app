/**
 * Vite Plugin to Load Secrets as Environment Variables
 * This plugin loads secrets from the Airo secrets system and makes them available to Vite
 */

import type { Plugin } from 'vite';

export function secretsPlugin(): Plugin {
  return {
    name: 'vite-secrets-plugin',
    config(config, { mode }) {
      // Load secrets in both development and production builds
      // This ensures VITE_ variables are available during build time
      try {
        // Import the secrets utility
        // Note: This uses dynamic import to avoid issues with module resolution
        const { getSecret } = require('./airo-secrets/src/secrets-utils.ts');
        
        // List of VITE_ secrets to load
        const viteSecrets = [
          'VITE_FIREBASE_API_KEY',
          'VITE_FIREBASE_AUTH_DOMAIN',
          'VITE_FIREBASE_PROJECT_ID',
          'VITE_FIREBASE_STORAGE_BUCKET',
          'VITE_FIREBASE_MESSAGING_SENDER_ID',
          'VITE_FIREBASE_APP_ID',
        ];

        console.log(`🔧 Loading secrets for mode: ${mode}`);

        // Load each secret and set it in process.env
        for (const secretName of viteSecrets) {
          const value = getSecret(secretName);
          if (value && typeof value === 'string') {
            process.env[secretName] = value;
            console.log(`✅ Loaded secret: ${secretName}`);
          } else {
            console.warn(`⚠️ Secret not found or invalid: ${secretName}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load secrets:', error);
      }
    },
  };
}
