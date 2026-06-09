/**
 * PlayerAvatar
 * ============
 * Renders the "face" of a player seat in three tiers:
 *
 *   Pro seat  (isPro + avatarId) — gold-ring medallion with monogram fallback,
 *             PRO badge, country flag emoji, style descriptor from `behaviour`,
 *             and an era/event sub-label from `era`.
 *             If /avatars/<avatarId>.webp exists at runtime the <img> loads it;
 *             on error it falls back to the generated monogram gracefully.
 *
 *   Hero seat (isHero)           — "YOU" treatment, gold seat shimmer, no portrait.
 *
 *   Regular   (default)          — compact initials chip, understated styling.
 *
 * Motion: GPU-only (transform + opacity). Respects prefers-reduced-motion.
 * Accessibility: real text for name/descriptor; aria-label on the medallion.
 *
 * @param {Object}  props
 * @param {string}  props.name          - Player's display name
 * @param {string}  [props.avatarId]    - Asset slug, e.g. "doyle-brunson"
 * @param {boolean} [props.isPro]       - Pro player flag
 * @param {string}  [props.country]     - ISO country code or flag emoji, e.g. "US" or "🇺🇸"
 * @param {string}  [props.behaviour]   - Style descriptor string, e.g. "Tight-aggressive"
 * @param {string}  [props.era]         - Era / event sub-label, e.g. "2003 WSOP Main Event"
 * @param {boolean} [props.isHero]      - Whether this is the user's own seat
 */
import { useState } from 'react';
import './PlayerAvatar.css';

/* ── helpers ─────────────────────────────────────────────────────────── */

/** Extract up to two initials from a display name ("Phil Ivey" → "PI"). */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? '??').toUpperCase();
}

/**
 * Map an ISO country code (or already-emoji flag) to a flag emoji.
 * Falls back silently if the code is unrecognised or already an emoji.
 */
function toFlagEmoji(country = '') {
  const trimmed = country.trim();
  // Already looks like an emoji flag (starts with a regional indicator)
  if (/^\p{Regional_Indicator}/u.test(trimmed)) return trimmed;
  // ISO 3166-1 alpha-2 → regional indicator pair
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const base = 0x1f1e6 - 0x41; // regional indicator A offset
    return [...trimmed.toUpperCase()]
      .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
      .join('');
  }
  return '';
}

/* ── sub-components ──────────────────────────────────────────────────── */

/** Monogram disk — the generated-portrait fallback inside the medallion. */
function MonogramDisk({ initials, name }) {
  return (
    <div className="pa-disk" aria-hidden="true">
      {/* Tasteful dark-gradient background with subtle angular highlight */}
      <span className="pa-disk__initials">{initials}</span>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────── */

export default function PlayerAvatar({
  name,
  avatarId,
  isPro = false,
  country,
  behaviour,
  era,
  isHero = false,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(name);
  const flagEmoji = country ? toFlagEmoji(country) : '';

  /* ── Hero seat ──────────────────────────────────────────────────────── */
  if (isHero) {
    return (
      <div className="pa pa--hero" aria-label="Your seat">
        <div className="pa-hero__ring" aria-hidden="true">
          <span className="pa-hero__you">YOU</span>
        </div>
      </div>
    );
  }

  /* ── Pro seat ───────────────────────────────────────────────────────── */
  if (isPro) {
    const hasAsset = avatarId && !imgFailed;
    const imgSrc = `/avatars/${avatarId}.webp`;

    return (
      <div
        className="pa pa--pro"
        aria-label={`${name}${behaviour ? `, ${behaviour}` : ''}${flagEmoji ? ` (${country})` : ''}`}
      >
        {/* Gold medallion ring */}
        <div className="pa-medallion" aria-hidden="true">
          {hasAsset ? (
            <img
              src={imgSrc}
              alt={name}
              className="pa-medallion__portrait"
              onError={() => setImgFailed(true)}
              draggable={false}
            />
          ) : (
            <MonogramDisk initials={initials} name={name} />
          )}
          {/* Sheen sweep overlay — purely decorative */}
          <div className="pa-medallion__sheen" aria-hidden="true" />
        </div>

        {/* PRO badge */}
        <div className="pa-pro-badge" aria-label="Pro player">PRO</div>

        {/* Country flag */}
        {flagEmoji && (
          <span
            className="pa-flag"
            aria-label={country}
            role="img"
          >
            {flagEmoji}
          </span>
        )}

        {/* Name */}
        <span className="pa-name pa-name--pro">{name}</span>

        {/* Style descriptor (behaviour pass-through) */}
        {behaviour && (
          <span className="pa-descriptor" aria-label={`Playing style: ${behaviour}`}>
            {behaviour}
          </span>
        )}

        {/* Era / event sub-label */}
        {era && (
          <span className="pa-era" aria-label={`Era: ${era}`}>
            {era}
          </span>
        )}
      </div>
    );
  }

  /* ── Regular opponent ───────────────────────────────────────────────── */
  return (
    <div className="pa pa--regular" aria-label={name}>
      <div className="pa-initials-chip" aria-hidden="true">
        {initials}
      </div>
    </div>
  );
}
