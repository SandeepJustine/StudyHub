'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/#features" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</Link>
      <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
      <Link href="/about" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>About</Link>
      <Link href="/courses" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
        Courses
      </Link>
      <Link href="/trainings" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
        Trainings
      </Link>
      <Link href="/contact" className="text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
    </>
  );

  return (
    <div className="min-h-screen bg-grey-light">
      {/* Navigation */}
      <nav className="bg-navy text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo variant="white" size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLinks />
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-navy-light">Log In</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-navy border-t border-navy-light">
            <div className="px-4 py-4 space-y-4">
              <div className="flex flex-col space-y-3">
                <NavLinks />
              </div>
              <div className="flex flex-col space-y-3 pt-4 border-t border-navy-light">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="text-white hover:text-white hover:bg-navy-light w-full justify-center">Log In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full justify-center">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#0A152E] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="white" size="sm" className="mb-4" />
              <p className="text-slate-300 text-sm">Learn. Practice. Succeed.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>+265 997 011 620</li>
                <li>info@studyhubmw.com</li>
                <li>Lilongwe, Malawi</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
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