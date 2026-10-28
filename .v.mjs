import pw from "/root/npm/scratch/node_modules/playwright/index.js";
const { chromium } = pw;
const browser = await chromium.launch();
async function c(label, opts = {}, reps=4) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  await page.goto("http://127.0.0.1:4180/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);
  const s = [];
  for (let i=0;i<reps;i++) s.push(await page.evaluate(async () => {
    const f=[]; let last=performance.now();
    await new Promise(res=>{let n=0;const t=(x)=>{f.push(x-last);last=x;n++;n<50?requestAnimationFrame(t):res();};requestAnimationFrame(t);});
    const d=f.slice(2).sort((a,b)=>a-b); return d[Math.floor(d.length*.5)]??0;
  }));
  const m = s.sort((a,b)=>a-b)[Math.floor(s.length/2)];
  const n = await page.evaluate(()=>document.getAnimations().length);
  await ctx.close();
  console.log(`${label.padEnd(26)} ${m.toFixed(0).padStart(4)}ms ≈${(1000/m).toFixed(1).padStart(5)}fps anims=${n} errors=${errs.length}`);
}
await c("桌面 1440x900");
await c("reduced-motion", { reducedMotion: "reduce" });
await c("移动端 390x844", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await browser.close();
