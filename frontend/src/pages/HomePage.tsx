import { tr, useLocale } from '../i18n';

import React from 'react';
import { Link } from 'react-router-dom';

const heroImage =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=85';

const cropImage =
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=85';

const weatherImage =
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1000&q=85';

const farmingImage =
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=85';

const marketImage =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85';

const advisorImage =
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=85';

const managementImage =
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=85';

const features = [
  {
    number: '01',
    category: 'KNOWLEDGE',
    title: 'Know your land.',
    description:
      'Explore practical crop and soil knowledge to make more confident decisions at every stage of farming.',
    link: '/knowledge',
    action: 'Explore knowledge',
    image: cropImage,
  },
  {
    number: '02',
    category: 'WEATHER',
    title: 'Plan with nature.',
    description:
      'Understand upcoming weather conditions and prepare your farm for the days ahead.',
    link: '/tools/weather',
    action: 'Check weather',
    image: weatherImage,
  },
];

const farmingTools = [
  {
    number: '01',
    title: 'Market intelligence',
    description:
      'Explore mandi prices and understand agricultural market information.',
    path: '/tools/mandi',
    action: 'Explore mandi prices',
    image: marketImage,
  },
  {
    number: '02',
    title: 'Farming advisor',
    description:
      'Receive explainable guidance based on crops, soil, and weather conditions.',
    path: '/tools/advisor',
    action: 'Open crop advisor',
    image: advisorImage,
  },
  {
    number: '03',
    title: 'Farm management',
    description:
      'Keep track of your farms and organize important agricultural information.',
    path: '/my-farms',
    action: 'Manage your farms',
    image: managementImage,
  },
];

type BirdProps = {
  className?: string;
  size?: number;
};

const Bird: React.FC<BirdProps> = ({
  className = '',
  size = 28,
}) => (
  <svg
    viewBox="0 0 64 32"
    width={size}
    height={size / 2}
    className={className}
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2 21 C12 8 20 9 32 20 C43 8 52 8 62 21"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const birds = [
  {
    top: '17%',
    delay: '-2s',
    duration: '29s',
    size: 30,
    opacity: 0.75,
  },
  {
    top: '21%',
    delay: '-11s',
    duration: '34s',
    size: 23,
    opacity: 0.55,
  },
  {
    top: '15%',
    delay: '-18s',
    duration: '38s',
    size: 18,
    opacity: 0.5,
  },
  {
    top: '27%',
    delay: '-6s',
    duration: '32s',
    size: 27,
    opacity: 0.65,
  },
  {
    top: '24%',
    delay: '-23s',
    duration: '40s',
    size: 19,
    opacity: 0.55,
  },
  {
    top: '32%',
    delay: '-14s',
    duration: '36s',
    size: 22,
    opacity: 0.45,
  },
];

const FlyingBirds: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
  >
    {birds.map((bird, index) => (
      <div
        key={index}
        className="profarm-flying-bird absolute left-0 text-[#162D27]"
        style={
          {
            top: bird.top,
            opacity: bird.opacity,
            animationDelay: bird.delay,
            animationDuration: bird.duration,
            '--bird-size': `${bird.size}px`,
          } as React.CSSProperties
        }
      >
        <div className="profarm-bird-float">
          <Bird size={bird.size} />
        </div>
      </div>
    ))}
  </div>
);

