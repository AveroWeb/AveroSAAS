"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TourStep = {
  /** CSS selector for the element to spotlight. Omitted = centered card. */
  target?: string;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    title: "Bienvenue sur Avero 👋",
    body: "Un tour rapide pour repérer l'essentiel. Moins d'une minute — et tu peux passer quand tu veux.",
  },
  {
    target: '[data-tour="sidebar-nav"]',
    title: "La navigation",
    body: "Tout est ici : dashboard, clients, emails, devis, factures, incidents… Le bouton en haut réduit le menu en icônes.",
  },
  {
    target: '[data-tour="nav-clients"]',
    title: "Tes clients",
    body: "Le cœur de l'app. Chaque fiche regroupe les sites, domaines, hébergements, tâches, devis et factures du client.",
  },
  {
    target: '[data-tour="nav-emails"]',
    title: "Les emails",
    body: "Ta boîte mail synchronisée dans Avero, avec tri et notifications à chaque nouveau message.",
  },
  {
    target: '[data-tour="nav-agent"]',
    title: "L'agent IA",
    body: "Demande-lui de créer un devis, ajouter une tâche ou retrouver une info — en langage naturel.",
  },
  {
    target: '[data-tour="search"]',
    title: "Recherche rapide",
    body: "Retrouve un client en deux lettres, sans quitter la page où tu te trouves.",
  },
  {
    target: '[data-tour="chat-bubble"]',
    title: "L'assistant, toujours dispo",
    body: "Une question sur tes données ou sur l'app ? Cette bulle ouvre l'assistant à tout moment.",
  },
  {
    title: "C'est parti 🚀",
    body: "Tu peux relancer ce guide quand tu veux depuis le menu en haut à droite → « Revoir le guide ».",
  },
];

/** Dispatch `new Event(TOUR_EVENT)` on `window` to (re)start the tour. */
export const TOUR_EVENT = "avero:start-tour";
const STORAGE_PREFIX = "avero.tour.v1.";
const SPOT_PAD = 8;
const CARD_W = 340;
const GAP = 14;
const MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type Box = { top: number; left: number; width: number; height: number };

