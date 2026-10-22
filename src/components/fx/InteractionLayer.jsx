import CursorFX from "./CursorFX";
import RippleFX from "./RippleFX";

/**
 * InteractionLayer —— 全局交互增强的统一挂载点。
 *
 * 目前包含：
 * - CursorFX：桌面端增强光标（小点 + 拖尾环 + 悬停变形）
 * - RippleFX：全站点击涟漪（事件委托，单监听器）
 *
 * 两者内部都按 useMotionPrefs 自行判断 reduced-motion / 触屏，
 * 条件不满足时直接不渲染或只返回 cleanup，因此这里无需再重复判断。
 * 本组件不产生任何 DOM 包裹层（两子组件都是 fixed 或 null），
 * 不会影响既有布局。
 */
export default function InteractionLayer() {
  return (
    <>
      <CursorFX />
      <RippleFX />
    </>
  );
}
