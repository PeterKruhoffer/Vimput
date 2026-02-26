import { describe, expect, it } from "vitest";
import {
  buildVisualCursorRows,
  findCursorOnAdjacentVisualRow,
} from "./useVimInput";

describe("visual cursor helpers", () => {
  it("moves to the closest horizontal position on the adjacent visual row", () => {
    const positions = [
      { top: 0, left: 0 },
      { top: 0, left: 12 },
      { top: 0, left: 24 },
      { top: 20, left: 0 },
      { top: 20, left: 12 },
      { top: 20, left: 24 },
      { top: 40, left: 0 },
      { top: 40, left: 12 },
    ];
    const rows = buildVisualCursorRows(positions);

    const down = findCursorOnAdjacentVisualRow(
      positions,
      rows,
      2,
      "down",
      positions[2]?.left ?? 0,
    );
    expect(down).toBe(5);

    const up = findCursorOnAdjacentVisualRow(
      positions,
      rows,
      5,
      "up",
      positions[5]?.left ?? 0,
    );
    expect(up).toBe(2);
  });

  it("clamps to the last available cursor when target row is shorter", () => {
    const positions = [
      { top: 0, left: 0 },
      { top: 0, left: 10 },
      { top: 0, left: 20 },
      { top: 20, left: 0 },
    ];
    const rows = buildVisualCursorRows(positions);

    const down = findCursorOnAdjacentVisualRow(
      positions,
      rows,
      2,
      "down",
      positions[2]?.left ?? 0,
    );
    expect(down).toBe(3);
  });

  it("returns the same cursor at top and bottom boundaries", () => {
    const positions = [
      { top: 0, left: 0 },
      { top: 0, left: 10 },
      { top: 20, left: 0 },
      { top: 20, left: 10 },
    ];
    const rows = buildVisualCursorRows(positions);

    const upAtTop = findCursorOnAdjacentVisualRow(positions, rows, 0, "up", 0);
    expect(upAtTop).toBe(0);

    const downAtBottom = findCursorOnAdjacentVisualRow(
      positions,
      rows,
      3,
      "down",
      10,
    );
    expect(downAtBottom).toBe(3);
  });
});
