import { BrainCircuit, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Intent-led decisions",
    description: "We focus the interface around what buyers actually need: value, fit, clarity, and timing.",
  },
  {
    icon: ShieldCheck,
    title: "Trust-first ranking",
    description: "Signals stay visible so every recommendation feels explainable instead of overly clever.",
  },
  {
    icon: Sparkles,
    title: "Calm presentation",
    description: "Dense gadget data is reduced into aligned cards, compact specs, and faster comparisons.",
  },
];

function About() {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white px-10 py-12 text-center shadow-sm">
      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">About GadgetGuru</div>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
        Built to help you decide, not overwhelm you
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500">
        GadgetGuru turns busy product lists into a cleaner decision layer for people comparing phones and laptops with real constraints.
      </p>

      <div className="mt-10 grid grid-cols-3 gap-5 text-left">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-lg font-bold text-slate-900">{title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
        <div className="text-lg font-bold text-slate-900">Team + Tech</div>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          The frontend now runs as a React + Vite experience with Tailwind styling, route-level fade-ins, a shared gadget context for watchlist and compare, and a reusable slide-over detail drawer.
        </p>
      </div>
    </div>
  );
}

export default About;
