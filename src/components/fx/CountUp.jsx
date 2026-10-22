import { useEffect, useRef } from "react";
import { useMotionPrefs } from "./useMotionPrefs";

/**
 * CountUp —— 进入视口时把数字从 0 滚到目标值（只跑一次）。
 *
 * 性能底线：rAF 里**直接写 DOM textContent**，不调用 setState，
 * 因此整个滚动计数过程零 React 重渲染（t5 明确要求）。
 * 无障碍：reduced-motion 时直接落终值，不启动 rAF。
 */
export default function CountUp({
  value,
  duration = 1200,
  delay = 0,
  suffix = "",
  prefix = "",
  className = "",
  /** 是否开始（一般传板块的 inView）；不传则挂载即开始 */
  start = true,
}) {
  const { reduceMotion } = useMotionPrefs();
  const nodeRef = useRef(null);
  const total = Number(value) || 0;

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    /* reduced-motion 或未开始：直接落终值 / 归零，全程无动画 */
    if (reduceMotion) {
      node.textContent = `${prefix}${total}${suffix}`;
      return undefined;
    }
    if (!start) {
      node.textContent = `${prefix}0${suffix}`;
      return undefined;
    }

    let raf = 0;
    let startAt = 0;
    let timer = 0;
    let cancelled = false;

    const tick = (now) => {
      if (cancelled) return;
      if (!startAt) startAt = now;
      const t = Math.min(1, (now - startAt) / duration);
      /* ease-out-expo：冲上来再稳住，比线性更有重量感 */
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      node.textContent = `${prefix}${Math.round(total * eased)}${suffix}`;
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };

    timer = window.setTimeout(() => {
      if (cancelled) return;
      raf = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [total, duration, delay, start, reduceMotion, prefix, suffix]);

  /* 首帧就渲染终值文本，避免 SSR/无 JS 时出现空白数字 */
  const initial = reduceMotion ? total : start ? total : 0;

  return (
    <span ref={nodeRef} className={`fx-num ${className}`}>
      {prefix}
      {initial}
      {suffix}
    </span>
  );
}
