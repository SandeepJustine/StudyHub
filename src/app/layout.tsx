import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import '@/styles/globals.css';
import 'highlight.js/styles/github.css';
import { GoogleTranslate } from '@/components/ui/google-translate';
import WhatsAppWidget from '@/components/features/support/whatsapp-widget';
import { PwaProvider } from '@/components/pwa/pwa-provider';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://studyhubmw.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'StudyHub Malawi - Learn. Practice. Succeed.',
    template: '%s | StudyHub Malawi',
  },
  description: 'Malawi\'s premier digital learning and examination platform',
  keywords: 'education, Malawi, MSCE, JCE, ICAM, TEVETA, IT, online learning, exam preparation',
  applicationName: 'StudyHub Malawi',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'StudyHub Malawi',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    siteName: 'StudyHub Malawi',
    title: 'StudyHub Malawi - Learn. Practice. Succeed.',
    description: 'Malawi\'s premier digital learning and examination platform',
    url: siteUrl,
    locale: 'en_MW',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyHub Malawi - Learn. Practice. Succeed.',
    description: 'Malawi\'s premier digital learning and examination platform',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins">
        {children}
        {/*<GoogleTranslate
          pageLanguage="en"
          includedLanguages="en,ny,fr,de,es,it,pt,ru,zh-CN,ja,ko,ar,tg"
          layout="simple"
        />
        */}
        <WhatsAppWidget />
        <PwaProvider />
      </body>
    </html>
  );
}