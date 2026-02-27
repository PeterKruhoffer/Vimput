import { ModeBadge } from "./vim-input/ModeBadge";
import { ModeHint } from "./vim-input/ModeHint";
import { useVimInput } from "./vim-input/useVimInput";

export function Input() {
  const { inputRef, mode, onFocus, onKeyDown } = useVimInput();

  return (
    <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3">
      <div className="flex flex-col items-end gap-3 rounded-lg border-2 border-zinc-200/20 bg-zinc-950/40 p-3">
        <ModeBadge mode={mode} />
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
      </div>
      <div className="h-24 w-full overflow-y-auto">
        <ModeHint mode={mode} />
      </div>
    </div>
  );
}
