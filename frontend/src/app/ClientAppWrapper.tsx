'use client';

import { Toaster } from 'react-hot-toast';

export function ClientAppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}