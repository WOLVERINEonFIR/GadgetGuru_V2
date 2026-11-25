import { ArrowRight, BrainCircuit, ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stats = [
  { icon: BrainCircuit, value: "250", label: "Ranked devices" },
  { icon: TimerReset, value: "3m", label: "Avg decision time" },
  //{ icon: ShieldCheck, value: "98%", label: "Trust score" },
];

function DeviceIllustration() {
  return (
    <svg viewBox="0 0 540 420" className="h-[360px] w-full max-w-[520px]" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="50" y1="20" x2="470" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="g2" x1="180" y1="40" x2="410" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0EAFF" />
          <stop offset="1" stopColor="#BFDBFE" />
        </linearGradient>
      </defs>
      <rect x="120" y="52" width="290" height="190" rx="22" fill="url(#g1)" opacity="0.12" />
      <rect x="140" y="70" width="250" height="154" rx="18" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="2" />
      <rect x="164" y="94" width="202" height="106" rx="14" fill="url(#g2)" />
      <path d="M110 270H420L458 320H72L110 270Z" fill="url(#g1)" opacity="0.16" />
      <rect x="92" y="256" width="346" height="22" rx="11" fill="#DBEAFE" />
      <rect x="326" y="116" width="86" height="174" rx="24" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
      <rect x="338" y="132" width="62" height="130" rx="18" fill="url(#g1)" opacity="0.85" />
      <circle cx="368.5" cy="274.5" r="5.5" fill="#93C5FD" />
      <rect x="66" y="86" width="84" height="84" rx="24" fill="#FFFFFF" />
      <path d="M89 128C109 104 136 101 162 117" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" />
      <path d="M152 153C132 177 104 179 81 164" stroke="#6366F1" strokeWidth="10" strokeLinecap="round" />
      <circle cx="178" cy="90" r="12" fill="#2563EB" opacity="0.2" />
      <circle cx="432" cy="86" r="10" fill="#6366F1" opacity="0.2" />
    </svg>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-[1.15fr_0.85fr] gap-10 rounded-[2rem] border border-slate-200 bg-white/70 px-10 py-12 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col justify-center">
        {/* <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
          ✦ AI-Powered • Free to use
        </div> */}
        <h1 className="max-w-[720px] text-[3.5rem] font-extrabold leading-[1.05] tracking-tight text-slate-900">
          <span className="text-blue-600">Find</span> your next gadget with clarity, speed, and confidence.
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-slate-500">
          Scan live phones and laptops, compare tradeoffs instantly, and move from maybe to confident in one clean flow.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/recommend")}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-1 hover:bg-blue-700 hover:shadow-md"
          >
            Find My Gadget
            <ArrowRight className="h-4 w-4" />
          </button>
          {/* <button
            type="button"
            onClick={() => navigate("/recommend")}
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 hover:border-blue-500 hover:text-blue-700 hover:shadow-md"
          >
            Browse All
          </button> */}
        </div>

        <div className="mt-10 flex items-center gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="classic-card flex min-w-[178px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center rounded-[2rem] bg-[linear-gradient(145deg,rgba(37,99,235,0.08),rgba(99,102,241,0.08))]">
        <DeviceIllustration />
      </div>
    </section>
  );
}

export default Hero;
