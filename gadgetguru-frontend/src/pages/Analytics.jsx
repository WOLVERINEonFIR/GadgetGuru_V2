import { ArrowLeft, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Analytics() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <BarChart3 className="h-8 w-8 text-blue-600" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
        Analytics is coming soon
      </h1>
      <p className="mt-3 text-base text-slate-500">
        We're building insights from the phone catalog — brand distribution,
        price trends, and spec comparisons. Check back shortly.
      </p>
      <button
        type="button"
        onClick={() => navigate("/recommend")}
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Recommend
      </button>
    </div>
  );
}

export default Analytics;