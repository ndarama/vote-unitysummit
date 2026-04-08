'use client';

import React from 'react';
import { Mail, Phone, Send } from 'lucide-react';

const Contact: React.FC = () => {
  // Removed automatic scroll to top

  return (
    <section className="pt-20 md:pt-28 pb-12 md:pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-10 md:mb-16 max-w-4xl mx-auto">
          <span className="text-unity-orange font-bold uppercase tracking-widest text-sm md:text-base block mb-4 md:mb-6">
            Kontakt oss
          </span>
          <h2 className="text-3xl md:text-7xl font-serif text-unity-blue mb-6 md:mb-8">
            Vi hører gjerne fra deg!
          </h2>
          <p className="text-lg md:text-2xl text-gray-500 font-light leading-relaxed">
            Har du spørsmål om Unity Summit, samarbeid eller deltakelse?
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-24">
          {/* Contact Form */}
          <div className="bg-white p-6 md:p-14 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-100">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-unity-blue mb-8 md:mb-10">
              Send oss en melding
            </h3>
            <form className="space-y-6 md:space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 md:mb-3 ml-2">
                  Navn *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-6 py-4 md:px-8 md:py-5 bg-gray-50 rounded-full border border-gray-200 focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20 outline-none transition-all text-base md:text-lg"
                  placeholder="Ditt navn"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 md:mb-3 ml-2">
                    E-post *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-6 py-4 md:px-8 md:py-5 bg-gray-50 rounded-full border border-gray-200 focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20 outline-none transition-all text-base md:text-lg"
                    placeholder="din@epost.no"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 md:mb-3 ml-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    className="w-full px-6 py-4 md:px-8 md:py-5 bg-gray-50 rounded-full border border-gray-200 focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20 outline-none transition-all text-base md:text-lg"
                    placeholder="Mobilnummer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 md:mb-3 ml-2">
                  Melding
                </label>
                <textarea
                  rows={5}
                  className="w-full px-6 py-4 md:px-8 md:py-5 bg-gray-50 rounded-[2rem] border border-gray-200 focus:border-unity-orange focus:ring-2 focus:ring-unity-orange/20 outline-none transition-all text-base md:text-lg resize-none"
                  placeholder="Hva lurer du på?"
                ></textarea>
              </div>
              <button className="w-full py-4 md:py-5 bg-unity-blue text-white text-lg md:text-xl font-bold rounded-full hover:bg-unity-orange transition-colors uppercase tracking-wider shadow-lg flex items-center justify-center gap-3">
                Send inn <Send size={20} />
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8 md:space-y-12 flex flex-col justify-center">
            <div className="space-y-6 md:space-y-8">
              <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                <h4 className="text-lg md:text-xl font-bold text-unity-orange uppercase tracking-wider mb-2 md:mb-4">
                  Generelle henvendelser
                </h4>
                <a
                  href="mailto:post@unitysummit.no"
                  className="text-xl md:text-3xl font-serif text-unity-blue hover:text-unity-orange transition-colors break-words"
                >
                  post@unitysummit.no
                </a>
              </div>
            </div>

            <div className="grid gap-4 md:gap-6">
              {[
                {
                  role: '📩 Logistikk-spørsmål',
                  name: 'Francine Mbanza Jensen',
                  email: 'francine@unityspark.no',
                  phone: '47447835',
                },
                {
                  role: '📩 Leder av programkomité og konferansier',
                  name: 'Hedda Kise',
                  email: 'hedda.kise@lederoppskrifter.no',
                  phone: '90027950',
                },
                {
                  role: '📩 Styreleder, Unity Spark',
                  name: 'Tom Georg Olsen',
                  email: 'tom.georg.olsen@servantleader.no',
                  phone: '90965050',
                },
              ].map((person, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 bg-white/50"
                >
                  <p className="text-unity-orange font-bold text-xs md:text-sm uppercase tracking-wider mb-2">
                    {person.role}
                  </p>
                  <h5 className="text-lg md:text-xl font-serif font-bold text-unity-blue mb-3 md:mb-4">
                    {person.name}
                  </h5>
                  <div className="flex flex-col gap-2 text-gray-600 text-base md:text-lg">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="md:w-[18px] text-gray-400" />
                      <a
                        href={`mailto:${person.email}`}
                        className="hover:text-unity-orange transition-colors break-all"
                      >
                        {person.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="md:w-[18px] text-gray-400" />
                      <a
                        href={`tel:${person.phone}`}
                        className="hover:text-unity-orange transition-colors"
                      >
                        Mobil: {person.phone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
