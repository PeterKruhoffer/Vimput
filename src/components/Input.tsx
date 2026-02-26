import { ModeBadge } from "./vim-input/ModeBadge";
import { ModeHint } from "./vim-input/ModeHint";
import { useVimInput } from "./vim-input/useVimInput";

export function Input() {
  const { inputRef, mode, onFocus, onKeyDown } = useVimInput();

  return (
    <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200/20 bg-zinc-950/40 p-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Write text here"
          className="w-full rounded-md border border-zinc-50/30 bg-zinc-900/60 p-2 text-zinc-50 outline-none focus:border-zinc-50"
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          spellCheck={false}
          aria-label="Vim motion input"
        />
        <ModeBadge mode={mode} />
      </div>
      <ModeHint mode={mode} />
    </div>
  );
}
