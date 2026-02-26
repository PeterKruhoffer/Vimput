import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";
import type { VimMode } from "./types";

const LEFT_MOTION = new Set(["h", "k"]);
const RIGHT_MOTION = new Set(["j", "l"]);
const WORD_CHAR_REGEX = /[A-Za-z0-9_]/;

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function isWordChar(character: string | undefined) {
	return character !== undefined && WORD_CHAR_REGEX.test(character);
}

function findNextWordStart(value: string, cursor: number) {
	let index = clamp(cursor, 0, value.length);

	while (index < value.length && isWordChar(value[index])) {
		index += 1;
	}

	while (index < value.length && !isWordChar(value[index])) {
		index += 1;
	}

	return index;
}

function findPreviousWordStart(value: string, cursor: number) {
	let index = clamp(cursor, 0, value.length);

	if (index === 0) {
		return 0;
	}

	index -= 1;

	while (index > 0 && !isWordChar(value[index])) {
		index -= 1;
	}

	while (index > 0 && isWordChar(value[index - 1])) {
		index -= 1;
	}

	return index;
}

function findWordEndForward(value: string, cursor: number) {
	let index = clamp(cursor, 0, value.length);

	if (index >= value.length) {
		return value.length;
	}

	if (isWordChar(value[index])) {
		while (index < value.length && isWordChar(value[index])) {
			index += 1;
		}

		return index;
	}

	while (index < value.length && !isWordChar(value[index])) {
		index += 1;
	}

	while (index < value.length && isWordChar(value[index])) {
		index += 1;
	}

	return index;
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

	const moveToNextWord = useCallback(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const nextCursor = findNextWordStart(input.value, cursor);

		input.setSelectionRange(nextCursor, nextCursor);
	}, []);

	const moveToPreviousWord = useCallback(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const previousCursor = findPreviousWordStart(input.value, cursor);

		input.setSelectionRange(previousCursor, previousCursor);
	}, []);

	const moveToWordEnd = useCallback(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const wordEndCursor = findWordEndForward(input.value, cursor);

		input.setSelectionRange(wordEndCursor, wordEndCursor);
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

			if (key === "w") {
				event.preventDefault();
				moveToNextWord();
				return;
			}

			if (key === "b") {
				event.preventDefault();
				moveToPreviousWord();
				return;
			}

			if (key === "e") {
				event.preventDefault();
				moveToWordEnd();
				return;
			}

			if (key.length === 1 || key === "backspace" || key === "delete") {
				event.preventDefault();
			}
		},
		[mode, moveCaretBy, moveToNextWord, moveToPreviousWord, moveToWordEnd],
	);

	return {
		inputRef,
		mode,
		onFocus,
		onKeyDown,
	};
}
