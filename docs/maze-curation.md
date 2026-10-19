# Maze curation notes

These are ten authored, fixed layouts. No geometry is generated at runtime. This document contains route spoilers; the player-facing selector never shows maps.

Coordinates use a top-left origin, x right, y down; row-major ASCII cells, one world unit per tile. Entrance/home coordinates point to cell centers. World objects are separate from collision geometry.

Normal sight has a 1.05-unit radius; flash sight has a 2-unit radius (five 0.8-unit character widths across), passes through walls, and sweeps with the player for one second. The five-second recharge starts at activation. At three world units per second, a moving flash can inspect the next bend as well as the current fork.

| Maze | Walkable tiles | Shortest path (steps) | Junctions | Dead ends | Independent loops |
| ---- | -------------: | --------------------: | --------: | --------: | ----------------: |
| 1    |             55 |                    22 |         4 |         6 |                 0 |
| 2    |             65 |                    24 |         5 |         7 |                 0 |
| 3    |             69 |                    32 |         6 |         8 |                 0 |
| 4    |             68 |                    26 |         8 |         8 |                 1 |
| 5    |             64 |                    26 |         6 |         6 |                 1 |
| 6    |             74 |                    32 |         6 |         6 |                 1 |
| 7    |             76 |                    24 |         7 |         7 |                 1 |
| 8    |             77 |                    32 |         7 |         6 |                 2 |
| 9    |             85 |                    38 |         6 |         8 |                 0 |
| 10   |             90 |                    36 |         8 |         8 |                 1 |

The compact scale is intentional: the shortest fully visible runs are about 7–13 seconds. Exploration, remembering forks, and choosing flashes supply the extra challenge. Alternate routes are valid; none is blocked by an ability or item.

## Design intentions

1. A gentle first fork. Short wrong turns establish dim path memory; a flash at the middle elbow reveals the next junction.
2. Alternating side branches with a longer central passage. Light before committing to the southbound turn.
3. Two nearby but separated vertical lanes; flashes show their relationship through the tree wall. Return bends reward remembering elbows.
4. The first deliberate loop offers two valid approaches to a crossing. A flash at the center helps connect familiar passages.
5. A homeward detour around the upper grove. Parallel near-home lanes make illumination useful; the lower loop provides a safe alternate return.
6. A reverse-direction journey with an upper loop. Closely spaced junctions ask the player to choose when to use the lantern rather than follow a rhythm.
7. One early loop and a chain of short tempting branches. Light at the eastern crossroads distinguishes a shallow pocket from the long exit lane.
8. Two broad loops, distinct by size and orientation. A flash helps recognize which parallel lane the player has entered.
9. A curved route around a central hollow. Adjacent separated passages make the circular flash informative without making the route complicated.
10. A final synthesis of a loop, staggered crossroads, and parallel approach lanes. Frequent useful flash positions support confident, continuous movement.

## Review and limits

All walkable cells are connected. Each maze is exercised through the real continuous collision engine without lantern use, and every floor-to-wall/floor edge is checked. Browser tests traverse all ten with actual held keys. The annotated [contact sheet](maze-review.svg) is a design-review artifact only.

Geometry and branch placement have been reviewed against the lantern radius and sight limits. Broader subjective enjoyment, child/family playtesting, and balancing with first-time players remain human validation tasks; automated route traversal cannot establish them.
