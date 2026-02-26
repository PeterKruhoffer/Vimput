import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";
import type { VimMode } from "./types";

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

const LEFT_MOTION = new Set(["h"]);
const RIGHT_MOTION = new Set(["l"]);
const UP_MOTION = "k";
const DOWN_MOTION = "j";
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

function findLineStart(value: string, cursor: number) {
	const clampedCursor = clamp(cursor, 0, value.length);

	if (clampedCursor === 0) {
		return 0;
	}

	return value.lastIndexOf("\n", clampedCursor - 1) + 1;
}

function findLineEnd(value: string, lineStart: number) {
	const endIndex = value.indexOf("\n", lineStart);
	return endIndex === -1 ? value.length : endIndex;
}

function findPreviousLineCursor(value: string, cursor: number) {
	const currentLineStart = findLineStart(value, cursor);

	if (currentLineStart === 0) {
		return cursor;
	}

	const previousLineEnd = currentLineStart - 1;
	const previousLineStart =
		previousLineEnd === 0
			? 0
			: value.lastIndexOf("\n", previousLineEnd - 1) + 1;

	const column = cursor - currentLineStart;
	const previousLineLength = previousLineEnd - previousLineStart;

	return previousLineStart + Math.min(column, previousLineLength);
}

function findNextLineCursor(value: string, cursor: number) {
	const currentLineStart = findLineStart(value, cursor);
	const currentLineEnd = findLineEnd(value, currentLineStart);

	if (currentLineEnd >= value.length) {
		return cursor;
	}

	const nextLineStart = currentLineEnd + 1;
	const nextLineEnd = findLineEnd(value, nextLineStart);
	const column = cursor - currentLineStart;
	const nextLineLength = nextLineEnd - nextLineStart;

	return nextLineStart + Math.min(column, nextLineLength);
}

function isTextArea(input: TextInputElement) {
	return input instanceof HTMLTextAreaElement;
}

export function useVimInput<
	TElement extends TextInputElement = HTMLInputElement,
>() {
	const inputRef = useRef<TElement | null>(null);
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

	const moveCaretVertically = useCallback((direction: "up" | "down") => {
		const input = inputRef.current;

		if (!input || !isTextArea(input)) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const nextCursor =
			direction === "up"
				? findPreviousLineCursor(input.value, cursor)
				: findNextLineCursor(input.value, cursor);

		input.setSelectionRange(nextCursor, nextCursor);
	}, []);

	const onFocus = useCallback(() => {
		const input = inputRef.current;

		if (input?.value.length === 0) {
			setMode("insert");
		}
	}, []);

	const onKeyDown = useCallback(
		(event: KeyboardEvent<TElement>) => {
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

			if (key === UP_MOTION) {
				event.preventDefault();

				if (inputRef.current && isTextArea(inputRef.current)) {
					moveCaretVertically("up");
				} else {
					moveCaretBy(-1);
				}

				return;
			}

			if (key === DOWN_MOTION) {
				event.preventDefault();

				if (inputRef.current && isTextArea(inputRef.current)) {
					moveCaretVertically("down");
				} else {
					moveCaretBy(1);
				}

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
		[
			mode,
			moveCaretBy,
			moveCaretVertically,
			moveToNextWord,
			moveToPreviousWord,
			moveToWordEnd,
		],
	);

	return {
		inputRef,
		mode,
		onFocus,
		onKeyDown,
	};
}
