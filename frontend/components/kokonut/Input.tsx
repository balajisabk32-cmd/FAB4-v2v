"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

/**
 * Kokonut Input — label above input (never placeholder-as-label),
 * helper text below, error below that. WCAG AA contrast on cream bg.
 * Radius 12px (smaller than cards/buttons by documented rule).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, errorText, className = "", id, ...rest }, ref) => {
    const inputId = id || rest.name;
    const describedBy = helperText || errorText ? `${inputId}-desc` : undefined;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-plum-800"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={errorText ? true : undefined}
          className={`w-full rounded-xl border bg-white/70 px-4 py-3 text-plum-900
            placeholder:text-ink-faint/70
            border-plum-700/20 focus:border-lavender-500 focus:bg-white
            outline-none transition-colors duration-200 ${className}`}
          {...rest}
        />
        {(helperText || errorText) && (
          <p
            id={describedBy}
            className={`text-xs ${errorText ? "text-blush-500" : "text-ink-soft"}`}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
