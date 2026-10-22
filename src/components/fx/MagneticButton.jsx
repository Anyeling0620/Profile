import { useEffect, useRef } from "react";
import { useMotionPrefs } from "./useMotionPrefs";

/**
 * MagneticButton —— 鼠标靠近时元素朝光标轻微吸附，离开时弹回（弹簧感）。
 *
 * 做法：监听 window 的 pointermove（被动），只有指针进入元素外扩的感应圈
 * 才计算吸附位移；位移**直接写 transform**，不触发 React 重渲染。
 * 触屏 / <768px / reduced-motion 下完全不接线。
 *
 * 用法：<MagneticButton><a className="cosmic-button">…</a></MagneticButton>
 *      也可用 `as` 直接渲染元素：<MagneticButton as="a" href="#contact" …>
 */
export default function MagneticButton({
  children,
  as,
  className = "",
  /** 吸附强度：指针在感应圈边缘时最多位移多少像素 */
  strength = 10,
  /** 感应圈半径（相对元素对角线的倍数） */
  radiusFactor = 0.65,
  ...rest
}) {
  const { allowPointerFX } = useMotionPrefs();
  const ref = useRef(null);
  const frameRef = useRef(0);
  const stateRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!allowPointerFX) {
      node.style.transform = "";
      node.classList.remove("fx-magnet-on");
      return undefined;
    }

    const lerp = (from, to, ratio) => from + (to - from) * ratio;

    const tick = () => {
      const el = ref.current;
      if (!el) return;
      const s = stateRef.current;
      s.x = lerp(s.x, s.tx, 0.22);
      s.y = lerp(s.y, s.ty, 0.22);
      el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`;
      if (Math.abs(s.tx - s.x) > 0.08 || Math.abs(s.ty - s.y) > 0.08) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        frameRef.current = 0;
      }
    };

    const schedule = () => {
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(tick);
    };

    const onPointerMove = (event) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const reach = Math.hypot(rect.width, rect.height) * radiusFactor;
      const dist = Math.hypot(dx, dy);

      if (dist < reach) {
        /* 越靠近中心吸附越弱，边缘最强：避免按钮贴着光标跑掉 */
        const pull = (1 - dist / reach) * strength;
        const norm = dist || 1;
        stateRef.current.tx = (dx / norm) * pull;
        stateRef.current.ty = (dy / norm) * pull;
        el.classList.add("fx-magnet-on");
      } else {
        stateRef.current.tx = 0;
        stateRef.current.ty = 0;
        el.classList.remove("fx-magnet-on");
      }
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      node.style.transform = "";
      node.classList.remove("fx-magnet-on");
    };
  }, [allowPointerFX, strength, radiusFactor]);

  const shared = {
    ref,
    "data-magnetic": "",
    className,
    ...rest,
  };

  if (as === undefined) {
    /* 默认包一层容器，保持被包裹元素自身的语义与样式不变 */
    return (
      <span {...shared} style={{ display: "inline-block", ...(rest.style || {}) }}>
        {children}
      </span>
    );
  }

  const Tag = as;
  return <Tag {...shared}>{children}</Tag>;
}

