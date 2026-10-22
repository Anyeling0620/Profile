import { useEffect, useRef } from "react";
import { useMotionPrefs } from "./useMotionPrefs";

/**
 * TiltCard —— 鼠标位置驱动的 3D 倾斜 + 卡内边缘反光（模拟真实玻璃）。
 *
 * 实现要点：
 * - 位移/旋转**只写 CSS 变量与 transform**，全程 ref 操作，零 setState。
 * - 触屏 / 小于 768px / reduced-motion 自动不启用（探针查询监听变化）。
 * - 用 rAF 节流 pointermove，避免高频事件本身成为负担。
 * - 子元素可通过 `[transform:translateZ(30px)]` 获得纵深（preserve-3d 已设）。
 * - 不改变原有布局与文案：仅接管外层 div。
 */
export default function TiltCard({
  children,
  className = "",
  /** 最大旋转角度（度） */
  max = 7,
  /** 是否同时显示边缘反光 */
  spotlight = true,
  as: Tag = "div",
  ...rest
}) {
  const { allowPointerFX } = useMotionPrefs();
  const ref = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!allowPointerFX) {
      /* 关闭态：清掉可能残留的变换，保证退出动效后完全静态 */
      node.style.transform = "";
      node.classList.remove("fx-tilting", "fx-spot-on");
      return undefined;
    }

    const apply = () => {
      frameRef.current = 0;
      const el = ref.current;
      if (!el) return;
      const { x, y, active } = pointerRef.current;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      /* x/y 为相对元素左上角的百分比（0~1），转成 -1~1 的居中坐标 */
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;

      el.style.setProperty("--fx-mx", `${(px + 0.5) * 100}%`);
      el.style.setProperty("--fx-my", `${(py + 0.5) * 100}%`);

      if (!active) {
        el.style.transform = "";
        el.classList.remove("fx-tilting", "fx-spot-on");
        return;
      }
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translate3d(0, -2px, 0)`;
    };

    const schedule = () => {
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(apply);
    };

    const onPointerMove = (event) => {
      const rect = node.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
      node.classList.add("fx-tilting");
      if (spotlight) node.classList.add("fx-spot-on");
      schedule();
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
      schedule();
    };

    node.addEventListener("pointermove", onPointerMove, { passive: true });
    node.addEventListener("pointerleave", onPointerLeave, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerleave", onPointerLeave);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      node.style.transform = "";
      node.classList.remove("fx-tilting", "fx-spot-on");
    };
  }, [allowPointerFX, max, spotlight]);

  return (
    <Tag
      ref={ref}
      data-tilt=""
      data-spotlight={spotlight ? "" : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
