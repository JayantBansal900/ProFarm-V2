import { tr, useLocale } from '../i18n';

import React from 'react';

type LoadingSpinnerProps = {
  label?: string;
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
}) => {
  useLocale();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-col items-center justify-center gap-4 py-10"
    >
      {/* Animated loading indicator */}
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Soft background ring */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-[3px] border-[#DDEADD]"
        />

        {/* Rotating foreground ring */}
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#285D3D] border-r-[#6B9971] motion-reduce:animate-none"
        />

        {/* Inner decorative circle */}
        <div
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F1E4]"
        >
          <div className="h-2 w-2 rounded-full bg-[#4C8057]" />
        </div>
      </div>

      {/* Loading label */}
      <p className="text-center text-sm font-medium tracking-wide text-[#64806A]">
        {tr(label)}
      </p>

      <span className="sr-only">{tr("Please wait while the requested information is being loaded.")}</span>
    </div>
  );
};
