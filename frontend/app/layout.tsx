import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { materialSymbolsOutlined } from './materialSymbolsFont';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], display: 'swap', variable: '--font-display' });

export const metadata: Metadata = {
  title: 'TransferLane',
  description: 'TransferLane',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body
        className={`${inter.variable} ${sourceSerif.variable} ${materialSymbolsOutlined.variable} bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
