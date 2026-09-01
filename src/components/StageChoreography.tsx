"use client";

import { useEffect } from "react";

/* ---------------------------------------------------------------------------
   The landing's motion, in one effect.

   It works on the DOM rather than through React state on purpose: both panels
   are static server-rendered markup, and what moves is a handful of CSS custom
   properties read by globals.css. Nothing here re-renders a component.

   Three jobs:
     1. Fit the 1685x1073 design canvas to the viewport (desktop), or scale
        each feature card into its slot (tablet).
     2. Own the hero -> features transition: on the canvas the wheel does not
        scroll, it plays a scripted 3.4s sequence and snaps at the midpoint.
     3. Small interactive bits that live in static markup — nav pills, the
        burger menus, the showcase dots.
--------------------------------------------------------------------------- */

const DESIGN_WIDTH = 1685;
const DESIGN_HEIGHT = 1073;

const CANVAS = "(min-width: 1200px)";
const TABLET = "(min-width: 600px) and (max-width: 1199.98px)";
const BELOW_CANVAS = "(max-width: 1199.98px)";

/** Total budget of the scripted transition, each direction. */
const FORWARD_MS = 3400;
const BACK_MS = 1600;
/** Where in that budget the document actually jumps between panels. */
const SNAP_MS = 800;
/** ...and where the globe clip is close enough to matter. */
const GLOBE_MS = 1880;

/** Every property the effect writes, so cleanup can hand them all back. */
const SCENE_VARS = [
  "--scene-opacity",
  "--scene-y",
  "--scene-scale",
  "--feature-scene-opacity",
  "--feature-scene-y",
  "--feature-scene-scale",
  "--title-opacity",
  "--security-base",
  "--security-art",
  "--transfer-base",
  "--transfer-art",
  "--staking-base",
  "--staking-rings",
  "--staking-card",
  "--staking-badge",
  "--staking-tag",
];

/** [property, start ms, span ms] — the order the feature panel assembles in. */
const FEATURE_REVEALS: Array<[string, number, number]> = [
  ["--security-base", 1060, 420],
  ["--security-art", 1480, 420],
  ["--transfer-base", 1390, 430],
  ["--transfer-art", 1880, 470],
  ["--staking-base", 1900, 440],
  ["--staking-rings", 2220, 430],
  ["--staking-card", 2580, 430],
  ["--staking-badge", 2920, 340],
  ["--staking-tag", 3140, 260],
];

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/**
 * Flat, then a rush. At 0.5 this is still only ~0.002 of the travel, so the
 * panel barely creeps for most of the transition and then leaves fast.
 */
const swoop = (progress: number) => (progress <= 0 ? 0 : Math.pow(2, 9.1 * (progress - 1)));

/** 0 until `start`, 1 by `start + span`, eased out. */
const reveal = (ms: number, start: number, span: number) =>
  1 - Math.pow(1 - clamp01((ms - start) / span), 2.2);

/**
 * cubic-bezier(0.42, 0.09, 0, 1), solved for y at x by Newton's method.
 * Used only for the nav pills sliding from the hero's left edge to centre.
 */
function pillEase(x: number) {
  let t = x;
  for (let i = 0; i < 8; i += 1) {
    const fx = 3 * (1 - t) * (1 - t) * t * 0.42 + 3 * (1 - t) * t * t * 0 + t * t * t;
    const dx = 3 * (1 - t) * (1 - t) * 0.42 - 6 * (1 - t) * t * 0.42 + 3 * t * t * 1;
    if (Math.abs(dx) < 1e-6) break;
    t = Math.min(1, Math.max(0, t - (fx - x) / dx));
  }
  return 3 * (1 - t) * (1 - t) * t * 0.09 + 3 * (1 - t) * t * t * 1 + t * t * t;
}

