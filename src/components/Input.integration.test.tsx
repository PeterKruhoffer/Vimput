import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "./Input";

function setupInput() {
  render(<Input />);
  return screen.getByRole("textbox", {
    name: "Vim motion input",
  }) as HTMLInputElement;
}

describe("Input integration", () => {
  afterEach(() => {
    cleanup();
  });

  it("moves by character with h/l and maps j/k to horizontal movement", () => {
    const input = setupInput();
    input.value = "alpha beta gamma";
    input.focus();
    input.setSelectionRange(6, 6);

    fireEvent.keyDown(input, { key: "l" });
    expect(input.selectionStart).toBe(7);

    fireEvent.keyDown(input, { key: "h" });
    expect(input.selectionStart).toBe(6);

    fireEvent.keyDown(input, { key: "j" });
    expect(input.selectionStart).toBe(7);

    fireEvent.keyDown(input, { key: "k" });
    expect(input.selectionStart).toBe(6);
  });

  it("supports word motions w/b/e in normal mode", () => {
    const input = setupInput();
    input.value = "alpha  beta gamma";
    input.focus();
    input.setSelectionRange(0, 0);

    fireEvent.keyDown(input, { key: "w" });
    expect(input.selectionStart).toBe(7);

    fireEvent.keyDown(input, { key: "e" });
    expect(input.selectionStart).toBe(11);

    fireEvent.keyDown(input, { key: "w" });
    expect(input.selectionStart).toBe(12);

    fireEvent.keyDown(input, { key: "b" });
    expect(input.selectionStart).toBe(7);

    fireEvent.keyDown(input, { key: "b" });
    expect(input.selectionStart).toBe(0);
  });

  it("supports word deletion commands dw/db/diw/ciw", () => {
    const input = setupInput();
    input.focus();

    input.value = "alpha beta gamma";
    input.setSelectionRange(0, 0);
    fireEvent.keyDown(input, { key: "d" });
    fireEvent.keyDown(input, { key: "w" });
    expect(input.value).toBe("beta gamma");
    expect(input.selectionStart).toBe(0);
    expect(screen.getByText("normal")).toBeTruthy();

    input.value = "alpha beta gamma";
    input.setSelectionRange(11, 11);
    fireEvent.keyDown(input, { key: "d" });
    fireEvent.keyDown(input, { key: "b" });
    expect(input.value).toBe("alpha gamma");
    expect(input.selectionStart).toBe(6);
    expect(screen.getByText("normal")).toBeTruthy();

    input.value = "one two three";
    input.setSelectionRange(5, 5);
    fireEvent.keyDown(input, { key: "d" });
    fireEvent.keyDown(input, { key: "i" });
    fireEvent.keyDown(input, { key: "w" });
    expect(input.value).toBe("one  three");
    expect(input.selectionStart).toBe(4);
    expect(screen.getByText("normal")).toBeTruthy();

    input.value = "one  three";
    input.setSelectionRange(6, 6);
    fireEvent.keyDown(input, { key: "c" });
    fireEvent.keyDown(input, { key: "i" });
    fireEvent.keyDown(input, { key: "w" });
    expect(input.value).toBe("one  ");
    expect(input.selectionStart).toBe(5);
    expect(screen.getByText("insert")).toBeTruthy();
  });

  it("starts in insert mode on empty focus and blocks plain typing in normal mode", () => {
    const input = setupInput();
    fireEvent.focus(input);

    expect(screen.getByText("insert")).toBeTruthy();

    const insertEvent = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(insertEvent);
    expect(insertEvent.defaultPrevented).toBe(false);

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("normal")).toBeTruthy();

    const normalEvent = new KeyboardEvent("keydown", {
      key: "x",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(normalEvent);
    expect(normalEvent.defaultPrevented).toBe(true);
  });

  it("uses a to append and switch to insert mode from normal mode", () => {
    const input = setupInput();
    input.value = "alpha";
    input.focus();
    input.setSelectionRange(1, 1);

    const appendHandled = fireEvent.keyDown(input, { key: "a" });
    expect(appendHandled).toBe(false);
    expect(input.selectionStart).toBe(2);
    expect(screen.getByText("insert")).toBeTruthy();
  });

  it("uses Shift+A/Shift+I for end/start-of-line insert in normal mode", () => {
    const input = setupInput();
    input.value = "alpha beta";
    input.focus();
    input.setSelectionRange(3, 3);

    fireEvent.keyDown(input, { key: "A", shiftKey: true });
    expect(input.selectionStart).toBe(input.value.length);
    expect(screen.getByText("insert")).toBeTruthy();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("normal")).toBeTruthy();

    fireEvent.keyDown(input, { key: "I", shiftKey: true });
    expect(input.selectionStart).toBe(0);
    expect(screen.getByText("insert")).toBeTruthy();
  });

  it("moves the cursor left on escape and keeps i as insert-before-current-char", () => {
    const input = setupInput();
    input.value = "alpha";
    input.focus();
    input.setSelectionRange(5, 5);

    fireEvent.keyDown(input, { key: "i" });
    expect(screen.getByText("insert")).toBeTruthy();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("normal")).toBeTruthy();
    expect(input.selectionStart).toBe(4);

    fireEvent.keyDown(input, { key: "i" });
    expect(screen.getByText("insert")).toBeTruthy();
    expect(input.selectionStart).toBe(4);
  });

  it("enters visual line mode with Shift+V and moves selection by character", () => {
    const input = setupInput();
    input.value = "alpha beta";
    input.focus();
    input.setSelectionRange(4, 4);

    fireEvent.keyDown(input, { key: "V", shiftKey: true });
    expect(screen.getByText("visual line")).toBeTruthy();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(10);

    fireEvent.keyDown(input, { key: "h" });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(9);

    fireEvent.keyDown(input, { key: "j" });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(10);
  });

  it("keeps Ctrl/Cmd shortcuts available in normal mode", () => {
    const input = setupInput();
    input.value = "seed value";
    input.focus();

    const ctrlPasteEvent = new KeyboardEvent("keydown", {
      key: "v",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(ctrlPasteEvent);
    expect(ctrlPasteEvent.defaultPrevented).toBe(false);

    const metaPasteEvent = new KeyboardEvent("keydown", {
      key: "v",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(metaPasteEvent);
    expect(metaPasteEvent.defaultPrevented).toBe(false);
  });
});
