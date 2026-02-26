import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";
import type { VimMode } from "./types";

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;
type VerticalDirection = "up" | "down";
type VisualCursorPosition = {
	top: number;
	left: number;
};
type VisualCursorRow = {
	start: number;
	end: number;
};
type VisualCursorLayout = {
	positions: VisualCursorPosition[];
	rows: VisualCursorRow[];
	lineHeight: number;
};

const LEFT_MOTION = new Set(["h"]);
const RIGHT_MOTION = new Set(["l"]);
const UP_MOTION = "k";
const DOWN_MOTION = "j";
const WORD_CHAR_REGEX = /[A-Za-z0-9_]/;
const VISUAL_LAYOUT_MAX_LENGTH = 4000;

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

function countLinesBeforeCursor(value: string, cursor: number) {
	let lineCount = 0;
	const clampedCursor = clamp(cursor, 0, value.length);

	for (let index = 0; index < clampedCursor; index += 1) {
		if (value[index] === "\n") {
			lineCount += 1;
		}
	}

	return lineCount;
}

function resolveLineHeight(input: HTMLTextAreaElement) {
	const computedStyle = window.getComputedStyle(input);
	const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);

	if (Number.isFinite(parsedLineHeight)) {
		return parsedLineHeight;
	}

	const parsedFontSize = Number.parseFloat(computedStyle.fontSize);
	return Number.isFinite(parsedFontSize) ? parsedFontSize * 1.2 : 16;
}

