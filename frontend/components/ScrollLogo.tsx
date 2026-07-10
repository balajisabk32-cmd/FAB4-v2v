"use client";

/**
 * ScrollLogo — persistent settled corner mark.
 *
 * The load-time intro (IntroOverlay) now owns the logo's entrance: it reveals
 * the angel + "SAKHI" at center and glides them into this exact top-left
 * position. Once the intro completes, this static mark remains as the header
 * logo. Coordinates (top-2 / left-6) are intentionally identical to the
 * intro's end frame so the handoff is seamless.
 *
 * Real art: drop `public/angel-bust.png` in; until then it falls back to the
 * existing `logo.png`.
 */

export function ScrollLogo() {
  return (
    <div className="pointer-events-none fixed top-2 left-6 z-[60] flex items-center">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Sakhi — back to top"
        className="pointer-events-auto group flex items-center gap-2 border-0 bg-transparent p-0 cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Sakhi"
          className="h-10 w-auto mix-blend-multiply transition-opacity duration-300 group-hover:opacity-90"
        />
        <span className="text-3xl font-cute text-plum-900 pr-1">
          Sakhi
        </span>
      </button>
    </div>
  );
}
