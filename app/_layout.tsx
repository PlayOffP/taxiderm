// keep this as the very first line
import './polyfills/tslib-default';

import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { ensureKioskSession } from '../lib/auth'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await ensureKioskSession();
      } catch (e) {
        console.error('Failed to init kiosk session', e);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Slot />;
}