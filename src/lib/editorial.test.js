import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_INDEX_PAD,
  DEFAULT_MEASURE_CH,
  balanceColumns,
  estimateLines,
  formatIndex,
  indexSequence,
  measureDisplayWidth,
} from "./editorial.js";

test("常量与 src/index.css 的 --measure 刻度对齐", () => {
  assert.equal(DEFAULT_INDEX_PAD, 2);
  assert.equal(DEFAULT_MEASURE_CH, 62);
});

test("measureDisplayWidth: 空值与非字符串", () => {
  assert.equal(measureDisplayWidth(""), 0);
  assert.equal(measureDisplayWidth(null), 0);
  assert.equal(measureDisplayWidth(undefined), 0);
  assert.equal(measureDisplayWidth(42), 0);
});

test("measureDisplayWidth: ASCII 按 1 计", () => {
  assert.equal(measureDisplayWidth("abc"), 3);
  assert.equal(measureDisplayWidth("Hello, World!"), 13);
});

test("measureDisplayWidth: 汉字与全角标点按 2 计", () => {
  assert.equal(measureDisplayWidth("中文"), 4);
  // 你 好 ， 世 界 。 = 6 个字符，逗号与句号都是全角
  assert.equal(measureDisplayWidth("你好，世界。"), 12);
  // （ 全 角 括 号 ）= 6 个字符
  assert.equal(measureDisplayWidth("（全角括号）"), 12);
});

test("measureDisplayWidth: 中英混排逐字累加", () => {
  assert.equal(measureDisplayWidth("UI 设计师"), 2 + 1 + 2 + 4);
});

test("measureDisplayWidth: 中文省略号与破折号按宽字符计", () => {
  assert.equal(measureDisplayWidth("…"), 2);
  assert.equal(measureDisplayWidth("——"), 4);
});

test("measureDisplayWidth: 扩展 B 段汉字（surrogate pair）不被拆成两半", () => {
  // U+20000 是 CJK 扩展 B 的首字，UTF-16 下占两个码元
  assert.equal(measureDisplayWidth("\u{20000}"), 2);
});

test("measureDisplayWidth: 韩文与假名按宽字符计", () => {
  assert.equal(measureDisplayWidth("한국"), 4);
  assert.equal(measureDisplayWidth("カナ"), 4);
});

test("formatIndex: 默认两位补零", () => {
  assert.equal(formatIndex(1), "01");
  assert.equal(formatIndex(9), "09");
  assert.equal(formatIndex(10), "10");
  assert.equal(formatIndex(99), "99");
});

test("formatIndex: 超过 pad 位数时原样输出", () => {
  assert.equal(formatIndex(100), "100");
  assert.equal(formatIndex(1234, { pad: 3 }), "1234");
});

test("formatIndex: 自定义 pad 与 start-min", () => {
  assert.equal(formatIndex(7, { pad: 3 }), "007");
  assert.equal(formatIndex(0, { min: 0 }), "00");
});

test("formatIndex: 小数按截断处理（序号没有小数含义）", () => {
  assert.equal(formatIndex(2.9), "02");
});

test("formatIndex: 非法输入抛错", () => {
  assert.throws(() => formatIndex(0), RangeError);
  assert.throws(() => formatIndex(-1), RangeError);
  assert.throws(() => formatIndex("3"), TypeError);
  assert.throws(() => formatIndex(NaN), TypeError);
  assert.throws(() => formatIndex(Infinity), TypeError);
  assert.throws(() => formatIndex(1, { pad: 0 }), RangeError);
  assert.throws(() => formatIndex(1, { pad: 7 }), RangeError);
  assert.throws(() => formatIndex(1, { pad: 1.5 }), RangeError);
});

test("indexSequence: 默认从 01 开始", () => {
  assert.deepEqual(indexSequence(3), ["01", "02", "03"]);
  assert.deepEqual(indexSequence(0), []);
});

test("indexSequence: 支持自定义起点与位数", () => {
  assert.deepEqual(indexSequence(3, { start: 5 }), ["05", "06", "07"]);
  assert.deepEqual(indexSequence(2, { pad: 3 }), ["001", "002"]);
});

test("indexSequence: 超过 9 项不出现位数不一致", () => {
  const seq = indexSequence(12);
  assert.equal(seq[0], "01");
  assert.equal(seq[9], "10");
  assert.equal(seq[11], "12");
  // 所有项长度一致，等宽数字列不会抖动
  assert.equal(new Set(seq.map((s) => s.length)).size, 1);
});

