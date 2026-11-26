import { tr, useLocale } from '../i18n';

import React from 'react';

type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
};

const AlertIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 7v6" />
    <path d="M12 17h.01" />
  </svg>
);

const RetryIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 11a8 8 0 1 0-2.3 6" />
    <path d="M20 4v7h-7" />
  </svg>
);

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  useLocale();
  return (
    <div
      role="alert"
      className="my-3 overflow-hidden rounded-2xl border border-[#F0D5CF] bg-[#FFF8F5] shadow-[0_4px_18px_rgba(94,44,35,0.04)]"
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          {/* Warning icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCE8E2] text-[#B34E3D]">
            <AlertIcon />
          </div>

          {/* Error content */}
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-bold text-[#8C392D]">{tr("Something went wrong")}</p>

            <p className="mt-1 break-words text-sm leading-6 text-[#98675E]">
              {tr(message)}
            </p>
          </div>
        </div>

        {/* Optional retry button */}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#E8C9C1] bg-white px-4 py-2 text-xs font-bold text-[#9D4637] transition duration-200 hover:border-[#D9A99F] hover:bg-[#FFF0EA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B34E3D] sm:self-center"
          >
            <RetryIcon />{tr("Try Again")}</button>
        )}
      </div>
    </div>
  );
};
