import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import GadgetDetailDrawer from "./components/GadgetDetailDrawer";
import Home from "./pages/Home";
import Recommend from "./pages/Recommend";
import Results from "./pages/Results";
import Compare from "./pages/Compare";
import Analytics from "./pages/Analytics";
import About from "./pages/About";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen min-w-[1024px] bg-white text-slate-900">
      <div className="relative min-h-screen overflow-x-auto">
        <div className="absolute inset-0 -z-10 bg-white" />
        <Navbar />
        <main className="px-8 pb-12 pt-8">
          <div key={location.pathname} className="route-fade">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recommend" element={<Recommend />} />
              <Route path="/results" element={<Results />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>
        <GadgetDetailDrawer />
      </div>
    </div>
  );
}

export default App;
