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

  it("uses a to append and switch to insert mode from normal mode", () => {
    const textarea = setupMultilineInput();
    textarea.value = "line one\nline two";
    textarea.focus();
    textarea.setSelectionRange(2, 2);

    const appendHandled = fireEvent.keyDown(textarea, { key: "a" });
    expect(appendHandled).toBe(false);
    expect(textarea.selectionStart).toBe(3);
    expect(screen.getByText("insert")).toBeTruthy();
  });

  it("uses Shift+A/Shift+I to insert at current line boundaries", () => {
    const textarea = setupMultilineInput();
    textarea.value = "alpha\nbeta\ngamma";
    textarea.focus();
    textarea.setSelectionRange(8, 8);

    fireEvent.keyDown(textarea, { key: "I", shiftKey: true });
    expect(textarea.selectionStart).toBe(6);
    expect(screen.getByText("insert")).toBeTruthy();

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(screen.getByText("normal")).toBeTruthy();

    textarea.setSelectionRange(8, 8);
    fireEvent.keyDown(textarea, { key: "A", shiftKey: true });
    expect(textarea.selectionStart).toBe(10);
    expect(screen.getByText("insert")).toBeTruthy();
  });

  it("moves the cursor left on escape and keeps i as insert-before-current-char", () => {
    const textarea = setupMultilineInput();
    textarea.value = "line one\nline two";
    textarea.focus();
    textarea.setSelectionRange(8, 8);

    fireEvent.keyDown(textarea, { key: "i" });
    expect(screen.getByText("insert")).toBeTruthy();

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(screen.getByText("normal")).toBeTruthy();
    expect(textarea.selectionStart).toBe(7);

    fireEvent.keyDown(textarea, { key: "i" });
    expect(screen.getByText("insert")).toBeTruthy();
    expect(textarea.selectionStart).toBe(7);
  });

  it("enters visual line mode with Shift+V and moves selection by character", () => {
    const textarea = setupMultilineInput();
    textarea.value = "alpha\nbeta\ngamma";
    textarea.focus();
    textarea.setSelectionRange(7, 7);

    fireEvent.keyDown(textarea, { key: "V", shiftKey: true });
    expect(screen.getByText("visual line")).toBeTruthy();
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(10);

    fireEvent.keyDown(textarea, { key: "h" });
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(9);

    fireEvent.keyDown(textarea, { key: "l" });
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(10);

    fireEvent.keyDown(textarea, { key: "j" });
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(11);

    fireEvent.keyDown(textarea, { key: "k" });
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(10);
  });

  it("moves the selected line down/up with Shift+J/Shift+K in visual line mode", () => {
    const textarea = setupMultilineInput();
    textarea.value = "alpha\nbeta\ngamma";
    textarea.focus();
    textarea.setSelectionRange(7, 7);

    fireEvent.keyDown(textarea, { key: "V", shiftKey: true });
    fireEvent.keyDown(textarea, { key: "J", shiftKey: true });

    expect(textarea.value).toBe("alpha\ngamma\nbeta");
    expect(textarea.selectionStart).toBe(12);
    expect(textarea.selectionEnd).toBe(16);
    expect(screen.getByText("visual line")).toBeTruthy();

    fireEvent.keyDown(textarea, { key: "K", shiftKey: true });

    expect(textarea.value).toBe("alpha\nbeta\ngamma");
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(10);
    expect(screen.getByText("visual line")).toBeTruthy();
  });

  it("deletes the highlighted line with d in visual line mode", () => {
    const textarea = setupMultilineInput();
    textarea.value = "alpha\nbeta\ngamma";
    textarea.focus();
    textarea.setSelectionRange(7, 7);

    fireEvent.keyDown(textarea, { key: "V", shiftKey: true });
    fireEvent.keyDown(textarea, { key: "d" });

    expect(textarea.value).toBe("alpha\ngamma");
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(6);
    expect(screen.getByText("normal")).toBeTruthy();
  });
});
