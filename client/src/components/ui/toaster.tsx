'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster: React.FC = () => {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#18181b',
          color: '#fafafa',
          border: '1px solid #3f3f46',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4), 0 20px 40px -8px rgba(0,0,0,0.6)',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#18181b',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#18181b',
          },
        },
      }}
    />
  );
};
