/**
 * TableArena — broadcast stage wrapper
 *
 * Props
 *   children  — the poker table (or any content) to display centered on stage
 *   venue     — optional string: "wsop" | "tournament" | "default" (default)
 *               Tints the ambient backdrop slightly without touching the table itself.
 *
 * Purely presentational: provides dark stage shell + perspective camera angle.
 * No assumptions about children internals.
 */

import './TableArena.css';

const VENUE_CLASSES = {
  wsop:       'arena--wsop',
  tournament: 'arena--tournament',
};

export default function TableArena({ children, venue = 'default' }) {
  const venueClass = VENUE_CLASSES[venue] ?? '';

  return (
    /* Stage shell — full-bleed dark surround + vignette */
    <div className={`arena-stage ${venueClass}`} aria-label="Poker table arena">

      {/* Overhead spotlight beam — conic/radial gradient pseudo-layer */}
      <div className="arena-spotlight" aria-hidden="true" />

      {/* Haze layer — very faint diffuse bloom around the beam */}
      <div className="arena-haze" aria-hidden="true" />

      {/* Perspective holder — supplies the top-down camera tilt */}
      <div className="arena-perspective">

        {/* Tilt slab — rotateX gives the broadcast "looking down" angle */}
        <div className="arena-tilt">
          {children}
        </div>

      </div>
    </div>
  );
}