test("indexSequence: 非法输入抛错", () => {
  assert.throws(() => indexSequence(-1), RangeError);
  assert.throws(() => indexSequence(1.5), RangeError);
  assert.throws(() => indexSequence(1, { start: 0 }), RangeError);
});

test("balanceColumns: 空数组返回空", () => {
  assert.deepEqual(balanceColumns([]), []);
});

test("balanceColumns: columns=1 时原样返回单栏", () => {
  assert.deepEqual(balanceColumns(["a", "b", "c"], { columns: 1 }), [["a", "b", "c"]]);
});

test("balanceColumns: 等长条目两栏均分", () => {
  const result = balanceColumns(["aaaa", "aaaa", "aaaa", "aaaa"], { columns: 2 });
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].concat(result[1]), ["aaaa", "aaaa", "aaaa", "aaaa"]);
});

test("balanceColumns: 保持原顺序，不重排", () => {
  const items = ["短", "很长很长很长的一段导语", "中", "很长很长很长的一段导语"];
  const result = balanceColumns(items, { columns: 2 });
  assert.deepEqual(result.flat(), items);
});

test("balanceColumns: 长条目优先落位，不被短条目挤到第三栏", () => {
  const items = [
    "这是一段非常长的中文导语文字内容",
    "短标签",
    "短标签",
    "短标签",
    "短标签",
  ];
  const result = balanceColumns(items, { columns: 2 });
  assert.ok(result.length <= 2, `应不超过 2 栏，实际 ${result.length}`);
  assert.ok(result[0].length >= 1);
});

test("balanceColumns: 中文按宽度而非个数计重", () => {
  // "中" 宽 2，"a" 宽 1；若按个数均分会把 2 个中文和 2 个英文分一起
  const result = balanceColumns(["中中中中", "aaaa", "中中中中", "aaaa"], { columns: 2 });
  assert.equal(result.length, 2);
  assert.equal(result.flat().length, 4);
});

test("balanceColumns: 自定义 weigh", () => {
  const items = [
    { id: 1, w: 1 },
    { id: 2, w: 9 },
    { id: 3, w: 1 },
  ];
  const result = balanceColumns(items, { columns: 2, weigh: (item) => item.w });
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].map((i) => i.id), [1, 2]);
});

test("balanceColumns: weigh 返回非法值时按 0 处理，不破坏分栏", () => {
  const items = ["a", "b", "c"];
  const result = balanceColumns(items, {
    columns: 2,
    weigh: (item) => (item === "b" ? -5 : NaN),
  });
  assert.deepEqual(result.flat(), ["a", "b", "c"]);
});

test("balanceColumns: 栏数不超过目标、条目一个不少", () => {
  const items = Array.from({ length: 10 }, (_, i) => `条目${i}`);
  const result = balanceColumns(items, { columns: 3 });
  assert.ok(result.length <= 3);
  assert.equal(result.flat().length, 10);
});

test("balanceColumns: 非法参数抛错", () => {
  assert.throws(() => balanceColumns(["a"], { columns: 0 }), RangeError);
  assert.throws(() => balanceColumns(["a"], { columns: 9 }), RangeError);
  assert.throws(() => balanceColumns("not-array"), TypeError);
});

test("estimateLines: 空文本 0 行", () => {
  assert.equal(estimateLines(""), 0);
  assert.equal(estimateLines(null), 0);
});

test("estimateLines: 短文本 1 行", () => {
  assert.equal(estimateLines("一句话"), 1);
});

test("estimateLines: 达 measure 上限仍算 1 行", () => {
  // 62 个半角单位正好一行；63 就折行
  assert.equal(estimateLines("a".repeat(62)), 1);
  assert.equal(estimateLines("a".repeat(63)), 2);
});

test("estimateLines: 中文按宽度翻倍", () => {
  // 62 个半角位 = 31 个汉字
  assert.equal(estimateLines("中".repeat(31)), 1);
  assert.equal(estimateLines("中".repeat(32)), 2);
});

test("estimateLines: 自定义 measureCh", () => {
  assert.equal(estimateLines("中".repeat(31), { measureCh: 30 }), 3);
});

test("estimateLines: 非法 measureCh 抛错", () => {
  assert.throws(() => estimateLines("a", { measureCh: 0 }), RangeError);
  assert.throws(() => estimateLines("a", { measureCh: -1 }), RangeError);
});
