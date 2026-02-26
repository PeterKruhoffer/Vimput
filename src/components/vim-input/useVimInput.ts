import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";
import type { VimMode } from "./types";

const LEFT_MOTION = new Set(["h", "k"]);
const RIGHT_MOTION = new Set(["j", "l"]);

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function useVimInput() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [mode, setMode] = useState<VimMode>("normal");

	const moveCaretBy = useCallback((delta: number) => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const nextCursor = clamp(cursor + delta, 0, input.value.length);

		input.setSelectionRange(nextCursor, nextCursor);
	}, []);

	const onFocus = useCallback(() => {
		const input = inputRef.current;

		if (input?.value.length === 0) {
			setMode("insert");
		}
	}, []);

	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			const key = event.key.toLowerCase();

			if (mode === "insert") {
				if (key === "escape") {
					event.preventDefault();
					setMode("normal");
				}

				return;
			}

			if (key === "i") {
				event.preventDefault();
				setMode("insert");
				return;
			}

			if (LEFT_MOTION.has(key)) {
				event.preventDefault();
				moveCaretBy(-1);
				return;
			}

			if (RIGHT_MOTION.has(key)) {
				event.preventDefault();
				moveCaretBy(1);
				return;
			}

			if (key.length === 1 || key === "backspace" || key === "delete") {
				event.preventDefault();
			}
		},
		[mode, moveCaretBy],
	);

	return {
		inputRef,
		mode,
		onFocus,
		onKeyDown,
	};
}
