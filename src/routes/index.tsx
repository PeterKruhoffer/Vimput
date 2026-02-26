import { Input } from "@/components/Input";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-900 via-zinc-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <h1 className="text-2xl text-zinc-50">Vimput!</h1>
        <Input />
      </section>
    </main>
  );
}
