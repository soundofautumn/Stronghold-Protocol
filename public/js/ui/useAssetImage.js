import { useEffect, useState } from '../../vendor/hooks.module.js';
import { artTransport, subscribeArtRecovery } from '../resourceNetwork.js';

/** Keep the existing glyph fallback while a failed DOM image recovers. No updates after unmount/source change. */
export function useAssetImage(source) {
  const [failed, setFailed] = useState(null);
  const [recovered, setRecovered] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!source || failed !== source || recovered?.source === source) return undefined;
    return subscribeArtRecovery(() => setRevision((n) => n + 1));
  }, [source, failed, recovered]);
  useEffect(() => {
    if (!source || failed !== source) return undefined;
    let disposed = false;
    let temporary;
    artTransport.blob(source).then((blob) => {
      if (disposed) return;
      temporary = URL.createObjectURL(blob);
      setRecovered({ source, url: temporary });
    }, () => {}); // Keep the fallback. A later online/visible event can try again.
    return () => {
      disposed = true;
      if (temporary) URL.revokeObjectURL(temporary);
    };
  }, [source, failed, revision]);
  return {
    src: assetImageSrc(source, failed, recovered),
    onError: () => { setRecovered(null); setFailed(source); },
  };
}

/**
 * The `src` of one render step: the recovered object URL, `null` once this source failed, else the source itself.
 *
 * `recovered` must be tested as an object, not with optional chaining: an absent `source` (an `<AvatarFrame/>`
 * without `src`, a chip whose manifest entry is missing) is `undefined`, and `recovered?.source === source` compares
 * undefined to undefined, reads `recovered.url` on null and takes the whole screen down (weak-network update regression).
 *
 * @param {string|null|undefined} source
 * @param {string|null} failed the source whose `<img>` failed, if any
 * @param {{ source: string, url: string }|null} recovered the blob URL recovered for a failed source, if any
 * @returns {string|null|undefined}
 */
export function assetImageSrc(source, failed, recovered) {
  if (recovered && recovered.source === source) return recovered.url;
  return failed === source ? null : source;
}
