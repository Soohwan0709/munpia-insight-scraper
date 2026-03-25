# Munpia Insight Scraper 🚀

**문피아 작품 지표 분석 및 엑셀 다운로드를 위한 크롬 확장 프로그램**

문피아 웹소설 상세 페이지에서 연재수, 최신 지표(조회수, 추천수), 연독률을 자동으로 추출하여 대시보드 형태로 보여주고, 데이터를 CSV로 저장할 수 있게 도와주는 도구입니다.

## ✨ 주요 기능

-   📊 **실시간 지표 분석**: 전체 연재수, 최신화 조회수 및 추천수 자동 추출
-   📈 **연독률 계산**: 최신 -3화와 첫 4화(Oldest+3) 데이터를 비교하여 연독률 산출 (자동 페이지 페칭 지원)
-   🕒 **유연한 시간 인식**: "N시간 전", "어제", "오늘" 등 상대적 시간 표기도 완벽하게 인식
-   📥 **엑셀(CSV) 저장**: 수집된 지표를 클릭 한 번으로 CSV 파일로 다운로드 (엑셀 한글 깨짐 방지 BOM 적용)
-   🌑 **Modern Dark UI**: 사용하기 편하고 세련된 다크 모드 디자인

## 🔧 설치 방법

1.  본 저장소를 클론하거나 ZIP으로 다운로드합니다.
2.  크롬 브라우저에서 `chrome://extensions/` 주소로 이동합니다.
3.  우측 상단의 **'개발자 모드'**를 활성화합니다.
4.  이미지나 ZIP 압축을 푼 폴더(`munpia_extension`)를 **'압축해제된 확장 프로그램을 로드합니다'** 버튼을 통해 업로드합니다.
5.  문피아 작품 페이지에서 아이콘을 클릭하여 분석을 시작하세요!

## 📂 파일 구조

-   `manifest.json`: 확장 프로그램 메타데이터 (Manifest V3)
-   `popup.html`: 분석 결과 대시보드 UI
-   `popup.js`: 분석 로직 및 엑셀 저장 엔진
-   `content.js`: 문피아 페이지 텍스트 분석 및 데이터 추출
-   `icons/`: 확장 프로그램 아이콘 리소스

## 🛠 기술 스택

-   **Frontend**: HTML5, Vanilla JavaScript, CSS3
-   **API**: Chrome Scripting API (Manifest V3)
-   **Parsing**: Robust Regex-based Text Extraction (셀렉터 의존도 최소화)

---
© 2026 Munpia Insight Scraper. Licensed under MIT.
