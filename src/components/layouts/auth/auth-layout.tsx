import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-grey-light flex flex-col relative">
      {/* Background Patterns - Cover the ENTIRE page */}
      <div 
        className="fixed inset-0 opacity-[0.2] pointer-events-none z-0"
        style={{ 
          backgroundImage: 'url("/images/patterns/pencils.svg")',
          backgroundRepeat: 'repeat',
          backgroundSize: '80px 80px',
        }} 
      />
      <div 
        className="fixed inset-0 opacity-[1.5] pointer-events-none z-0"
        style={{ 
          backgroundImage: 'url("/images/patterns/education-icons.svg")',
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px',
        }} 
      />

      {/* Decorative Orbs - Cover the ENTIRE page */}
      <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-navy/[0.04] blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-32 -left-32 w-96 h-96 rounded-full bg-red/[0.04] blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-navy/[0.02] blur-3xl pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="bg-navy text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo variant="white" size="md" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-slate-300 hover:text-white transition-colors text-sm">
              Features
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors text-sm">
              Pricing
            </Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors text-sm">
              About
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors text-sm">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-navy-light text-sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0A152E] text-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="white" size="sm" className="mb-4" />
              <p className="text-slate-300 text-sm">Learn. Practice. Succeed.</p>
              <p className="text-slate-400 text-xs mt-2">Malawi's premier digital learning platform</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#features" className="text-slate-300 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/about" className="text-slate-300 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>+265 888 000 000</li>
                <li>info@studyhub.mw</li>
                <li>Lilongwe, Malawi</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-slate-300 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} StudyHub Malawi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}