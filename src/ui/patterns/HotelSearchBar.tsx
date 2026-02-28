import { useState } from "react";
import { Search, MapPin, Calendar, Users } from "lucide-react";

const PRIMARY = "#6728E0";

export function HotelSearchBar() {
  const [location, setLocation] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("성인 2명");

  return (
    <div className="py-14 px-4" style={{ background: `linear-gradient(135deg, #4B1FA8 0%, ${PRIMARY} 50%, #9B5CF6 100%)` }}>
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-white text-center mb-2" style={{ fontSize: "2rem", fontWeight: 800 }}>
          어디로 떠나고 싶으세요?
        </h1>
        <p className="text-white/80 text-center mb-8 text-sm">
          국내외 최저가 호텔을 트립비토즈에서 찾아보세요
        </p>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl p-2 max-w-[860px] mx-auto">
          <div className="flex flex-col md:flex-row gap-1">
            {/* Location */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <MapPin size={18} className="shrink-0" style={{ color: PRIMARY }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-0.5">여행지</div>
                <input
                  type="text"
                  placeholder="도시, 지역, 호텔명 검색"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="hidden md:block w-px bg-gray-200 my-2" />

            {/* Check-in */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors min-w-[140px]">
              <Calendar size={18} className="shrink-0" style={{ color: PRIMARY }} />
              <div>
                <div className="text-xs text-gray-400 mb-0.5">체크인</div>
                <input
                  type="date"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="text-sm text-gray-800 outline-none bg-transparent cursor-pointer"
                />
              </div>
            </div>

            <div className="hidden md:block w-px bg-gray-200 my-2" />

            {/* Check-out */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors min-w-[140px]">
              <Calendar size={18} className="shrink-0" style={{ color: PRIMARY }} />
              <div>
                <div className="text-xs text-gray-400 mb-0.5">체크아웃</div>
                <input
                  type="date"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="text-sm text-gray-800 outline-none bg-transparent cursor-pointer"
                />
              </div>
            </div>

            <div className="hidden md:block w-px bg-gray-200 my-2" />

            {/* Guests */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors min-w-[120px]">
              <Users size={18} className="shrink-0" style={{ color: PRIMARY }} />
              <div>
                <div className="text-xs text-gray-400 mb-0.5">인원</div>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="text-sm text-gray-800 outline-none bg-transparent cursor-pointer"
                >
                  <option>성인 1명</option>
                  <option>성인 2명</option>
                  <option>성인 3명</option>
                  <option>성인 4명</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              className="text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 justify-center font-medium shrink-0 hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              <Search size={18} />
              <span className="hidden md:inline">검색</span>
            </button>
          </div>
        </div>

        {/* Quick Tags */}
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {["서울", "부산", "제주도", "강원", "경주", "도쿄", "오사카", "방콕"].map((tag) => (
            <button
              key={tag}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-full border border-white/30 transition-colors backdrop-blur-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
