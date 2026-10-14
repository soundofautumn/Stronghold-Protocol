// The online-count pill opens the online player list (public /api/online, docs/CUSTOM_API.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the online-count pill opens a modal list of the online nicknames', async () => {
  const [src, css] = await Promise.all([
    readFile(new URL('../../public/js/ui/components.js', import.meta.url), 'utf8'),
    readFile(new URL('../../public/css/components.css', import.meta.url), 'utf8'),
  ]);
  assert.match(src, /export function OnlineCount\(\{ online, class: cls \}\)/);
  assert.match(src, /online-count--btn/);
  // The pill stays a stateless component: the list lives in a store and a host mounted once by UiHosts, so the
  // topbar tests can keep walking the pill's vnode (test/announcements.test.js).
  assert.match(src, /export const onlineListUi = createStore\(\{ open: false, run: 0 \}\)/);
  assert.match(src, /export function OnlineListHost\(\)/);
  assert.match(src, /<\$\{OnlineListHost\} \/>/);
  assert.match(src, /doFetch\('\/api\/online'/);
  assert.match(src, /t\('在线玩家'\)/);
  assert.match(src, /players\.map\(/);
  assert.match(src, /t\('暂无在线玩家。'\)/);
  assert.match(css, /\.online-count--btn/);
  assert.match(css, /\.online-list__item/);
});

test('every language pack carries the online list strings', async () => {
  for (const lang of ['en', 'ja', 'ko', 'zh-TW']) {
    const pack = JSON.parse(await readFile(new URL(`../../public/i18n/${lang}.json`, import.meta.url), 'utf8'));
    for (const key of ['在线玩家', '共 {n} 人', '读取中…', '暂无在线玩家。', '读取失败，请稍后重试。']) {
      assert.ok(pack[key], `${lang} is missing ${key}`);
    }
  }
});
