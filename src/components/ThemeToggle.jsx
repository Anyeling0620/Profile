import { useEffect } from "react";

/**
 * 全站唯一深色基调：不再提供浅色/深色切换。
 *
 * 保留组件名与默认导出，仅为兼容既有的 <ToggleTheme /> 引用点（pages/Home.jsx）。
 * 行为：确保 <html> 始终处于深色状态，并清理历史遗留的 "theme" 偏好，
 * 避免旧访客的 localStorage 把页面拉回浅色。渲染为空。
 */
export default function ThemeToggle() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.removeAttribute("data-theme");
    root.style.colorScheme = "dark";

    // 清除历史浅色偏好，防止回访时闪白
    try {
      if (localStorage.getItem("theme") !== "dark") {
        localStorage.setItem("theme", "dark");
      }
    } catch {
      /* 隐私模式下 localStorage 不可写，忽略 */
    }
  }, []);

  return null;
}
