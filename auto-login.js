const { chromium } = require('playwright');

(async () => {
  // 启动无头浏览器，提升效率（可设 headless: false 来调试）
  const browser = await chromium.launch({ headless: true });

  const usernames = process.env.USERNAMES?.split(',') || [];
  const passwords = process.env.PASSWORDS?.split(',') || [];

  if (usernames.length !== passwords.length || usernames.length === 0) {
    console.error('❌ 用户名和密码数量不一致，或未设置环境变量 USERNAMES / PASSWORDS');
    process.exit(1);
  }

  for (let i = 0; i < usernames.length; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const username = usernames[i].trim();
    const password = passwords[i].trim();

    try {
      console.log(`🚀 正在登录用户：${username}`);

      await page.goto('https://webhostmost.com/login', { timeout: 60000, waitUntil: 'domcontentloaded' });

      await page.fill('input[name="username"]', username);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      // 等待登录成功跳转，最多 60 秒
      await page.waitForURL('**/clientarea.php', { timeout: 60000 });

      console.log(`✅ 用户 ${username} 登录成功！`);

      // 推送成功通知
      await fetchPush(`✅ 用户 ${username} 登录成功！`);

    } catch (error) {
      console.error(`❌ 用户 ${username} 登录失败：`, error.message);

      // 推送失败通知
      await fetchPush(`❌ 用户 ${username} 登录失败：${error.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
})();

// 推送函数
async function fetchPush(msg) {
  try {
    const url = `https://php.hipjs.cloudns.org/api/wxpush.php?txt1=${encodeURIComponent(msg)}`;
    const res = await fetch(url);
    if (!res.ok) console.error('⚠️ 推送失败，响应码:', res.status);
  } catch (err) {
    console.error('⚠️ 推送请求异常：', err.message);
  }
}
