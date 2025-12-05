import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Cross-platform storage: localStorage on web, AsyncStorage on native
let storage: any = undefined;

if (typeof window !== 'undefined') {
  // Web
  storage = window.localStorage;
} else {
  // Native (Expo)
  // NOTE: you must have @react-native-async-storage/async-storage in deps
  // npm i @react-native-async-storage/async-storage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Expo Router/web preview doesn't need URL parsing
  },
});


// A tiny helper that resolves when we have a session (or times out)
export async function waitForSession(timeoutMs = 5000): Promise<void> {
  const start = Date.now();

  // Quick check
  const s0 = await supabase.auth.getSession();
  if (s0.data.session) return;

  // Subscribe until session arrives or timeout
  return new Promise((resolve, reject) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) {
        subscription.unsubscribe();
        resolve();
      }
    });

    const tick = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        subscription.unsubscribe();
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        subscription.unsubscribe();
        reject(new Error('waitForSession timed out'));
        return;
      }
      setTimeout(tick, 150);
    };
    tick();
  });
}