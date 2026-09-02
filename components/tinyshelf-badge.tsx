/**
 * "Featured on tinyshelf" badge. Plain <a> and <img> on purpose: next/link
 * adds nothing for an external link, and next/image would need remotePatterns
 * and proxy a small SVG through this site for nothing. The tinyshelf checker
 * needs the anchor server-rendered, pointing at the landing page, with no
 * rel="nofollow"/"sponsored"/"ugc" — keep it that way.
 */
export function TinyshelfBadge() {
  return (
    <a href="https://www.tinyshelf.co/?ref=seocheckup.shrix1.com" title="Featured on tinyshelf">
      {/* eslint-disable-next-line @next/next/no-img-element -- see note above */}
      <img src="https://www.tinyshelf.co/badge/tinyshelf-badge-dark-f4d1216a.svg"
           alt="Featured on tinyshelf" width={216} height={64} />
    </a>
  );
}
