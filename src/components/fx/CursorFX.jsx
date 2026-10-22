import { useEffect, useRef } from "react";
import { useMotionPrefs } from "./useMotionPrefs";

/**
 * CursorFX —— 桌面端增强光标：实心小点即时跟随 + 拖尾圆环缓动跟随。
 *
 * 悬停到可交互元素（a / button / [role=button] / input / textarea / label）
 * 时圆环放大并变形成圆角矩形；按下时收缩。
 *
 * 实现约束：
 * - 两个元素都是 fixed + pointer-events-none，绝不抢事件。
 * - rAF 里只写 transform，零 setState。
 * - document.hidden 时暂停 rAF。
 * - 触屏 / <768px / reduced-motion 完全不渲染（也不接线）。
 * - 系统光标保持可见（不设 cursor:none），避免用户失去定位感与可用性损失。
 */
export default function CursorFX() {
  const { allowPointerFX } = useMotionPrefs();
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!allowPointerFX) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    let raf = 0;
    let visible = document.visibilityState !== "hidden";
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const trail = { x: pointer.x, y: pointer.y };
    let hasPointer = false;

    const render = () => {
      raf = 0;
      trail.x += (pointer.x - trail.x) * 0.18;
      trail.y += (pointer.y - trail.y) * 0.18;

      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      ring.style.transform = `translate3d(${trail.x.toFixed(2)}px, ${trail.y.toFixed(2)}px, 0)`;

      if (Math.abs(pointer.x - trail.x) > 0.2 || Math.abs(pointer.y - trail.y) > 0.2) {
        raf = window.requestAnimationFrame(render);
      }
    };

    const schedule = () => {
      if (!raf && visible) raf = window.requestAnimationFrame(render);
    };

    const onMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!hasPointer) {
        hasPointer = true;
        trail.x = pointer.x;
        trail.y = pointer.y;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      schedule();
    };

    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label';

    const onOver = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(INTERACTIVE)) ring.classList.add("is-interactive");
    };
    const onOut = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(INTERACTIVE)) ring.classList.remove("is-interactive");
    };
    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");

    const onLeaveWindow = () => {
      hasPointer = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      ring.classList.remove("is-interactive", "is-down");
    };

    const onVisibility = () => {
      visible = document.visibilityState !== "hidden";
      if (!visible && raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeaveWindow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeaveWindow);
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [allowPointerFX]);

  if (!allowPointerFX) return null;

  return (
    <>
      <div ref={dotRef} aria-hidden="true" className="fx-cursor-dot" style={{ opacity: 0 }} />
      <div ref={ringRef} aria-hidden="true" className="fx-cursor-ring" style={{ opacity: 0 }} />
    </>
  );
}
