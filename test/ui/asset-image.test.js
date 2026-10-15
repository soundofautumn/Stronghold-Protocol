// 回归：图片源缺失时不能崩（`<AvatarFrame/>` 不给 `src`、清单里没有的 chip 图标）。
// 弱网更新（xinhai 6e4acd38）里的 `recovered?.source === source` 在 source 为 undefined 时把 undefined 和
// undefined 判等，随后读 `recovered.url`（null）→ 整个界面报“界面发生错误”。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assetImageSrc } from '../../public/js/ui/useAssetImage.js';

test('缺少图片源时原样返回，不去读空的恢复对象', () => {
  // 钩子的初始 failed 是 null（不会等于 undefined 的 source），所以缺失源一律原样返回
  assert.equal(assetImageSrc(undefined, null, null), undefined);
  assert.equal(assetImageSrc(null, null, null), null);
  // 即使已有一个恢复对象，也不该套用到另一个源上
  assert.equal(assetImageSrc(undefined, null, { source: '/assets/b.png', url: 'blob:y' }), undefined);
  // 任何组合都不允许抛错（这正是线上崩溃的形态）
  for (const [source, failed] of [[undefined, null], [undefined, undefined], [null, undefined], ['/a.png', null]]) {
    assert.doesNotThrow(() => assetImageSrc(source, failed, null), `source=${source} failed=${failed}`);
  }
});

test('正常三步：源本身 → 失败后为 null → 恢复出 blob URL', () => {
  assert.equal(assetImageSrc('/assets/a.png', null, null), '/assets/a.png');
  assert.equal(assetImageSrc('/assets/a.png', '/assets/a.png', null), null);
  assert.equal(assetImageSrc('/assets/a.png', '/assets/a.png', { source: '/assets/a.png', url: 'blob:x' }), 'blob:x');
  // 过期的恢复对象（源已经变了）不能顶替当前源
  assert.equal(assetImageSrc('/assets/a.png', null, { source: '/assets/b.png', url: 'blob:y' }), '/assets/a.png');
});