export function StageChoreography() {
  useEffect(() => {
    const stage = document.getElementById("stage");
    if (!stage) return;

    const cleanups: Array<() => void> = [];

    /* --- 1. Fit ---------------------------------------------------------- */

    function fit() {
      if (!stage) return;
      const width = document.documentElement.clientWidth;

      if (window.matchMedia(CANVAS).matches) {
        const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
        // The panel is drawn at viewport/scale and scaled back down, so it
        // fills the screen exactly while its children keep design pixels.
        stage.style.setProperty("--scale", String(scale));
        stage.style.setProperty("--layout-width", `${width / scale}px`);
        stage.style.setProperty("--layout-height", `${height / scale}px`);
        return;
      }

      stage.style.removeProperty("--scale");
      stage.style.removeProperty("--layout-width");
      stage.style.removeProperty("--layout-height");

      const slots = document.querySelectorAll<HTMLElement>(".lcard-slot");

      if (!window.matchMedia(TABLET).matches) {
        slots.forEach((slot) => {
          slot.style.removeProperty("--card-scale");
          slot.style.removeProperty("--crop-shift");
          slot.style.removeProperty("height");
        });
        return;
      }

      // Tablets keep the authored card art and shrink it into the column,
      // cropping the empty space above the surface (--crop-top).
      slots.forEach((slot) => {
        const card = slot.firstElementChild as HTMLElement | null;
        if (!card?.offsetWidth) return;
        const scale = slot.clientWidth / card.offsetWidth;
        const cropTop = parseFloat(getComputedStyle(card).getPropertyValue("--crop-top")) || 0;
        slot.style.setProperty("--card-scale", String(scale));
        slot.style.setProperty("--crop-shift", `${-cropTop * scale}px`);
        slot.style.height = `${(card.offsetHeight - cropTop) * scale}px`;
      });
    }

    let fitFrame: number | null = null;
    const requestFit = () => {
      if (fitFrame) cancelAnimationFrame(fitFrame);
      fitFrame = requestAnimationFrame(fit);
    };

    window.addEventListener("resize", requestFit);
    window.addEventListener("orientationchange", requestFit);
    window.visualViewport?.addEventListener("resize", requestFit);
    window.addEventListener("load", fit);
    fit();

    cleanups.push(() => {
      if (fitFrame) cancelAnimationFrame(fitFrame);
      window.removeEventListener("resize", requestFit);
      window.removeEventListener("orientationchange", requestFit);
      window.visualViewport?.removeEventListener("resize", requestFit);
      window.removeEventListener("load", fit);
    });

    /* --- 2. The transition ----------------------------------------------- */

    const slots = document.querySelectorAll<HTMLElement>(".panel-slot");
    const heroScene = document.querySelector<HTMLElement>(".hero__scene");
    const featureScene = document.querySelector<HTMLElement>(".lifestyle__scene");
    const heroNav = document.querySelector<HTMLElement>(".hero .navlinks");
    const heroVideo = document.querySelector<HTMLVideoElement>(".showcase__video");
    const globe = document.querySelector<HTMLVideoElement>(".globe");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    function playGlobe() {
      if (!globe || reduced.matches || !globe.paused) return;
      // The travelling dot is tied to the clip: if playback is refused
      // (autoplay policy), the class comes straight back off.
      featureScene?.classList.add("has-transfer-loop");
      globe.play()?.catch(() => featureScene?.classList.remove("has-transfer-loop"));
    }

    function stopGlobe() {
      globe?.pause();
      featureScene?.classList.remove("has-transfer-loop");
    }

    function rewindGlobe() {
      if (!globe) return;
      stopGlobe();
      try {
        globe.currentTime = 0;
      } catch {
        // Safari throws if the clip has not buffered yet; the next play resets it.
      }
    }

    function syncVideos() {
      if (heroVideo) {
        if (reduced.matches) heroVideo.pause();
        else heroVideo.play()?.catch(() => {});
      }
      if (!globe) return;
      if (reduced.matches) stopGlobe();
      // Off the canvas there is no scripted arrival to wait for.
      else if (!window.matchMedia(CANVAS).matches) playGlobe();
    }

    reduced.addEventListener("change", syncVideos);
    cleanups.push(() => reduced.removeEventListener("change", syncVideos));
    syncVideos();

    /** How far the nav pills have to travel to sit centred on panel two. */
    function pillTravel() {
      const lifestyle = document.querySelector(".lifestyle");
      if (!lifestyle || !stage) return 0;
      const scale = parseFloat(getComputedStyle(stage).getPropertyValue("--scale")) || 1;
      return lifestyle.getBoundingClientRect().width / scale / 2 - 142.5 - 96.76;
    }

    /** Hero at `ms` into the transition; 0 is composed, SNAP_MS is gone. */
    function heroState(ms: number) {
      if (!heroScene || !heroNav) return;
      const t = clamp01(ms / SNAP_MS);
      heroScene.style.setProperty("--scene-opacity", String(1 - t));
      heroScene.style.setProperty("--scene-y", `${-3150 * swoop(t)}px`);
      heroScene.style.setProperty("--scene-scale", String(1 - 0.039 * Math.pow(t, 0.62)));
      heroNav.style.setProperty("--pill-x", `${pillTravel() * pillEase(clamp01((ms - 17) / 733))}px`);
    }

    /** Feature panel as a whole: 0 composed, 1 thrown downward. */
    function featureState(progress: number) {
      if (!featureScene) return;
      const t = clamp01(progress);
      featureScene.style.setProperty("--feature-scene-opacity", String(1 - t));
      featureScene.style.setProperty("--feature-scene-y", `${3150 * swoop(t)}px`);
      featureScene.style.setProperty("--feature-scene-scale", String(1 - 0.039 * Math.pow(t, 0.62)));
    }

    /** The staggered assembly of the feature panel's parts. */
    function featureReveal(ms: number) {
      if (!featureScene) return;
      featureScene.style.setProperty("--title-opacity", String(reveal(ms, 750, 583)));
      for (const [name, start, span] of FEATURE_REVEALS) {
        featureScene.style.setProperty(name, String(reveal(ms, start, span)));
      }
    }

    function clearSceneVars() {
      [heroScene, featureScene].forEach((scene) => {
        if (!scene) return;
        SCENE_VARS.forEach((name) => scene.style.removeProperty(name));
      });
      heroNav?.style.removeProperty("--pill-x");
    }

    function snapTo(index: number) {
      // scroll-behavior is smooth for the nav links; the snap must not be.
      const previous = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      slots[index]?.scrollIntoView();
      document.documentElement.style.scrollBehavior = previous;
    }

    let transitioning = false;

    function run(forward: boolean) {
      transitioning = true;
      document.body.classList.add("is-transitioning");

      let startedAt: number | null = null;
      let snapped = false;
      let globeStarted = false;
      const total = forward ? FORWARD_MS : BACK_MS;

      if (forward) rewindGlobe();
      else stopGlobe();

      requestAnimationFrame(function step(now: number) {
        if (startedAt === null) startedAt = now;
        const elapsed = Math.min(now - startedAt, total);

        if (forward) {
          if (elapsed >= SNAP_MS && !snapped) {
            snapped = true;
            snapTo(1);
          }
          heroState(elapsed);
          featureReveal(elapsed);
          if (elapsed >= GLOBE_MS && !globeStarted) {
            globeStarted = true;
            playGlobe();
          }
        } else if (elapsed < SNAP_MS) {
          // Features leave first, hero held off-screen behind them.
          heroState(SNAP_MS);
          featureState(elapsed / SNAP_MS);
        } else {
          if (!snapped) {
            snapped = true;
            snapTo(0);
          }
          featureState(1);
          heroState(SNAP_MS - (elapsed - SNAP_MS));
        }

        if (elapsed < total) {
          requestAnimationFrame(step);
          return;
        }
        clearSceneVars();
        document.body.classList.remove("is-transitioning");
        transitioning = false;
      });
    }

    /** Which panel owns the middle of the viewport right now. */
    function currentSlot() {
      const middle = window.innerHeight / 2;
      for (let i = 0; i < slots.length; i += 1) {
        const rect = slots[i].getBoundingClientRect();
        if (rect.top <= middle && rect.bottom > middle) return i;
      }
      return -1;
    }

    function maybeTransition(direction: number, event: Event) {
      const scripted =
        slots.length === 2 &&
        heroScene &&
        featureScene &&
        window.matchMedia(CANVAS).matches &&
        !reduced.matches;

      if (!scripted || transitioning) {
        // Mid-sequence input is swallowed rather than queued.
        if (transitioning) event.preventDefault();
        return;
      }

      const current = currentSlot();
      if (direction > 0 && current === 0) {
        event.preventDefault();
        run(true);
      } else if (direction < 0 && current === 1) {
        event.preventDefault();
        run(false);
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 2) return;
      maybeTransition(event.deltaY > 0 ? 1 : -1, event);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    let touchStartY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY === null) return;
      const travelled = touchStartY - event.touches[0].clientY;
      if (Math.abs(travelled) <= 12) return;
      maybeTransition(travelled > 0 ? 1 : -1, event);
      touchStartY = null;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    const onKeyDown = (event: KeyboardEvent) => {
      if (["PageDown", "ArrowDown", " "].includes(event.key)) maybeTransition(1, event);
      else if (["PageUp", "ArrowUp"].includes(event.key)) maybeTransition(-1, event);
    };
    window.addEventListener("keydown", onKeyDown);

    const onHashChange = () => {
      // Jumping by link skips the sequence, so the scene vars have to go back
      // to their resting values or the panel stays half-assembled.
      clearSceneVars();
      if (window.location.hash !== "#features" || reduced.matches) return;
      rewindGlobe();
      playGlobe();
    };
    window.addEventListener("hashchange", onHashChange);

    cleanups.push(() => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("hashchange", onHashChange);
      document.body.classList.remove("is-transitioning");
      clearSceneVars();
    });

    /* --- 3. Static markup that still has to respond ---------------------- */

    // Both top bars hold the same three links, so the active state is matched
    // on href and applied to every copy.
    const pills = Array.from(document.querySelectorAll<HTMLAnchorElement>(".pill"));
    const pillCleanups = pills.map((pill) => {
      const onClick = () => {
        const href = pill.getAttribute("href") ?? "";
        pills.forEach((other) => {
          const active = other.getAttribute("href") === href;
          other.classList.toggle("is-active", active);
          if (active) other.setAttribute("aria-current", "true");
          else other.removeAttribute("aria-current");
        });
      };
      pill.addEventListener("click", onClick);
      return () => pill.removeEventListener("click", onClick);
    });
    cleanups.push(() => pillCleanups.forEach((off) => off()));

    type Menu = { burger: HTMLElement; menu: HTMLElement };
    const menus: Menu[] = [];
    const menuCleanups: Array<() => void> = [];

    function setMenuOpen(entry: Menu, open: boolean) {
      entry.menu.classList.toggle("is-open", open);
      entry.burger.setAttribute("aria-expanded", String(open));
      entry.burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    function closeMenus(returnFocus: boolean) {
      menus.forEach((entry) => {
        if (!entry.menu.classList.contains("is-open")) return;
        setMenuOpen(entry, false);
        if (returnFocus) entry.burger.focus();
      });
    }

    document.querySelectorAll<HTMLElement>(".navburger").forEach((burger) => {
      const menu = document.getElementById(burger.getAttribute("aria-controls") ?? "");
      if (!menu) return;
      const entry: Menu = { burger, menu };
      menus.push(entry);

      const onBurgerClick = () => {
        if (menu.classList.contains("is-open")) {
          closeMenus(false);
          return;
        }
        menus.forEach((other) => {
          if (other !== entry) setMenuOpen(other, false);
        });
        setMenuOpen(entry, true);
        const first = entry.menu.querySelector("a");
        if (first) requestAnimationFrame(() => first.focus());
      };
      const onMenuClick = (event: Event) => {
        if ((event.target as HTMLElement).closest("a")) closeMenus(false);
      };

      burger.addEventListener("click", onBurgerClick);
      menu.addEventListener("click", onMenuClick);
      menuCleanups.push(() => {
        burger.removeEventListener("click", onBurgerClick);
        menu.removeEventListener("click", onMenuClick);
      });
    });

    const onDocumentClick = (event: Event) => {
      const target = event.target as Node;
      for (const entry of menus) {
        if (entry.menu.contains(target) || entry.burger.contains(target)) return;
      }
      closeMenus(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus(true);
    };
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onEscape);

    const belowCanvas = window.matchMedia(BELOW_CANVAS);
    const onBreakpoint = () => {
      if (!belowCanvas.matches) closeMenus(false);
      syncVideos();
    };
    belowCanvas.addEventListener("change", onBreakpoint);

    cleanups.push(() => {
      menuCleanups.forEach((off) => off());
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
      belowCanvas.removeEventListener("change", onBreakpoint);
    });

    // The dots are presentational: one card render, three positions in the
    // story. Nothing swaps behind them yet.
    const dots = Array.from(document.querySelectorAll<HTMLButtonElement>(".dot"));
    const dotCleanups = dots.map((dot, index) => {
      const onClick = () => {
        dots.forEach((other, otherIndex) => {
          const active = otherIndex === index;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", String(active));
        });
      };
      dot.addEventListener("click", onClick);
      return () => dot.removeEventListener("click", onClick);
    });
    cleanups.push(() => dotCleanups.forEach((off) => off()));

    return () => cleanups.forEach((off) => off());
  }, []);

  return null;
}