export const HomePage: React.FC = () => {
  useLocale();
  return (
    <div className="w-full overflow-hidden">
      <style>
        {"\n          @keyframes profarmBirdFlight {\n            0% {\n              transform: translate3d(-12vw, 0, 0) scale(0.8);\n            }\n            25% {\n              transform: translate3d(22vw, -20px, 0) scale(0.9);\n            }\n            50% {\n              transform: translate3d(53vw, 12px, 0) scale(1);\n            }\n            75% {\n              transform: translate3d(83vw, -15px, 0) scale(0.95);\n            }\n            100% {\n              transform: translate3d(115vw, -5px, 0) scale(0.85);\n            }\n          }\n\n          @keyframes profarmBirdFloat {\n            0%, 100% {\n              transform: translateY(0) rotate(-3deg);\n            }\n            50% {\n              transform: translateY(-7px) rotate(3deg);\n            }\n          }\n\n          .profarm-flying-bird {\n            animation-name: profarmBirdFlight;\n            animation-timing-function: linear;\n            animation-iteration-count: infinite;\n            will-change: transform;\n          }\n\n          .profarm-bird-float {\n            animation: profarmBirdFloat 2.2s ease-in-out infinite;\n          }\n\n          @media (prefers-reduced-motion: reduce) {\n            .profarm-flying-bird,\n            .profarm-bird-float {\n              animation: none !important;\n            }\n\n            .profarm-flying-bird {\n              display: none;\n            }\n          }\n        "}
      </style>

      {/* HERO SECTION */}
      <section className="relative flex min-h-[680px] items-center overflow-hidden bg-[#193B29] sm:min-h-[740px] lg:min-h-[790px]">
        <img
          src={heroImage}
          alt={tr("Expansive green agricultural fields in warm sunlight")}
          className="absolute inset-0 h-full w-full object-cover"
          {...{ fetchpriority: 'high' }}
        />

        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#10291D]/90 via-[#10291D]/65 to-[#10291D]/15" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#10291D]/45 via-transparent to-transparent" />

        {/* Animated birds in the sky */}
        <FlyingBirds />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 py-28 sm:px-8 lg:px-12">
          <div className="max-w-[800px]">
            <h1 className="max-w-[790px] font-serif text-[clamp(3.5rem,7.2vw,7.5rem)] font-normal leading-[0.99] tracking-[-0.055em] text-white">{tr("Rooted in nature.")}<span className="mt-2 block italic text-[#C7DCA9]">{tr("Growing with knowledge.")}</span>
            </h1>

            <p className="mt-9 max-w-[560px] text-[15px] leading-[1.9] text-white/85 sm:text-[17px]">{tr("Better farming begins with better information. Discover practical agricultural knowledge, understand your environment, and make every growing decision count.")}</p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/knowledge"
                className="group inline-flex min-h-[52px] items-center gap-4 rounded-full bg-[#D5E4B6] px-7 py-4 text-[13px] font-bold text-[#1B3E2B] transition-all duration-300 hover:-translate-y-1 hover:bg-white"
              >{tr("Explore ProFarm")}<span
                  aria-hidden="true"
                  className="text-lg transition-transform group-hover:translate-x-1"
                >
                  ↗
                </span>
              </Link>

              <Link
                to="/tools"
                className="inline-flex min-h-[52px] items-center rounded-full border border-white/50 px-7 py-4 text-[13px] font-bold text-white transition-all duration-300 hover:border-white hover:bg-white/15"
              >{tr("Discover our tools")}</Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-10">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 sm:px-8 lg:px-12">
            <span>{tr("For the future of farming")}</span>
            <span className="hidden sm:inline">{tr("Scroll to explore ↓")}</span>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="bg-[#F8F7F2] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1344px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.23em] text-[#748B61]">{tr("The ProFarm philosophy")}</span>

            <h2 className="mt-6 max-w-[470px] font-serif text-[clamp(2.8rem,4.5vw,5rem)] leading-[1.08] tracking-[-0.045em] text-[#203F2C]">{tr("A better harvest starts with a better decision.")}</h2>
          </div>

          <div className="flex flex-col justify-end">
            <p className="max-w-[620px] text-[17px] leading-[1.95] text-[#647063]">{tr("Agriculture is more than growing crops. It's about understanding the soil beneath our feet, the changing weather above us, and the decisions that shape tomorrow.")}</p>

            <p className="mt-5 max-w-[620px] text-[17px] leading-[1.95] text-[#647063]">{tr("ProFarm brings essential farming knowledge and useful digital tools together in one accessible place, helping farmers work toward a more productive and sustainable future.")}</p>

            <Link
              to="/knowledge"
              className="group mt-9 inline-flex w-fit items-center gap-3 border-b border-[#244B35] pb-2 text-[13px] font-bold text-[#244B35]"
            >{tr("Learn more about farming")}<span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="bg-[#EBEEE4] px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1344px]">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.23em] text-[#748B61]">{tr("Explore the platform")}</span>

              <h2 className="mt-5 max-w-[650px] font-serif text-[clamp(2.8rem,4.5vw,5rem)] leading-[1.08] tracking-[-0.045em] text-[#203F2C]">{tr("Everything you need to grow smarter.")}</h2>
            </div>

            <Link
              to="/tools"
              className="group inline-flex w-fit items-center gap-3 border-b border-[#244B35] pb-2 text-[13px] font-bold text-[#244B35]"
            >{tr("View all tools")}<span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {features.map((feature) => (
              <Link
                key={feature.number}
                to={feature.link}
                className="group overflow-hidden rounded-[22px] bg-[#F8F7F2] shadow-[0_8px_32px_rgba(26,58,39,0.035)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(26,58,39,0.1)]"
              >
                <div className="relative h-[280px] overflow-hidden sm:h-[360px]">
                  <img
                    src={feature.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute left-6 top-6 rounded-full border border-white/50 bg-white/90 px-4 py-2 text-[10px] font-bold tracking-[0.16em] text-[#244B35] backdrop-blur-md">
                    {tr(feature.category)}
                  </div>
                </div>

                <div className="p-7 sm:p-9">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <span className="text-[11px] font-bold tracking-[0.18em] text-[#849478]">
                        {feature.number}{tr("/ PROFARM")}</span>

                      <h3 className="mt-4 font-serif text-[36px] leading-[1.1] tracking-[-0.04em] text-[#203F2C] sm:text-[43px]">
                        {tr(feature.title)}
                      </h3>
                    </div>

                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#CBD6C3] text-xl text-[#244B35] transition-all duration-300 group-hover:rotate-45 group-hover:bg-[#244B35] group-hover:text-white"
                    >
                      ↗
                    </span>
                  </div>

                  <p className="mt-5 max-w-[440px] text-[14px] leading-[1.85] text-[#697568]">
                    {tr(feature.description)}
                  </p>

                  <span className="mt-7 inline-block border-b border-[#244B35]/40 pb-1 text-[12px] font-bold text-[#244B35]">
                    {tr(feature.action)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FARMING TOOLS WITH PHOTOGRAPHIC BACKGROUNDS */}
      <section className="bg-[#F8F7F2] px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1344px]">
          <div className="mb-12 text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.23em] text-[#748B61]">{tr("Practical tools, meaningful insights")}</span>

            <h2 className="mx-auto mt-5 max-w-[750px] font-serif text-[clamp(2.7rem,4.5vw,5rem)] leading-[1.08] tracking-[-0.045em] text-[#203F2C]">{tr("Your farm. Your decisions. Better informed.")}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {farmingTools.map((tool) => (
              <Link
                key={tool.number}
                to={tool.path}
                className="group relative isolate flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[20px] bg-[#183B29] p-7 text-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(26,58,39,0.2)] sm:p-8"
              >
                <img
                  src={tool.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#09291B]/95 via-[#102E20]/70 to-[#102E20]/35" />

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#DBE9CE]">
                    {tool.number}{tr("— PROFARM TOOLS")}</span>
                </div>

                <div>
                  <h3 className="font-serif text-[31px] leading-[1.12] tracking-[-0.035em] text-white">
                    {tr(tool.title)}
                  </h3>

                  <p className="mt-4 max-w-[350px] text-[14px] leading-[1.8] text-white/85">
                    {tr(tool.description)}
                  </p>

                  <span className="mt-8 flex items-center justify-between border-t border-white/25 pt-5 text-[12px] font-bold text-[#E1EFCF]">
                    {tr(tool.action)}

                    <span
                      aria-hidden="true"
                      className="text-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    >
                      ↗
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL BANNER */}
      <section className="relative min-h-[550px] overflow-hidden bg-[#193B29]">
        <img
          src={farmingImage}
          alt={tr("Agricultural landscape with cultivated green fields")}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-[#10291D]/65" />

        <div className="relative mx-auto flex min-h-[550px] max-w-[1344px] flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#D5E4B6]">{tr("Growing a sustainable tomorrow")}</span>

          <h2 className="mt-7 max-w-[880px] font-serif text-[clamp(3rem,6vw,6.5rem)] leading-[1.05] tracking-[-0.05em] text-white">{tr("Every great harvest begins with knowledge.")}</h2>

          <p className="mt-7 max-w-[570px] text-[15px] leading-[1.9] text-white/80">{tr("Explore agricultural knowledge and discover tools designed to support better farming decisions.")}</p>

          <Link
            to="/knowledge"
            className="mt-9 inline-flex items-center gap-4 rounded-full bg-[#D5E4B6] px-8 py-4 text-[13px] font-bold text-[#1B3E2B] transition-all hover:-translate-y-1 hover:bg-white"
          >{tr("Start exploring")}<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </div>
  );
};
