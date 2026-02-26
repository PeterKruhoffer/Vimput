import { ModeBadge } from "./vim-input/ModeBadge";
import { ModeHint } from "./vim-input/ModeHint";
import { useVimInput } from "./vim-input/useVimInput";

export function MultilineInput() {
  const { inputRef, mode, onFocus, onKeyDown } =
    useVimInput<HTMLTextAreaElement>();

  return (
    <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3">
      <div className="rounded-lg border border-zinc-200/20 bg-zinc-950/40 p-3">
        <div className="mb-2 flex items-center justify-end">
          <ModeBadge mode={mode} />
        </div>
        <textarea
          ref={inputRef}
          placeholder="Write multiple lines here"
          className="min-h-36 w-full resize-y rounded-md border border-zinc-50/30 bg-zinc-900/60 p-2 text-zinc-50 outline-none focus:border-zinc-50"
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          spellCheck={false}
          aria-label="Vim motion multiline input"
        />
      </div>
      <ModeHint mode={mode} />
    </div>
  );
}
