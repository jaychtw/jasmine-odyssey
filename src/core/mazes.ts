import type { Maze, Point } from "./types";

// Fixed, hand-authored layouts. # = wall; S = entrance; H = home.
// The ASCII source is the canonical geometry, never generated at runtime.
const layout1 = `#################
###########....H#
###########.#####
#.....#####.....#
#.#########.###.#
#.###.......###.#
#.###.###.#####.#
#.....###.#####.#
#####.###.#######
#S....###.....###
###.#########.###
###.#########.###
#################`;

const layout2 = `#################
#S....###.....###
###.#.###.###.###
#...#.....###.#.#
#.###.#########.#
#.###.......###.#
#.#####.###.###.#
#.#####.###.....#
#######.###.#####
###.....###.....#
###.#########.#.#
###.#########.#H#
#################`;

const layout3 = `#################
###.......#####H#
###.#####.#####.#
###.#####.#.....#
###.#######.#.###
#.....#...#.#.###
#.###.#.###.#####
#...#.#.###.....#
#.###.#.###.###.#
#.###.......###.#
#.###.#########.#
#S#...#######...#
#################`;

const layout4 = `#################
#.....###...###H#
#.#######.#####.#
#.#.........###.#
#.#.###.###.###.#
#...###.###...#.#
###.###.###.###.#
###.....###.....#
###.###.#####.###
###.###...###.###
###.###.#####.###
#...###S###...###
#################`;

const layout5 = `#################
#####.......###.#
#####.#####.###.#
#####...###.....#
#####.#####.#####
#S....#...#.###H#
###.###.###.###.#
###.###.###.....#
###.###.###.###.#
###.....###.....#
###.#############
###.......#######
#################`;

const layout6 = `#################
#H..#...###.....#
###.###.###.###.#
###.###.......#.#
###.###.#####.#.#
#.......#.###...#
#.#######.###.###
#.###.#.......###
#.###.#.#########
#.....#.....###.#
#######.###.###.#
#######S###.....#
#################`;

const layout7 = `#################
#S#####.......###
#.###########.###
#.........###.#.#
#.###.###.###.#.#
#.###...#.....#.#
#.###.#.#.#####.#
#.....#.#.#.....#
###.#####.#.#####
###.###.#.......#
###.###.#####.#.#
###.....#####.#H#
#################`;

const layout8 = `#################
###.....###....H#
###.#######.#####
#.......###...#.#
#.#.###.###.###.#
#.#.###...#...#.#
#.#.###.###.#.#.#
#.....#.....#...#
#####.#######.###
#####.....###.###
#####.###.###.###
#S....###.....###
#################`;

const layout9 = `#################
#.....#H###.....#
#.###.#.###.###.#
#.###.#.......#.#
#.###########.###
#.#.....#...#...#
#.#.#.#.#.#.#.#.#
#...#.#.#.#.#.#.#
###.###.#.###.#.#
###...#.......#.#
###.###########.#
###....S###.....#
#################`;

const layout10 = `#################
###.....###...#H#
###.#######.#.#.#
#.#.#.....#.#.#.#
#.#.#.#.#.#.###.#
#...#.#.#...#...#
###.#.###.###.###
#.......#.#.#...#
#.#####.#.#.#.#.#
#...###.#.....#.#
#.#.###.#######.#
#S#.....#.......#
#################`;

function define(number: number, layout: string, design: string): Maze {
  const rows = layout.split("\n");
  let entrance: Point | undefined, home: Point | undefined;
  rows.forEach((row, y) =>
    [...row].forEach((cell, x) => {
      if (cell === "S") entrance = { x: x + 0.5, y: y + 0.5 };
      if (cell === "H") home = { x: x + 0.5, y: y + 0.5 };
    }),
  );
  if (!entrance || !home) throw new Error("Invalid maze endpoints");
  return Object.freeze({
    schemaVersion: 1,
    mazeId: `maze-${number}`,
    nameKey: `maze${number}`,
    gridWidth: rows[0].length,
    gridHeight: rows.length,
    cells: Object.freeze(rows.map((row) => row.replace(/[SH]/g, "."))),
    entrance: Object.freeze(entrance),
    home: Object.freeze(home),
    objects: Object.freeze([
      { id: "home", kind: "home" as const, position: Object.freeze(home) },
    ]),
    design,
  });
}
export const MAZES: readonly Maze[] = Object.freeze([
  define(
    1,
    layout1,
    "A gentle first fork. Short wrong turns establish dim path memory; a flash at the middle elbow reveals the next junction.",
  ),
  define(
    2,
    layout2,
    "Alternating side branches with a longer central passage. Light before committing to the southbound turn.",
  ),
  define(
    3,
    layout3,
    "Two nearby but separated vertical lanes; flashes show their relationship through the tree wall. Return bends reward remembering elbows.",
  ),
  define(
    4,
    layout4,
    "The first deliberate loop offers two valid approaches to a crossing. A flash at the center helps connect familiar passages.",
  ),
  define(
    5,
    layout5,
    "A homeward detour around the upper grove. Parallel near-home lanes make illumination useful; the lower loop provides a safe alternate return.",
  ),
  define(
    6,
    layout6,
    "A reverse-direction journey with an upper loop. Closely spaced junctions ask the player to choose when to use the lantern rather than follow a rhythm.",
  ),
  define(
    7,
    layout7,
    "One early loop and a chain of short tempting branches. Light at the eastern crossroads distinguishes a shallow pocket from the long exit lane.",
  ),
  define(
    8,
    layout8,
    "Two broad loops, distinct by size and orientation. A flash helps recognize which parallel lane the player has entered.",
  ),
  define(
    9,
    layout9,
    "A curved route around a central hollow. Adjacent separated passages make the circular flash informative without making the route complicated.",
  ),
  define(
    10,
    layout10,
    "A final synthesis of a loop, staggered crossroads, and parallel approach lanes. Frequent useful flash positions support confident, continuous movement.",
  ),
]);
