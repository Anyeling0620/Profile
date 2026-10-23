import { useEffect, useState } from "react";
import Home from "./pages/Home";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";
import InteractionLayer from "./components/fx/InteractionLayer";
import { useMotionPrefs, usePerfGuard } from "./components/fx/useMotionPrefs";
import IntroLoader from "./components/intro/IntroLoader";

/**
 * 路由切换时给页面一层「遮罩擦除」式进场：
 * - key={location.pathname} 强制重挂载，动画才会重播；
 * - 只动 clip-path / opacity / transform，不碰布局属性；
 * - reduced-motion 下由 fx.css 的守卫直接落终态（无 running animation）。
 */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="fx-page-enter">
      <Routes location={location}>
        <Route index element={<Home />}></Route>
        <Route path="*" element={<NotFound />}></Route>
      </Routes>
    </div>
  );
}

export default function App() {
  /* 运行 3 秒后若平均帧率过低，自动切 data-perf="low" 降级装饰性效果。
     判定保守（<26fps 才降级），正常设备不会触发。 */
  usePerfGuard();

  const { reduceMotion } = useMotionPrefs();

  /**
   * 首屏开场动画：只在「首次进入」这一层出现一次。
   *
   * 放在 App 层而不是路由内部，是为了：
   *  - 路由切换（首页 ↔ 404）不会重播开场；
   *  - 开场期间首页已经在下面挂好，幕布一揭开就是成品，不会二次跳动。
   * 用 state 而非 localStorage：这是每次访问的「开场仪式」，
   * 但同一次会话里前进后退不会再放。
   */
  const [introDone, setIntroDone] = useState(false);

  /* 开场结束后把焦点交还页面，避免键盘用户被困在已卸载的按钮上 */
  useEffect(() => {
    if (!introDone) return;
    const main = document.querySelector("main");
    if (main && typeof main.focus === "function") {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }, [introDone]);

  return (
    <div>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      {/* 全局交互增强（自定义光标 / 点击涟漪） */}
      <InteractionLayer />
      <Toaster />

      {!introDone && (
        <IntroLoader
          /* 1800ms 主体 + 520ms 幕布上移 ≈ 2.3 秒整体体感，
             与「约 2.2 秒」的目标一致（幕布与主体末段重叠，不额外加时）。 */
          duration={1800}
          reduced={reduceMotion}
          onFinish={() => setIntroDone(true)}
        />
      )}
    </div>
  );
}