export function ProductTour({ userId }: { userId: string }) {
  const storageKey = STORAGE_PREFIX + userId;

  const [index, setIndex] = useState(-1);
  const [box, setBox] = useState<Box | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [cardH, setCardH] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const active = index >= 0 && index < STEPS.length;
  const step = active ? STEPS[index] : null;
  const isLast = index === STEPS.length - 1;

  const finish = useCallback(() => {
    setIndex(-1);
    setBox(null);
    try {
      localStorage.setItem(storageKey, "done");
    } catch {
      // storage unavailable — tour will simply auto-start again next time
    }
  }, [storageKey]);

  const start = useCallback(() => {
    setCardH(0);
    setBox(null);
    setIndex(0);
  }, []);

  const goNext = useCallback(() => setIndex((i) => Math.min(STEPS.length - 1, i + 1)), []);
  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Auto-start once per user (persisted per browser). Runs on mount only;
  // `index` stays -1 (nothing rendered) until the timer or a manual trigger fires.
  useEffect(() => {
    let done = false;
    try {
      done = localStorage.getItem(storageKey) === "done";
    } catch {
      done = false;
    }
    if (done) return;
    const t = window.setTimeout(() => setIndex(0), 700);
    return () => window.clearTimeout(t);
  }, [storageKey]);

  // Manual restart from anywhere (e.g. the user menu).
  useEffect(() => {
    const onStart = () => start();
    window.addEventListener(TOUR_EVENT, onStart);
    return () => window.removeEventListener(TOUR_EVENT, onStart);
  }, [start]);

  // Track the current target's rect + the viewport size.
  useEffect(() => {
    if (!active || !step) return;

    const initial = step.target
      ? document.querySelector<HTMLElement>(step.target)
      : null;
    initial?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });

    let lastKey = "";
    const measure = () => {
      setVp({ w: window.innerWidth, h: window.innerHeight });
      const el = step.target
        ? document.querySelector<HTMLElement>(step.target)
        : null;
      if (!el) {
        setBox(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setBox(null);
        return;
      }
      const key = `${r.top}|${r.left}|${r.width}|${r.height}`;
      if (key === lastKey) return;
      lastKey = key;
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const settle = window.setTimeout(measure, 280);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, step, index]);

  // Keyboard navigation.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isLast) finish();
        else goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, isLast, finish, goNext, goPrev]);

  // Measure the card + move focus to it on each step.
  useEffect(() => {
    if (!active) return;
    const el = cardRef.current;
    if (!el) return;
    setCardH(el.offsetHeight);
    el.focus({ preventScroll: true });
  }, [active, index, box, vp]);

  if (!active || !step) return null;

  // Spotlight rectangle (padded target, clamped to the viewport).
  let spot: { t: number; l: number; w: number; h: number } | null = null;
  if (box && vp.w > 0) {
    const t = clamp(box.top - SPOT_PAD, 0, vp.h);
    const l = clamp(box.left - SPOT_PAD, 0, vp.w);
    const r = clamp(box.left + box.width + SPOT_PAD, 0, vp.w);
    const b = clamp(box.top + box.height + SPOT_PAD, 0, vp.h);
    spot = { t, l, w: Math.max(0, r - l), h: Math.max(0, b - t) };
  }

  // Card placement: below → above → right → left → centered.
  let placement: "below" | "above" | "right" | "left" | "center" = "center";
  if (spot && vp.w > 0 && vp.h > 0) {
    if (spot.t + spot.h + GAP + cardH <= vp.h - MARGIN) placement = "below";
    else if (spot.t - GAP - cardH >= MARGIN) placement = "above";
    else if (spot.l + spot.w + GAP + CARD_W <= vp.w - MARGIN) placement = "right";
    else if (spot.l - GAP - CARD_W >= MARGIN) placement = "left";
    else placement = "center";
  }

  let cardTop = 0;
  let cardLeft = 0;
  if (placement !== "center" && spot && box) {
    const centerLeft = clamp(
      box.left + box.width / 2 - CARD_W / 2,
      MARGIN,
      Math.max(MARGIN, vp.w - CARD_W - MARGIN),
    );
    const midTop = clamp(
      box.top + box.height / 2 - cardH / 2,
      MARGIN,
      Math.max(MARGIN, vp.h - cardH - MARGIN),
    );
    if (placement === "below") {
      cardTop = spot.t + spot.h + GAP;
      cardLeft = centerLeft;
    } else if (placement === "above") {
      cardTop = spot.t - GAP - cardH;
      cardLeft = centerLeft;
    } else if (placement === "right") {
      cardTop = midTop;
      cardLeft = spot.l + spot.w + GAP;
    } else {
      cardTop = midTop;
      cardLeft = spot.l - GAP - CARD_W;
    }
  }

  const centered = placement === "center";
  const cardStyle: React.CSSProperties = centered
    ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: CARD_W }
    : { top: cardTop, left: cardLeft, width: CARD_W };

  return createPortal(
    <div className="fixed inset-0 z-[9998] print:hidden">
      {spot ? (
        <>
          <div className="absolute bg-black/60" style={{ top: 0, left: 0, width: "100%", height: spot.t }} />
          <div className="absolute bg-black/60" style={{ top: spot.t + spot.h, left: 0, width: "100%", bottom: 0 }} />
          <div className="absolute bg-black/60" style={{ top: spot.t, left: 0, width: spot.l, height: spot.h }} />
          <div className="absolute bg-black/60" style={{ top: spot.t, left: spot.l + spot.w, right: 0, height: spot.h }} />
          <div
            className="pointer-events-none absolute rounded-lg transition-all duration-200"
            style={{
              top: spot.t,
              left: spot.l,
              width: spot.w,
              height: spot.h,
              boxShadow:
                "0 0 0 2px var(--background), 0 0 0 4px var(--primary), 0 0 0 10px color-mix(in oklch, var(--primary) 18%, transparent)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avero-tour-title"
        aria-describedby="avero-tour-body"
        tabIndex={-1}
        className="fixed z-[9999] rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl outline-none transition-[top,left] duration-200"
        style={{ ...cardStyle, visibility: centered || cardH > 0 ? "visible" : "hidden" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {index + 1} / {STEPS.length}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={finish} aria-label="Fermer le guide">
            <X className="size-4" />
          </Button>
        </div>

        <h3 id="avero-tour-title" className="mt-1 text-sm font-semibold">
          {step.title}
        </h3>
        <p id="avero-tour-body" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {isLast ? (
            <span />
          ) : (
            <Button variant="ghost" size="sm" onClick={finish}>
              Passer
            </Button>
          )}
          <div className="flex items-center gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={goPrev}>
                Précédent
              </Button>
            )}
            <Button size="sm" onClick={() => (isLast ? finish() : goNext())}>
              {index === 0 ? "Commencer" : isLast ? "Terminer" : "Suivant"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
