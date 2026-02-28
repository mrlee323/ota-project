import { useState } from "react";
import { User, Heart, Menu, X, Globe, ChevronDown } from "lucide-react";

const PRIMARY = "#6728E0";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("국내호텔");

  const navItems = ["국내호텔", "해외호텔", "에어텔", "패키지", "액티비티"];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="#" className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: PRIMARY }}>
                <span className="text-white text-sm font-black">T</span>
              </div>
              <span className="font-black text-xl tracking-tight" style={{ color: PRIMARY }}>OTA</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className="px-3 py-2 rounded-md text-sm transition-colors"
                  style={activeNav === item ? { color: PRIMARY, fontWeight: 600 } : { color: "#666" }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              <Globe size={16} />
              <span>KOR</span>
              <ChevronDown size={14} />
            </button>
            <button className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
              <Heart size={16} />
              <span>찜</span>
            </button>
            <button className="hidden md:flex items-center gap-1.5 text-sm text-gray-700 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
              <User size={16} />
              <span>로그인</span>
            </button>
            <button
              className="hidden md:flex text-white text-sm px-4 py-2 rounded-full transition-colors font-medium hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              회원가입
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => { setActiveNav(item); setMobileOpen(false); }}
                className="text-left px-3 py-2.5 rounded-md text-sm"
                style={activeNav === item ? { color: PRIMARY, fontWeight: 600, backgroundColor: "#F4EFFE" } : { color: "#444" }}
              >
                {item}
              </button>
            ))}
            <hr className="my-2 border-gray-100" />
            <button className="text-left px-3 py-2.5 text-sm text-gray-700">로그인</button>
            <button className="text-left px-3 py-2.5 text-sm font-medium" style={{ color: PRIMARY }}>회원가입</button>
          </nav>
        </div>
      )}
    </header>
  );
}
