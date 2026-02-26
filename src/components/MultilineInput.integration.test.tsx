import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MultilineInput } from "./MultilineInput";

function getLineAndColumn(value: string, cursor: number) {
	const beforeCursor = value.slice(0, cursor);
	const lines = beforeCursor.split("\n");
	return {
		line: lines.length,
		column: lines[lines.length - 1]?.length ?? 0,
	};
}

function defineReadonlyDimension(
	element: HTMLElement,
	property: "clientHeight" | "scrollHeight",
	value: number,
) {
	Object.defineProperty(element, property, {
		value,
		configurable: true,
	});
}

function setupMultilineInput() {
	render(<MultilineInput />);
	return screen.getByRole("textbox", {
		name: "Vim motion multiline input",
	}) as HTMLTextAreaElement;
}

describe("MultilineInput integration", () => {
	afterEach(() => {
		cleanup();
	});

	it("moves the cursor vertically with j/k for pasted multiline content", () => {
		const textarea = setupMultilineInput();

		textarea.value = [
			"line one from paste",
			"line two from paste",
			"line three from paste",
			"line four from paste",
			"line five from paste",
		].join("\n");
		textarea.focus();
		textarea.setSelectionRange(textarea.value.length, textarea.value.length);

		fireEvent.keyDown(textarea, { key: "k" });
		const afterUp = getLineAndColumn(textarea.value, textarea.selectionStart);
		expect(afterUp).toEqual({ line: 4, column: 20 });

		fireEvent.keyDown(textarea, { key: "k" });
		const afterSecondUp = getLineAndColumn(
			textarea.value,
			textarea.selectionStart,
		);
		expect(afterSecondUp).toEqual({ line: 3, column: 20 });

		fireEvent.keyDown(textarea, { key: "j" });
		const afterDown = getLineAndColumn(textarea.value, textarea.selectionStart);
		expect(afterDown).toEqual({ line: 4, column: 20 });
	});

	it("snaps scroll to the bottom when repeatedly pressing j at the last line", () => {
		const textarea = setupMultilineInput();

		textarea.value = [
			"line one",
			"line two",
			"line three",
			"line four",
			`last line ${"verylong ".repeat(40)}`,
		].join("\n");
		defineReadonlyDimension(textarea, "clientHeight", 80);
		defineReadonlyDimension(textarea, "scrollHeight", 420);
		textarea.scrollTop = 120;

		const lastLineStart = textarea.value.lastIndexOf("\n") + 1;
		textarea.focus();
		textarea.setSelectionRange(lastLineStart + 8, lastLineStart + 8);

		fireEvent.keyDown(textarea, { key: "j" });

		expect(textarea.scrollTop).toBe(340);
		expect(textarea.selectionStart).toBe(lastLineStart + 8);
	});

	it("snaps scroll to the top when repeatedly pressing k at the first line", () => {
		const textarea = setupMultilineInput();

		textarea.value = [
			"line one",
			"line two",
			"line three",
			"line four",
			"line five",
		].join("\n");
		defineReadonlyDimension(textarea, "clientHeight", 80);
		defineReadonlyDimension(textarea, "scrollHeight", 420);
		textarea.scrollTop = 200;

		textarea.focus();
		textarea.setSelectionRange(0, 0);

		fireEvent.keyDown(textarea, { key: "k" });

		expect(textarea.scrollTop).toBe(0);
		expect(textarea.selectionStart).toBe(0);
	});

	it("does not force-scroll wrapped single-line text when j/k cannot move", () => {
		const textarea = setupMultilineInput();

		textarea.value = "wrapped ".repeat(800);
		defineReadonlyDimension(textarea, "clientHeight", 80);
		defineReadonlyDimension(textarea, "scrollHeight", 960);
		textarea.scrollTop = 320;

		textarea.focus();
		textarea.setSelectionRange(textarea.value.length, textarea.value.length);

		fireEvent.keyDown(textarea, { key: "k" });
		expect(textarea.scrollTop).toBe(320);

		fireEvent.keyDown(textarea, { key: "j" });
		expect(textarea.scrollTop).toBe(320);
	});

	it("keeps Ctrl/Cmd shortcuts available in normal mode", () => {
		const textarea = setupMultilineInput();
		textarea.value = "seed value";
		textarea.focus();

		const ctrlPasteEvent = new KeyboardEvent("keydown", {
			key: "v",
			ctrlKey: true,
			bubbles: true,
			cancelable: true,
		});
		textarea.dispatchEvent(ctrlPasteEvent);
		expect(ctrlPasteEvent.defaultPrevented).toBe(false);

		const metaPasteEvent = new KeyboardEvent("keydown", {
			key: "v",
			metaKey: true,
			bubbles: true,
			cancelable: true,
		});
		textarea.dispatchEvent(metaPasteEvent);
		expect(metaPasteEvent.defaultPrevented).toBe(false);
	});
});
