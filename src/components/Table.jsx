/**
 * Table Component — broadcast composition shell
 * ==============================================
 * Composes the WSOP-broadcast table from its orthogonal pieces:
 *   TableArena (dark stage + lighting + camera tilt)
 *     └─ TableSurface (speed-cloth felt, leather rail, betting line, center
 *                      board + pot chip-stack + dealer button + action ticker;
 *                      owns seat positioning around the oval)
 *          └─ PlayerPod[] (broadcast lower-third nameplate + hole cards per seat)
 *
 * The public props API is unchanged, so ScenarioPlay needs no changes. The hero
 * is reordered to the last seat (bottom-center). Dynamic pod states
 * (active/folded/all-in/bet/timer) default off here; ScenarioPlay can pass them
 * later for live broadcast states.
 *
 * @param {Object}  props
 * @param {Array}   props.players    - Player objects from the scenario
 * @param {number}  props.heroIndex  - Index of the hero (the "you" seat)
 * @param {Array}   props.board      - Board card strings currently dealt
 * @param {number}  props.pot        - Current pot size
 * @param {boolean} [props.revealAll=false] - Show all players' cards face-up
 * @param {string}  [props.venue]    - "wsop" | "tournament" | (default)
 * @param {string}  [props.latestAction] - Optional last-action text for the ticker
 */
import TableArena from './arena/TableArena.jsx';
import TableSurface from './table-surface/TableSurface.jsx';
import PlayerPod from './player-pod/PlayerPod.jsx';

/**
 * Reorder players so the hero is last (bottom-center). Each gets `originalIndex`.
 */
function reorderPlayers(players, heroIndex) {
  const n = players.length;
  const ordered = [];
  for (let i = 1; i <= n; i++) {
    const idx = (heroIndex + i) % n;
    ordered.push({ ...players[idx], originalIndex: idx });
  }
  return ordered; // hero is last
}

export default function Table({
  players,
  heroIndex,
  board = [],
  pot = 0,
  revealAll = false,
  venue,
  latestAction = null,
}) {
  const numPlayers = players.length;
  const orderedPlayers = reorderPlayers(players, heroIndex);

  return (
    <TableArena venue={venue}>
      <TableSurface
        board={board}
        pot={pot}
        numPlayers={numPlayers}
        venue={venue}
        latestAction={latestAction}
      >
        {orderedPlayers.map((player, seatIdx) => {
          const isHero = player.originalIndex === heroIndex;
          return (
            <PlayerPod
              key={seatIdx}
              player={player}
              seatIdx={seatIdx}
              isHero={isHero}
              holeCards={player.cards}
              revealCards={isHero || revealAll}
            />
          );
        })}
      </TableSurface>
    </TableArena>
  );
}
