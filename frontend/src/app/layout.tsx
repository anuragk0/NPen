import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from './ReduxProvider';
import { ClientAppWrapper } from './ClientAppWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NPen - Project Management',
  description: 'A modern project management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ReduxProvider>
          <ClientAppWrapper>
            {children}
          </ClientAppWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
}
