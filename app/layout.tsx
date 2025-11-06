import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Lead Agent - AI-Powered Lead Qualification & Research',
  description: 'Automate your inbound lead qualification with AI-powered workflows. Qualify leads, conduct research, and generate personalized responses with human-in-the-loop approval.',
  keywords: ['lead qualification', 'AI automation', 'lead research', 'sales automation', 'workflow automation'],
  authors: [{ name: 'Lead Agent' }],
  openGraph: {
    title: 'Lead Agent - AI-Powered Lead Qualification',
    description: 'Automate your inbound lead qualification with AI-powered workflows',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lead Agent - AI-Powered Lead Qualification',
    description: 'Automate your inbound lead qualification with AI-powered workflows',
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
