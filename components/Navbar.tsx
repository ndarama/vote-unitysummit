'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    fetch('/api/admin/me')
      .then((res) => {
        if (res.ok) setIsAdmin(true);
      })
      .catch(() => setIsAdmin(false));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (href === '/') {
      if (pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push('/');
        window.scrollTo(0, 0);
      }
      return;
    }

    if (href.startsWith('#')) {
      if (pathname === '/') {
        const targetId = href.replace('#', '');
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        router.push(href);
      }
    } else {
      router.push(href);
      window.scrollTo(0, 0);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] bg-unity-blue/95 backdrop-blur-md shadow-2xl py-4 transition-all duration-500">
      <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, '/')}
          className="block relative z-[101] group"
        >
          <Image
            src="https://res.cloudinary.com/dulzeafbm/image/upload/v1771503897/Unity_Summit_Logo-02_hdljmo.png"
            alt="Unity Summit"
            width={240}
            height={64}
            className="h-10 md:h-12 lg:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 brightness-0 invert"
          />
        </Link>

        <div className="hidden xl:flex items-center gap-8 text-white font-medium tracking-wide">
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="hover:text-unity-orange transition-colors uppercase font-bold text-lg tracking-wider"
          >
            Stem
          </Link>
          <Link
            href="/leaderboard"
            onClick={(e) => handleNavClick(e, '/leaderboard')}
            className="hover:text-unity-orange transition-colors uppercase font-bold text-lg tracking-wider"
          >
            Ledertavle
          </Link>
          <Link
            href="/contact"
            onClick={(e) => handleNavClick(e, '/contact')}
            className="ml-4 px-10 py-3 border-2 border-white/30 rounded-full hover:bg-unity-orange hover:border-unity-orange hover:text-white transition-all uppercase font-bold text-lg tracking-widest"
          >
            Kontakt
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={(e) => handleNavClick(e, '/admin')}
              className="ml-4 px-6 py-3 bg-unity-orange text-white rounded-full hover:bg-white hover:text-unity-orange transition-all uppercase font-bold text-lg tracking-widest"
            >
              Dashboard
            </Link>
          )}
        </div>

        <button
          className="xl:hidden text-white relative z-[101] p-2 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      <div
        className={`fixed inset-0 bg-unity-blue z-[100] transition-transform duration-500 xl:hidden flex flex-col justify-center items-center h-screen ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col gap-4 text-center px-6 w-full">
          <Link
            href="/"
            className="text-xl font-serif font-bold text-white hover:text-unity-orange transition-colors"
            onClick={(e) => handleNavClick(e, '/')}
          >
            Stem
          </Link>
          <Link
            href="/leaderboard"
            className="text-xl font-serif font-bold text-white hover:text-unity-orange transition-colors"
            onClick={(e) => handleNavClick(e, '/leaderboard')}
          >
            Ledertavle
          </Link>
          <Link
            href="/contact"
            className="text-xl font-serif font-bold text-white hover:text-unity-orange transition-colors"
            onClick={(e) => handleNavClick(e, '/contact')}
          >
            Kontakt
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xl font-serif font-bold text-white hover:text-unity-orange transition-colors"
              onClick={(e) => handleNavClick(e, '/admin')}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
