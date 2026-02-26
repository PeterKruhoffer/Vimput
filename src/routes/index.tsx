import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/Input";
import { MultilineInput } from "@/components/MultilineInput";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="min-h-screen bg-linear-to-b from-zinc-900 via-zinc-800 to-slate-900">
			<section className="relative overflow-hidden px-6 py-20 text-center">
				<h1 className="text-2xl text-zinc-50">Vimput!</h1>

				<div className="mx-auto mt-8 grid w-full max-w-6xl gap-8 text-left lg:grid-cols-2">
					<div>
						<h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
							Single Line
						</h2>
						<Input />
					</div>

					<div>
						<h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
							Multiline
						</h2>
						<MultilineInput />
					</div>
				</div>
			</section>
		</main>
	);
}
