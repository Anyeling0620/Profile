import { useEffect, useRef, useState } from "react";

/**
 * FX 共享 hooks —— 统一全站「是否允许动效」的判断与入场观察。
 *
 * 设计约束（踩过的坑）：
 * 1) SSR / 极旧环境没有 window / IntersectionObserver，必须有安全回退，
 *    且**不能在 effect 体内同步 setState**（会触发级联渲染告警）。
 * 2) 一次性触发：进入视口后立刻 unobserve，避免滚动反复计算。
 * 3) reduced-motion 与触屏判断都在这里集中，组件不必各写一份 matchMedia。
 */

/** 统一入场观察：进入视口一次即返回 true。 */
export function useInView({
  rootMargin = "0px 0px -14% 0px",
  threshold = 0.12,
  once = true,
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setInView(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return [ref, inView];
}

/* 首帧就从 matchMedia 读真实偏好（惰性初始化），
   避免「先渲染一次默认值、再在 effect 里改回来」造成的闪烁与级联渲染。 */
function readPrefs() {
  if (typeof window === "undefined" || !window.matchMedia) {
    /* 无 window（SSR / 预渲染）：按「保守」处理——不动效、视作触屏 */
    return { reduceMotion: false, coarsePointer: true, ready: false };
  }
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const compact = window.matchMedia("(max-width: 767px)");
  return {
    reduceMotion: motion.matches,
    coarsePointer: coarse.matches || compact.matches,
    ready: true,
  };
}

/**
 * 是否允许播放动效：
 *  - allowMotion    → 用户没开 reduced-motion
 *  - allowPointerFX → 非触屏且非 reduced（磁吸/倾斜/自定义光标用）
 */
export function useMotionPrefs() {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const compact = window.matchMedia("(max-width: 767px)");

    /* 监听器回调里 setState 是允许的（不是 effect 体内的同步调用）；
       这里只在真实变化时更新，避免无意义重渲染。 */
    const sync = () => {
      const next = {
        reduceMotion: motion.matches,
        coarsePointer: coarse.matches || compact.matches,
        ready: true,
      };
      setPrefs((prev) =>
        prev.reduceMotion === next.reduceMotion &&
        prev.coarsePointer === next.coarsePointer &&
        prev.ready === next.ready
          ? prev
          : next,
      );
    };

    motion.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    compact.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
      compact.removeEventListener("change", sync);
    };
  }, []);

  const allowMotion = !prefs.reduceMotion;
  const allowPointerFX = allowMotion && !prefs.coarsePointer;
  return { ...prefs, allowMotion, allowPointerFX };
}

/**
 * 运行时帧率自适应：连续低速时给 <html> 打 data-perf="low"。
 *
 * 为什么需要：本站动效较重（多层极光 + 噪点混合 + 玻璃模糊），
 * 独显机器很轻松，但软渲染 / 老核显 / 低端集显可能只有十几帧。
 * 与其让这些用户一直卡，不如主动降级：
 *   data-perf="low" → index.css 关掉噪点的 mix-blend-mode（实测最大单笔开销），
 *   装饰性效果同步减弱。
 *
 * 判据刻意保守，避免误伤正常设备：
 *   - 首屏后 1.5s 才开始采样，跳过进场动画期；
 *   - 连续采样 3 秒，平均帧率 < 26 才判定为低；
 *   - 判定为 low 后不再回升（避免阈值附近来回抖动）；
 *   - reduced-motion 用户不参与；
 *   - 若已手动设置过 data-perf（low/normal），尊重用户设置，不覆盖。
 */
export function usePerfGuard({ fpsFloor = 26, sampleMs = 3000, warmupMs = 1500 } = {}) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.requestAnimationFrame) {
      return undefined;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const root = document.documentElement;
    /* 已经有显式设置（low/normal）就不再自动改了 */
    if (root.dataset.perf) return undefined;

    let raf = 0;
    let frames = 0;
    let start = 0;
    let done = false;

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const tick = () => {
      if (done) return;
      if (!start) start = performance.now();
      frames += 1;
      const elapsed = performance.now() - start;
      if (elapsed >= sampleMs) {
        const fps = frames / (elapsed / 1000);
        if (fps < fpsFloor) root.dataset.perf = "low";
        done = true;
        stop();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const warmupTimer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, warmupMs);

    return () => {
      done = true;
      window.clearTimeout(warmupTimer);
      stop();
    };
  }, [fpsFloor, sampleMs, warmupMs]);
}
