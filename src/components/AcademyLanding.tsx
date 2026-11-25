import { ArrowRight, BookOpen, Check, Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import type { CoursePlan, Teacher } from '../types';
import { TeachersSection } from './TeachersSection';

interface AcademyLandingProps {
  teachers: Teacher[];
  plans: CoursePlan[];
  onStartTrial: (options?: { planId?: string }) => void;
  onEnrollNow: (options?: { planId?: string }) => void;
}

const CURRICULUM_TRACKS = [
  {
    number: '01.',
    title: 'Noorani Qaida',
    summary:
      'Step-by-step Arabic letter recognition, harakat articulation, and smooth word joining designed for children and adult beginners.',
  },
  {
    number: '02.',
    title: 'Tajweed',
    summary:
      'Precision pronunciation from the exact points of articulation with live correction on Ghunnah, Madd, Qalqalah, and stopping rules.',
  },
  {
    number: '03.',
    title: 'Hifz',
    summary:
      'Balanced daily Sabaq, Sabqi, and Manzil retention plans led by experienced Huffaz so memorization stays permanent.',
  },
  {
    number: '04.',
    title: 'Qirat',
    summary:
      'Authentic recitation styles, classical Maqamat discipline, and vocal control taught by Ijazah-certified Qaris.',
  },
];

export function AcademyLanding({
  teachers,
  plans,
  onStartTrial,
  onEnrollNow,
}: AcademyLandingProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <main id="top">
      {/* 1. Rich Deep Emerald Hero Section */}
      <section className="bg-[#093628] text-white">
        <div className="mx-auto max-w-7xl px-6 pb-14 pt-12 lg:pb-16 lg:pt-16">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-[#D6B87C]">
                3-Day Free Trial · Live 1-on-1 Classes · Certified Huffaz
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.5rem,4.3vw,4rem)] font-bold leading-[1.06] tracking-tight text-white [text-wrap:balance]">
                Learn Quran Online with Certified Scholars
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85">
                Experience structured 1-on-1 Noorani Qaida, Tajweed, Hifz, and Qirat
                instruction from home. Begin with a complimentary 3-day free trial,
                and enroll monthly when ready.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => onStartTrial()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D6B87C] px-6 py-3 text-sm font-bold text-[#093628] transition-colors hover:bg-[#E2C994] whitespace-nowrap shrink-0"
                >
                  Start 3-Day Free Trial
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onEnrollNow()}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
                >
                  Enroll Now
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-[#06261C]">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_quran_study_1795605516747.jpg"
                    alt="Open Quran resting on a handcrafted wooden stand in warm natural study light"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-[#06261C] p-8 text-center">
                    <BookOpen className="h-12 w-12 text-[#D6B87C]" aria-hidden="true" />
                    <p className="mt-4 font-display text-2xl font-semibold text-white">
                      Hidayat Academy Study Room
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-column metric strip */}
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/15 pt-7 lg:grid-cols-4">
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                03 Days
              </p>
              <p className="mt-1 text-xs text-white/75">
                Full-access free trial before enrollment
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                1-on-1
              </p>
              <p className="mt-1 text-xs text-white/75">
                Live video sessions with dedicated scholars
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                {teachers.length} Scholars
              </p>
              <p className="mt-1 text-xs text-white/75">
                Male &amp; female Ijazah-certified faculty
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                24/7
              </p>
              <p className="mt-1 text-xs text-white/75">
                Flexible scheduling across global timezones
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Courses & Curriculum (4 tracks, clean without parent progress bars) */}
      <section id="courses" className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#093628]">
            Structured Curriculum
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
            Four specialized Quran programs for children and adults
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-[#D4CBB8] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {CURRICULUM_TRACKS.map((track) => (
            <div
              key={track.number}
              className="rounded-xl border border-[#D4CBB8] bg-white p-6"
            >
              <h3 className="font-display text-2xl font-bold text-[#093628]">
                {track.number} {track.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#3C4641]">
                {track.summary}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Teachers Showcase with Cursor Hover Info */}
      <TeachersSection teachers={teachers} />

      {/* 4. Monthly Tuition Plans (clean cards without audience kicker or 3-day lock boxes) */}
      <section
        id="pricing"
        className="border-t border-[#D4CBB8] bg-[#F3EDE2] py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#093628]">
              Monthly Tuition Plans
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
              Transparent monthly plans for every Quran program
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, idx) => {
              const featured = idx === 1;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-xl border p-6 ${
                    featured
                      ? 'border-[#093628] bg-[#093628] text-white'
                      : 'border-[#D4CBB8] bg-white text-[#111815]'
                  }`}
                >
                  <div>
                    <h3
                      className={`font-display text-3xl font-bold ${
                        featured ? 'text-white' : 'text-[#111815]'
                      }`}
                    >
                      {plan.name}
                    </h3>

                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="font-mono text-4xl font-semibold tabular-nums">
                        ${plan.priceUsd}
                      </span>
                      <span
                        className={`text-xs ${
                          featured ? 'text-white/75' : 'text-[#525B56]'
                        }`}
                      >
                        {plan.billingCycle}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3 border-t border-current/15 pt-5 text-sm">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              featured ? 'text-[#D6B87C]' : 'text-[#093628]'
                            }`}
                            aria-hidden="true"
                          />
                          <span className={featured ? 'text-white/90' : 'text-[#3C4641]'}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnrollNow({ planId: plan.id })}
                    className={`mt-8 w-full rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
                      featured
                        ? 'bg-[#D6B87C] text-[#093628] hover:bg-[#E2C994]'
                        : 'bg-[#093628] text-white hover:bg-[#06261C]'
                    }`}
                  >
                    Enroll Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Full Professional Multi-Column Footer */}
      <footer className="border-t border-[#06261C] bg-[#07261C] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 text-[#D6B87C]" aria-hidden="true" />
                <span className="font-display text-2xl font-bold text-white">
                  Hidayat Academy
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                Dedicated 1-on-1 online Quran education with certified male and female
                scholars. Serving students across UK, USA, Canada, Europe, and Pakistan.
              </p>
              <div className="mt-5 space-y-2 text-xs text-white/80">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#D6B87C]" aria-hidden="true" />
                  admissions@hidayatacademy.com
                </p>
                <p className="flex items-center gap-2 font-mono tabular-nums">
                  <Phone className="h-3.5 w-3.5 text-[#D6B87C]" aria-hidden="true" />
                  +92 300 4128901 · +44 20 7946 0192
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#D6B87C]" aria-hidden="true" />
                  Global Online Campus · 24/7 Scheduling
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-[#D6B87C]">
                Quran Programs
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    01. Noorani Qaida
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    02. Tajweed
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    03. Hifz
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    04. Qirat
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-[#D6B87C]">
                Admissions &amp; Portal
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                <li>
                  <button
                    type="button"
                    onClick={() => onStartTrial()}
                    className="hover:text-white transition-colors"
                  >
                    Start 3-Day Free Trial
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnrollNow()}
                    className="hover:text-white transition-colors"
                  >
                    Enroll Now &amp; Pay Fee
                  </button>
                </li>
                <li>
                  <a href="#teachers" className="hover:text-white transition-colors">
                    Certified Faculty
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Monthly Tuition Plans
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-[#D6B87C]">
                Accepted Fee Methods
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                <li>PayPal (International)</li>
                <li>Easypaisa Mobile Wallet</li>
                <li>JazzCash Mobile Wallet</li>
                <li>Debit / Credit Card &amp; Bank IBAN</li>
              </ul>
              <p className="mt-4 border-t border-white/15 pt-4 text-xs leading-relaxed text-white/70">
                3-Day free trial accounts automatically lock after 72 hours until fee
                enrollment is verified.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-8 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 Hidayat Academy. All rights reserved.</p>
            <p>Noorani Qaida · Tajweed · Hifz · Qirat</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
