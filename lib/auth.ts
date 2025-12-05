import { supabase, waitForSession } from './supabase';

/**
 * Ensures this device (kiosk) has an active anonymous session.
 * Safe to call multiple times; it will no-op once a session exists.
 */
export async function ensureKioskSession() {
  // If we already have a session, return
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;

  // Attempt anonymous sign-in
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('Anonymous sign-in failed. Continuing without auth. Enable Anonymous provider in Supabase for full functionality.');
    // Don't throw - allow app to continue without auth for now
    return;
  }

  // Wait until the session is actually persisted and visible to the client
  await waitForSession(5000).catch((e) => {
    console.warn('Session wait timed out, continuing anyway', e);
  });
}

/**
 * Returns current user id (after ensuring kiosk session).
 */
export async function getKioskUid(): Promise<string> {
  await ensureKioskSession();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) throw new Error('Kiosk session not initialized');
  return data.user.id;
}