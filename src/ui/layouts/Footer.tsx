const PRIMARY = "#6728E0";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-8">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: PRIMARY }}>
                <span className="text-white text-xs font-black">T</span>
              </div>
              <span className="text-white font-black text-lg">OTA</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              최저가 호텔 예약 서비스<br />OTA와 함께 특별한<br />여행을 만들어보세요.
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">서비스</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">국내 호텔</a></li>
              <li><a href="#" className="hover:text-white transition-colors">해외 호텔</a></li>
              <li><a href="#" className="hover:text-white transition-colors">에어텔</a></li>
              <li><a href="#" className="hover:text-white transition-colors">패키지</a></li>
              <li><a href="#" className="hover:text-white transition-colors">액티비티</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">고객지원</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">자주 묻는 질문</a></li>
              <li><a href="#" className="hover:text-white transition-colors">예약 조회</a></li>
              <li><a href="#" className="hover:text-white transition-colors">취소/환불 정책</a></li>
              <li><a href="#" className="hover:text-white transition-colors">고객센터</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">회사 정보</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">회사 소개</a></li>
              <li><a href="#" className="hover:text-white transition-colors">채용 공고</a></li>
              <li><a href="#" className="hover:text-white transition-colors">제휴/입점 문의</a></li>
              <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-800 mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-gray-600">
          <div className="leading-relaxed">
            <p>주식회사 OTA | 대표이사 홍길동 | 사업자등록번호 000-00-00000</p>
            <p>서울특별시 강남구 테헤란로 000 | 통신판매업신고번호 제2024-서울강남-0000호</p>
            <p>관광사업등록번호 제2024-000000호 | 고객센터: 1644-0000 (평일 09:00-18:00)</p>
          </div>
          <p>© 2024 Ota Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