function resolvePixelValue(value: string) {
	const parsedValue = Number.parseFloat(value);
	return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function buildVisualCursorRows(positions: VisualCursorPosition[]) {
	if (positions.length === 0) {
		return [] as VisualCursorRow[];
	}

	const rows: VisualCursorRow[] = [];
	let rowStart = 0;
	let rowTop = positions[0]?.top ?? 0;

	for (let index = 1; index < positions.length; index += 1) {
		const top = positions[index]?.top ?? rowTop;
		if (top !== rowTop) {
			rows.push({ start: rowStart, end: index - 1 });
			rowStart = index;
			rowTop = top;
		}
	}

	rows.push({ start: rowStart, end: positions.length - 1 });
	return rows;
}

export function findCursorOnAdjacentVisualRow(
	positions: VisualCursorPosition[],
	rows: VisualCursorRow[],
	cursor: number,
	direction: VerticalDirection,
	preferredLeft: number,
) {
	if (positions.length === 0 || rows.length === 0) {
		return cursor;
	}

	const clampedCursor = clamp(cursor, 0, positions.length - 1);
	const currentRowIndex = rows.findIndex(
		(row) => clampedCursor >= row.start && clampedCursor <= row.end,
	);

	if (currentRowIndex === -1) {
		return clampedCursor;
	}

	const targetRowIndex =
		direction === "up" ? currentRowIndex - 1 : currentRowIndex + 1;

	if (targetRowIndex < 0 || targetRowIndex >= rows.length) {
		return clampedCursor;
	}

	const targetRow = rows[targetRowIndex];
	if (!targetRow) {
		return clampedCursor;
	}

	let bestCursor = targetRow.start;
	let bestDistance = Math.abs(
		(positions[bestCursor]?.left ?? 0) - preferredLeft,
	);

	for (let index = targetRow.start + 1; index <= targetRow.end; index += 1) {
		const distance = Math.abs((positions[index]?.left ?? 0) - preferredLeft);

		if (
			distance < bestDistance ||
			(distance === bestDistance && index > bestCursor)
		) {
			bestCursor = index;
			bestDistance = distance;
		}
	}

	return bestCursor;
}

function measureTextAreaVisualLayout(
	input: HTMLTextAreaElement,
): VisualCursorLayout | null {
	if (
		typeof document === "undefined" ||
		!document.body ||
		input.value.length > VISUAL_LAYOUT_MAX_LENGTH ||
		input.clientWidth <= 0
	) {
		return null;
	}

	const computedStyle = window.getComputedStyle(input);
	const mirror = document.createElement("div");
	mirror.setAttribute("aria-hidden", "true");
	mirror.style.position = "absolute";
	mirror.style.left = "-99999px";
	mirror.style.top = "0";
	mirror.style.visibility = "hidden";
	mirror.style.pointerEvents = "none";
	mirror.style.whiteSpace = "pre-wrap";
	mirror.style.overflowWrap = "break-word";
	mirror.style.wordBreak = computedStyle.wordBreak;
	mirror.style.lineHeight = computedStyle.lineHeight;
	mirror.style.font = computedStyle.font;
	mirror.style.letterSpacing = computedStyle.letterSpacing;
	mirror.style.textTransform = computedStyle.textTransform;
	mirror.style.textIndent = computedStyle.textIndent;
	mirror.style.tabSize = computedStyle.tabSize;
	mirror.style.paddingTop = computedStyle.paddingTop;
	mirror.style.paddingRight = computedStyle.paddingRight;
	mirror.style.paddingBottom = computedStyle.paddingBottom;
	mirror.style.paddingLeft = computedStyle.paddingLeft;
	mirror.style.border = "0";
	mirror.style.boxSizing = "border-box";
	mirror.style.width = `${input.clientWidth}px`;

	const fragment = document.createDocumentFragment();
	const markers: HTMLSpanElement[] = [];
	const value = input.value;

	for (let index = 0; index <= value.length; index += 1) {
		const marker = document.createElement("span");
		marker.textContent = "\u200b";
		marker.style.display = "inline";
		marker.style.padding = "0";
		marker.style.margin = "0";
		marker.style.border = "0";

		markers.push(marker);
		fragment.append(marker);

		if (index < value.length) {
			fragment.append(document.createTextNode(value[index] ?? ""));
		}
	}

	mirror.append(fragment);
	document.body.append(mirror);

	try {
		const positions = markers.map((marker) => ({
			top: marker.offsetTop,
			left: marker.offsetLeft,
		}));
		const rows = buildVisualCursorRows(positions);
		const hasLogicalMultiline = value.includes("\n");
		const hasVisualOverflow = input.scrollHeight - input.clientHeight > 1;

		if (rows.length <= 1 && (hasLogicalMultiline || hasVisualOverflow)) {
			return null;
		}

		return {
			positions,
			rows,
			lineHeight: resolveLineHeight(input),
		};
	} finally {
		mirror.remove();
	}
}

function keepTextAreaCursorVisible(
	input: HTMLTextAreaElement,
	cursor: number,
	direction: VerticalDirection,
	hasMoved: boolean,
	metrics?: {
		lineTop: number;
		lineHeight: number;
	},
) {
	const computedStyle = window.getComputedStyle(input);
	const lineHeight = metrics?.lineHeight ?? resolveLineHeight(input);
	const paddingTop = resolvePixelValue(computedStyle.paddingTop);
	const lineIndex = countLinesBeforeCursor(input.value, cursor);
	const lineTop = metrics?.lineTop ?? paddingTop + lineIndex * lineHeight;
	const lineBottom = lineTop + lineHeight;
	const visibilityBuffer = lineHeight;
	const viewportTop = input.scrollTop + visibilityBuffer;
	const viewportBottom =
		input.scrollTop + input.clientHeight - visibilityBuffer;
	const maxScrollTop = Math.max(input.scrollHeight - input.clientHeight, 0);
	const hasLogicalMultiline = input.value.includes("\n");

	if (hasLogicalMultiline && !hasMoved) {
		if (direction === "down") {
			input.scrollTop = maxScrollTop;
			return;
		}

		input.scrollTop = 0;
		return;
	}

	if (lineTop < viewportTop) {
		input.scrollTop = Math.max(lineTop - visibilityBuffer, 0);
		return;
	}

	if (lineBottom > viewportBottom) {
		input.scrollTop = Math.min(
			lineBottom + visibilityBuffer - input.clientHeight,
			maxScrollTop,
		);
	}

	if (
		hasLogicalMultiline &&
		direction === "down" &&
		cursor === input.value.length
	) {
		input.scrollTop = maxScrollTop;
	}
}

function isTextArea(input: TextInputElement) {
	return input instanceof HTMLTextAreaElement;
}

export function useVimInput<
	TElement extends TextInputElement = HTMLInputElement,
>() {
	const inputRef = useRef<TElement | null>(null);
	const preferredVisualLeftRef = useRef<number | null>(null);
	const [mode, setMode] = useState<VimMode>("normal");

	const moveCaretBy = useCallback((delta: number) => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const nextCursor = clamp(cursor + delta, 0, input.value.length);

		input.setSelectionRange(nextCursor, nextCursor);
		preferredVisualLeftRef.current = null;
	}, []);

	const moveToNextWord = useCallback(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const nextCursor = findNextWordStart(input.value, cursor);

		input.setSelectionRange(nextCursor, nextCursor);
		preferredVisualLeftRef.current = null;
	}, []);

	const moveToPreviousWord = useCallback(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const previousCursor = findPreviousWordStart(input.value, cursor);

		input.setSelectionRange(previousCursor, previousCursor);
		preferredVisualLeftRef.current = null;
	}, []);

	const moveToWordEnd = useCallback(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const wordEndCursor = findWordEndForward(input.value, cursor);

		input.setSelectionRange(wordEndCursor, wordEndCursor);
		preferredVisualLeftRef.current = null;
	}, []);

	const moveCaretVertically = useCallback((direction: VerticalDirection) => {
		const input = inputRef.current;

		if (!input || !isTextArea(input)) {
			return;
		}

		const cursor = input.selectionStart ?? 0;
		const visualLayout = measureTextAreaVisualLayout(input);
		let nextCursor = cursor;
		let visibilityMetrics: { lineTop: number; lineHeight: number } | undefined;

		if (visualLayout && visualLayout.positions.length > 0) {
			const currentPosition = visualLayout.positions[cursor];

			if (currentPosition) {
				const preferredLeft =
					preferredVisualLeftRef.current ?? currentPosition.left;
				nextCursor = findCursorOnAdjacentVisualRow(
					visualLayout.positions,
					visualLayout.rows,
					cursor,
					direction,
					preferredLeft,
				);

				const nextPosition = visualLayout.positions[nextCursor];
				if (nextPosition) {
					visibilityMetrics = {
						lineTop: nextPosition.top,
						lineHeight: visualLayout.lineHeight,
					};
				}

				preferredVisualLeftRef.current = preferredLeft;
			}
		} else {
			nextCursor =
				direction === "up"
					? findPreviousLineCursor(input.value, cursor)
					: findNextLineCursor(input.value, cursor);
			preferredVisualLeftRef.current = null;
		}

		const hasLogicalMultiline = input.value.includes("\n");
		const hasMoved = nextCursor !== cursor;

		input.setSelectionRange(nextCursor, nextCursor);
		if (hasMoved || hasLogicalMultiline) {
			keepTextAreaCursorVisible(
				input,
				nextCursor,
				direction,
				hasMoved,
				visibilityMetrics,
			);
		}
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
					preferredVisualLeftRef.current = null;
				}

				return;
			}

			if (key === "i") {
				event.preventDefault();
				setMode("insert");
				preferredVisualLeftRef.current = null;
				return;
			}

			// Preserve browser/system shortcuts in normal mode (e.g. paste/copy).
			if (event.metaKey || event.ctrlKey || event.altKey) {
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
				preferredVisualLeftRef.current = null;
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
