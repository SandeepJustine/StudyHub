import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import '@/styles/globals.css';
import { GoogleTranslate } from '@/components/ui/google-translate';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'StudyHub Malawi - Learn. Practice. Succeed.',
  description: 'Malawi\'s premier digital learning and examination platform',
  keywords: 'education, Malawi, MSCE, JCE, ICAM, TEVETA, online learning, exam preparation',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.png',
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
      </body>
    </html>
  );
}