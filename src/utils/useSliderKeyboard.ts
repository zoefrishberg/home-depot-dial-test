import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

interface UseSliderKeyboardOptions {
  enabled?: boolean;
  setIsTouching: (held: boolean) => void;
  setIntensity: Dispatch<SetStateAction<number>>;
  // Intensity units traveled per second while an arrow key is held.
  // Default crosses the full -100..100 range in ~0.8s.
  speed?: number;
}

/**
 * Optimal keyboard control for the dial-test slider.
 *
 * - Hold `Space` to "press" the slider (mirrors a held pointer): plays the
 *   video / advances the tutorial clock; releasing Space lifts the press.
 * - Hold `ArrowUp` / `ArrowDown` to move the fader smoothly via rAF, clamped
 *   to [-100, 100]. Movement is decoupled from Space so users can adjust the
 *   value before or while playing.
 * - Ignored while focus is in a text field, so the feedback typeform isn't
 *   hijacked. Resets pressed state on window blur to avoid stuck Space.
 */
export function useSliderKeyboard({
  enabled = true,
  setIsTouching,
  setIntensity,
  speed = 250,
}: UseSliderKeyboardOptions): void {
  const dirRef = useRef(0); // -1 = down, 0 = idle, +1 = up
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const spaceHeldRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const isTextField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    };

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (dirRef.current !== 0) {
        setIntensity(prev => {
          const next = prev + dirRef.current * speed * dt;
          return Math.max(-100, Math.min(100, next));
        });
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        lastTsRef.current = null;
      }
    };

    const ensureLoop = () => {
      if (rafRef.current == null && dirRef.current !== 0) {
        lastTsRef.current = null;
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextField(e.target)) return;

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (e.repeat) return;
        if (!spaceHeldRef.current) {
          spaceHeldRef.current = true;
          setIsTouching(true);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        dirRef.current = 1;
        ensureLoop();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        dirRef.current = -1;
        ensureLoop();
        return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (spaceHeldRef.current) {
          spaceHeldRef.current = false;
          setIsTouching(false);
        }
        return;
      }
      if (e.key === "ArrowUp" && dirRef.current === 1) {
        dirRef.current = 0;
        return;
      }
      if (e.key === "ArrowDown" && dirRef.current === -1) {
        dirRef.current = 0;
        return;
      }
    };

    const onBlur = () => {
      if (spaceHeldRef.current) {
        spaceHeldRef.current = false;
        setIsTouching(false);
      }
      dirRef.current = 0;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      dirRef.current = 0;
      lastTsRef.current = null;
      if (spaceHeldRef.current) {
        spaceHeldRef.current = false;
        setIsTouching(false);
      }
    };
  }, [enabled, setIsTouching, setIntensity, speed]);
}
