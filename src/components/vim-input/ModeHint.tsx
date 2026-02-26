import type { VimMode } from "./types";

type ModeHintProps = {
	mode: VimMode;
};

export function ModeHint({ mode }: ModeHintProps) {
	if (mode === "insert") {
		return (
			<p className="text-xs text-zinc-300">Press Esc to enter normal mode.</p>
		);
	}

	return (
		<p className="text-xs text-zinc-300">
			Normal mode: use h/j/k/l to move or w/b to jump by word. Press i to return
			to insert mode.
		</p>
	);
}
