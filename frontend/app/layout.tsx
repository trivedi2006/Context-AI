import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Context AI — Understand Every Context of Every Project',
  description: 'Understand Every Context of Every Project using AI-powered Retrieval-Augmented Generation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#08090b] text-[#f2f3f5] antialiased selection:bg-white selection:text-black overflow-hidden font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
