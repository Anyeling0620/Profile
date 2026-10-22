import { useEffect } from "react";
import { useMotionPrefs } from "./useMotionPrefs";

/**
 * RippleFX —— 全站点击涟漪（事件委托，单个监听器覆盖所有可点元素）。
 *
 * 实现：
 * - 在 document 上挂一个 passul pointerdown，命中 `[data-fx-ripple]` 祖先才生效。
 * - 涟漪元素在 620ms 动画结束后**自行移除**，不留 DOM 垃圾。
 * - 只在 pointerType === "mouse" 或触屏上都可用，但 reduced-motion 时完全不接线。
 * - 不拦截事件、不影响点击行为（pointer-events:none）。
 */
const HOST_SELECTOR = "[data-fx-ripple]";
const RIPPLE_TTL = 640;

export default function RippleFX() {
  const { reduceMotion } = useMotionPrefs();

  useEffect(() => {
    if (reduceMotion) return undefined;

    const timers = new Set();

    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const host = target.closest(HOST_SELECTOR);
      if (!host) return;

      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const size = Math.max(rect.width, rect.height);
      const dot = document.createElement("span");
      dot.className = "fx-ripple-dot";
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${event.clientX - rect.left - size / 2}px`;
      dot.style.top = `${event.clientY - rect.top - size / 2}px`;

      /* 宿主必须有定位上下文；模板里已用 fx-ripple-host，这里兜底 */
      if (getComputedStyle(host).position === "static") {
        host.style.position = "relative";
      }
      host.appendChild(dot);

      const timer = window.setTimeout(() => {
        dot.remove();
        timers.delete(timer);
      }, RIPPLE_TTL);
      timers.add(timer);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
    };
  }, [reduceMotion]);

  return null;
}
