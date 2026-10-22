/**
 * splitWords —— 把一段纯文本拆成逐词 span，供错峰上浮使用。
 *
 * ⚠️ 关键限制（踩过两次的坑）：**不要**把它用在 `aurora-text` 上。
 * aurora-text 依赖 background-clip:text，任何子元素带 opacity/transform 动画
 * 都会切断渐变绘制，导致文字整块消失。渐变标题请用外层容器动画
 * （见 HeroSection 的 h1：整块 tilt-in + 父层 clip 揭示）。
 *
 * 这里只处理「普通实色文字 + 拉丁词」；中文整句不拆，避免断词。
 */
export default function SplitText({
  text,
  step = 55,
  delay = 0,
  className = "",
  wordClassName = "",
}) {
  /* 只按空白切分；中文句子没有空格，会保持整体不拆。
     序号用「前面有多少个非空白词」推算，避免在渲染期改变量。 */
  const words = text.split(/(\s+)/);

  return (
    <span className={className}>
      {words.map((word, i) => {
        if (!word.trim()) return <span key={`s-${i}`}>{word}</span>;
        const wordIndex = words.slice(0, i).filter((w) => w.trim()).length;
        return (
          <span
            key={`w-${i}`}
            className={`fx-word ${wordClassName}`}
            style={{ "--fx-delay": `${delay + wordIndex * step}ms` }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}
