import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import { NavLink } from "react-router-dom";

const links = [
  { label: "Home", to: "/", icon: HomeRoundedIcon },
  { label: "Recommendation", to: "/recommend", icon: TipsAndUpdatesRoundedIcon },
  { label: "Compare", to: "/compare", icon: CompareArrowsRoundedIcon },
  { label: "Analytics", to: "/analytics", icon: BarChartRoundedIcon },
  { label: "About", to: "/about", icon: InfoOutlinedIcon },
];

function linkClass({ isActive }) {
  return [
    "relative px-1 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900",
    "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-blue-600 after:transition-transform",
    isActive ? "text-slate-900 after:scale-x-100" : "",
  ].join(" ");
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <PhoneIphoneRoundedIcon sx={{ fontSize: 20 }} />
          </div>
          <div className="text-xl font-extrabold tracking-tight text-slate-900">
            Gadget<span className="text-blue-600">IQ</span>
          </div>
        </NavLink>

        <nav className="flex items-center gap-8">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="flex items-center gap-2">
                <link.icon sx={{ fontSize: 18 }} />
                {link.label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="w-[88px]" />
      </div>
    </header>
  );
}

export default Navbar;
