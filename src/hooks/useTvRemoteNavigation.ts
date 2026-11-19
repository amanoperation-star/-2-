import { useEffect, useRef } from 'react';

interface UseTvRemoteNavigationOptions {
  enabled?: boolean;
  onBack?: () => boolean;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function isVisibleFocusable(el: HTMLElement): boolean {
  if (!el || el.hasAttribute('disabled')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getActiveScopeRoot(): HTMLElement {
  const overlays = Array.from(
    document.querySelectorAll<HTMLElement>('[role="dialog"], .fixed.inset-0')
  ).filter((el) => {
    const st = window.getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && el.querySelector(FOCUSABLE_SELECTOR) !== null;
  });

  if (overlays.length > 0) {
    // Pick the topmost overlay by DOM order & z-index
    overlays.sort((a, b) => {
      const za = parseInt(window.getComputedStyle(a).zIndex || '0', 10) || 0;
      const zb = parseInt(window.getComputedStyle(b).zIndex || '0', 10) || 0;
      return za - zb;
    });
    return overlays[overlays.length - 1];
  }
  return document.body;
}

function findNextFocusableInDirection(
  current: HTMLElement | null,
  direction: 'up' | 'down' | 'left' | 'right',
  candidates: HTMLElement[]
): HTMLElement | null {
  if (candidates.length === 0) return null;
  if (!current || !candidates.includes(current)) {
    return candidates[0];
  }

  const curRect = current.getBoundingClientRect();
  const cx = curRect.left + curRect.width / 2;
  const cy = curRect.top + curRect.height / 2;

  let bestEl: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const cand of candidates) {
    if (cand === current) continue;
    const r = cand.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    let isInDirection = false;
    let primaryDist = 0;
    let secondaryDist = 0;

    if (direction === 'right') {
      isInDirection = dx > 6;
      primaryDist = dx;
      secondaryDist = Math.abs(dy);
    } else if (direction === 'left') {
      isInDirection = dx < -6;
      primaryDist = -dx;
      secondaryDist = Math.abs(dy);
    } else if (direction === 'down') {
      isInDirection = dy > 6;
      primaryDist = dy;
      secondaryDist = Math.abs(dx);
    } else if (direction === 'up') {
      isInDirection = dy < -6;
      primaryDist = -dy;
      secondaryDist = Math.abs(dx);
    }

    if (!isInDirection) continue;

    // Weight perpendicular offset heavier so D-Pad stays in aligned rows/columns
    const score = primaryDist + secondaryDist * 2.2;
    if (score < bestScore) {
      bestScore = score;
      bestEl = cand;
    }
  }

  return bestEl;
}

export function useTvRemoteNavigation({
  enabled = true,
  onBack,
}: UseTvRemoteNavigationOptions): void {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (enabled) {
      document.documentElement.classList.add('tv-remote-focus-enabled');
    } else {
      document.documentElement.classList.remove('tv-remote-focus-enabled', 'tv-remote-active');
    }
  }, [enabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    const handlePointer = () => {
      document.documentElement.classList.remove('tv-remote-active');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTextInput =
        tag === 'input' || tag === 'textarea' || Boolean(target?.isContentEditable);

      if (e.key === 'Escape' || (e.key === 'Backspace' && !isTextInput)) {
        if (onBackRef.current && onBackRef.current()) {
          e.preventDefault();
          return;
        }
      }

      // Allow normal typing or <select> option navigation when focused inside form controls
      if (tag === 'textarea' || (tag === 'input' && (target as HTMLInputElement).type !== 'range' && (target as HTMLInputElement).type !== 'checkbox')) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
      }
      if (tag === 'select' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        return;
      }

      const directionMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };

      const dir = directionMap[e.key];
      if (!dir) {
        if (e.key === 'Enter' || e.key === ' ') {
          document.documentElement.classList.add('tv-remote-active');
        }
        return;
      }

      const scope = getActiveScopeRoot();
      const candidates = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        isVisibleFocusable
      );
      if (candidates.length === 0) return;

      const activeEl =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const nextEl = findNextFocusableInDirection(activeEl, dir, candidates);
      if (nextEl) {
        e.preventDefault();
        document.documentElement.classList.add('tv-remote-active');
        nextEl.focus({ preventScroll: false });
        nextEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointer, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointer);
    };
  }, [enabled]);
}
