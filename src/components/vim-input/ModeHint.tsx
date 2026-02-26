import type { VimMode } from "./types";

type ModeHintProps = {
  mode: VimMode;
};

export function ModeHint({ mode }: ModeHintProps) {
  if (mode === "insert") {
    return (
      <p className="text-sm text-zinc-200">Press Esc to enter normal mode.</p>
    );
  }

  if (mode === "visual-line") {
    return (
      <p className="text-sm text-zinc-200">
        Visual line mode: Shift+J/Shift+K move selected lines down/up. Use h, j,
        k, and l to adjust the selection by one character. Press Esc to return
        to normal mode.
      </p>
    );
  }

  return (
    <p className="text-sm text-zinc-200">
      Normal mode: use h/l to move, j/k to move vertically in multiline, w/b to
      jump by word, and e to jump to word end. Press Shift+V for visual line
      mode. Delete with dw, db, diw, and ciw. Press i or a to return to insert
      mode.
    </p>
  );
}
