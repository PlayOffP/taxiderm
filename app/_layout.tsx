// keep this as the very first line
import './polyfills/tslib-default';

import React from 'react';
import { Slot } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return <Slot />;
}