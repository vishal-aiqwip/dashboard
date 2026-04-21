import { CONFIG } from '@/config';

export const LeftSide = () => {
  return (
    <div className="bg-primary relative hidden h-screen overflow-hidden lg:flex lg:flex-col lg:justify-between">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />

      {/* Floating shapes for depth */}
      <div className="absolute -top-20 -right-20 size-72 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-black/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <svg
              viewBox="0 0 128 128"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="size-6 text-white"
            >
              <path
                d="M63.6734 24.8486V49.3899C63.6734 57.4589 57.1322 64.0001 49.0632 64.0001H25.2041"
                stroke="currentColor"
                strokeWidth="8.11681"
              />
              <path
                d="M64.3266 103.152L64.3266 78.6106C64.3266 70.5416 70.8678 64.0003 78.9368 64.0003L102.796 64.0004"
                stroke="currentColor"
                strokeWidth="8.11681"
              />
              <line x1="93.3468" y1="35.6108" x2="76.555" y2="52.205" stroke="currentColor" strokeWidth="8.11681" />
              <line x1="51.7697" y1="77.0624" x2="34.9778" y2="93.6567" stroke="currentColor" strokeWidth="8.11681" />
              <line x1="50.9584" y1="51.3189" x2="34.2651" y2="34.6256" stroke="currentColor" strokeWidth="8.11681" />
              <line x1="93.1625" y1="93.6397" x2="76.4692" y2="76.9464" stroke="currentColor" strokeWidth="8.11681" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">{CONFIG.APP_NAME}</span>
        </div>

        {/* Hero text */}
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-white">
            Build smarter AI agents, effortlessly.
          </h1>
          <p className="text-lg leading-relaxed text-white/70">
            Create, configure, and deploy custom AI chat agents with knowledge bases, team sharing, and real-time analytics.
          </p>
        </div>

        {/* Bottom testimonial */}
        <div className="rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-sm leading-relaxed text-white/80 italic">
            &ldquo;We deployed 5 support agents in under an hour. The knowledge base and sharing features made it seamless for the entire team.&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-white/20 text-xs font-medium text-white">
              AK
            </div>
            <div>
              <p className="text-sm font-medium text-white">Alex K.</p>
              <p className="text-xs text-white/50">Product Lead</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};