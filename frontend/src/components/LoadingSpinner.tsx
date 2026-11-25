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
          className="absolute inset-0 rounded-full border-[3px] border-[#DCEBE6]"
        />

        {/* Rotating foreground ring */}
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#265A5F] border-r-[#699B92] motion-reduce:animate-none"
        />

        {/* Inner decorative circle */}
        <div
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E3F2E9]"
        >
          <div className="h-2 w-2 rounded-full bg-[#4A827D]" />
        </div>
      </div>

      {/* Loading label */}
      <p className="text-center text-sm font-medium tracking-wide text-[#63817F]">
        {tr(label)}
      </p>

      <span className="sr-only">{tr("Please wait while the requested information is being loaded.")}</span>
    </div>
  );
};
