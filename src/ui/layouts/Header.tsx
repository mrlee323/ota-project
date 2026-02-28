"use client";

import { useState, useEffect } from "react";
import { User, Heart, Menu, X, Globe, ChevronDown, LogOut } from "lucide-react";
import { createClient } from "@/infrastructure/supabase/client";
import { logoutAction } from "@/application/auth/actions";

interface HeaderProps {
  /** 서버에서 전달받은 초기 인증 상태 */
  initialAuthenticated?: boolean;
}

export function Header({ initialAuthenticated = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("국내호텔");
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);

  const navItems = ["국내호텔", "해외호텔", "에어텔", "패키지", "액티비티"];

  // 브라우저 Supabase 클라이언트로 인증 상태 변경 실시간 감지
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    await logoutAction();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand">
                <span className="text-white text-sm font-black">T</span>
              </div>
              <span className="font-black text-xl tracking-tight text-brand">OTA</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    activeNav === item ? "text-brand font-semibold" : "text-gray-500"
                  }`}
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

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1.5 text-sm text-gray-700 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} />
                <span>로그아웃</span>
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  className="hidden md:flex items-center gap-1.5 text-sm text-gray-700 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <User size={16} />
                  <span>로그인</span>
                </a>
                <a
                  href="/signup"
                  className="hidden md:flex text-white text-sm px-4 py-2 rounded-full transition-colors font-medium hover:opacity-90 bg-brand"
                >
                  회원가입
                </a>
              </>
            )}

            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => { setActiveNav(item); setMobileOpen(false); }}
                className={`text-left px-3 py-2.5 rounded-md text-sm ${
                  activeNav === item ? "text-brand font-semibold bg-brand-50" : "text-gray-600"
                }`}
              >
                {item}
              </button>
            ))}
            <hr className="my-2 border-gray-100" />

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2.5 text-sm text-gray-700"
              >
                로그아웃
              </button>
            ) : (
              <>
                <a href="/login" className="text-left px-3 py-2.5 text-sm text-gray-700">로그인</a>
                <a href="/signup" className="text-left px-3 py-2.5 text-sm font-medium text-brand">회원가입</a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
