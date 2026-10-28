import Home from "./pages/Home";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";
import InteractionLayer from "./components/fx/InteractionLayer";
import { usePerfGuard } from "./components/fx/useMotionPrefs";

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

  /* 首屏开场动画（IntroLoader）已移除：备案核查要求页面内容直接可读，
     不再有覆盖首屏的幕布/粒子动画。 */
  return (
    <div>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      {/* 全局交互增强（自定义光标 / 点击涟漪） */}
      <InteractionLayer />
      <Toaster />
    </div>
  );
}
