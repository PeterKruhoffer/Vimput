import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/Input";
import { MultilineInput } from "@/components/MultilineInput";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="min-h-screen w-full bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-900 px-6 py-8 md:px-10">
      <h1 className="text-center text-3xl text-zinc-50">Vimput!</h1>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-8">
        <section className="grid w-full gap-y-20 place-items-center">
          <div className="w-full max-w-2xl">
            <h2 className="font-semibold uppercase tracking-[0.2em] text-zinc-200">
              Single Line
            </h2>
            <Input />
          </div>

          <div className="w-full max-w-2xl">
            <h2 className="font-semibold uppercase tracking-[0.2em] text-zinc-200">
              Multiline
            </h2>
            <MultilineInput />
          </div>
        </section>
      </div>
    </main>
  );
}
