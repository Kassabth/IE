import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'AI Mirror — Emotional Regulation Assistant',
  description:
    'A calm, grounded assistant to help you slow down, name your state, and choose a small next step. Not therapy. Not medical advice.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

