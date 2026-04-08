'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-8 bg-[#001f2b] text-white border-t border-white/5">
      <div className="max-w-[90rem] mx-auto px-4 md:px-6 grid md:grid-cols-4 gap-10 md:gap-16">
        <div className="md:col-span-2">
          <Link href="/" onClick={scrollToTop} className="inline-block">
            <img
              src="https://res.cloudinary.com/dulzeafbm/image/upload/v1771503897/Unity_Summit_Logo-02_hdljmo.png"
              alt="Unity Summit"
              className="h-12 md:h-16 w-auto mb-6 md:mb-8 object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
          <p className="text-gray-400 text-sm md:text-base leading-loose max-w-md">
            En møteplass for ledere, HR-ansvarlige, gründere og kommunikasjonsfolk som vil utfordre
            vanetenkning, bygge broer og skape reell endring i arbeidslivet – og i samfunnet.
          </p>
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold mb-6 md:mb-8 text-unity-orange uppercase tracking-wider">
            Lokasjon
          </h3>
          <p className="text-gray-400 text-sm md:text-base leading-loose">
            Grieghallen
            <br />
            Edvard Griegs Plass 1<br />
            5015 Bergen
          </p>
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold mb-6 md:mb-8 text-unity-orange uppercase tracking-wider">
            Kontakt
          </h3>
          <p className="text-gray-400 text-sm md:text-base leading-loose">
            post@unitysummit.no
            <br />
            Tverrgaten 7- 11
            <br />
            5017 Bergen
            <br />
            Norway
          </p>
          <div className="flex gap-4 md:gap-6 mt-6 md:mt-8">
            <a
              href="#"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-unity-orange transition-colors text-base md:text-lg font-bold"
            >
              in
            </a>
            <a
              href="#"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-unity-orange transition-colors text-base md:text-lg font-bold"
            >
              fb
            </a>
            <a
              href="#"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-unity-orange transition-colors text-base md:text-lg font-bold"
            >
              ig
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-[90rem] mx-auto px-4 md:px-6 mt-6 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between text-gray-500 text-xs md:text-sm">
        <p>© 2026 Unity Summit. Alle rettigheter reservert.</p>
        <div className="flex gap-6 md:gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-white">
            Brukerhåndbok
          </a>
          <a href="#" className="hover:text-white">
            Vilkår og betingelser
          </a>
          <a href="#" className="hover:text-white">
            Personvernerklæring
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
