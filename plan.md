# 과제·연구 리포트 웹사이트 기획서 (plan.md)

## 1. 프로젝트 목적

### 1.1 배경
과제 및 연구 리포트를 한 곳에서 작성·분류·관리하고, 수식(LaTeX)까지 안정적으로 표현할 수 있는 개인/소규모 연구용 정적 웹사이트를 구축한다.

### 1.2 목표
- GitHub Pages 무료 환경에서 동작하는 정적 웹사이트 구현
- 카테고리 기반 리포트 관리 체계 제공
- 브라우저 내 작성/저장(LocalStorage) + 파일 내보내기(Markdown) 지원
- LaTeX 수식 렌더링 지원으로 연구 문서 품질 확보

### 1.3 성공 기준 (MVP)
- 사용자가 카테고리를 생성/수정/삭제할 수 있다.
- 사용자가 리포트를 작성하고 브라우저 재접속 후에도 데이터가 유지된다.
- 리포트를 Markdown 파일로 내보내고 다시 가져올 수 있다.
- 본문 내 수식(인라인/블록)이 정상 렌더링된다.

---

## 2. 요구사항 분석

### 2.1 필수 요구사항
1. 카테고리 분류
2. 리포트 작성 및 저장
3. LaTeX 지원

### 2.2 제약 조건
- 서버/DB 없음 (정적 호스팅)
- 사용자 인증/멀티유저 기능은 기본 범위에서 제외
- 데이터 영속성은 LocalStorage 또는 파일 기반으로 처리

### 2.3 비기능 요구사항
- 반응형 UI(데스크톱/모바일)
- 빠른 초기 로딩
- 오프라인에 준하는 사용성(저장 기능)
- 유지보수 가능한 폴더 구조와 코드 모듈화

---

## 3. 기술 스택 제안

## 3.1 기본안 (권장 시작점)
- HTML5
- CSS3 (CSS 변수 + 모듈형 스타일 구조)
- JavaScript (Vanilla ES Modules)
- Markdown 파서: `marked` 또는 `markdown-it`
- LaTeX 렌더링: `KaTeX` (빠른 렌더링) 또는 `MathJax` (호환성 우수)
- 배포: GitHub Pages

권장 선택:
- Markdown: `markdown-it`
- 수식 렌더링: `KaTeX` (+ auto-render)

이유:
- KaTeX는 속도가 빠르고 정적 사이트에서 사용성이 좋다.
- markdown-it은 플러그인 생태계가 안정적이다.

### 3.2 대안 (정적 사이트 생성기)
GitHub Pages 호환성과 확장성을 고려하면 다음 도구를 선택 가능:
1. Eleventy(11ty): 단순하고 가벼운 SSG, Markdown 중심 콘텐츠 관리에 적합
2. Astro: 컴포넌트 기반 구조와 확장성 우수, 정적 출력 가능
3. Jekyll: GitHub Pages 기본 친화적이나 커스터마이징 자유도는 상대적으로 낮을 수 있음

권장 전략:
- 1차는 순수 HTML/CSS/JS로 MVP 완성
- 이후 문서 수가 늘어나면 Eleventy 또는 Astro로 점진적 전환

---

## 4. 아키텍처 설계

### 4.1 전체 구조 (Client-only)
- Presentation Layer: 화면(UI)
- Application Layer: 상태 관리, 라우팅, 이벤트 처리
- Domain Layer: 카테고리/리포트 모델, 정렬/검색 규칙
- Infrastructure Layer: LocalStorage 입출력, Markdown Import/Export, LaTeX 렌더링

### 4.2 데이터 모델 (초안)

```json
{
  "categories": [
    {
      "id": "cat-001",
      "name": "딥러닝",
      "createdAt": "2026-03-25T10:00:00Z"
    }
  ],
  "reports": [
    {
      "id": "rep-001",
      "title": "CNN 실험 보고서",
      "categoryId": "cat-001",
      "content": "# 제목\n수식: $E=mc^2$",
      "tags": ["vision", "baseline"],
      "updatedAt": "2026-03-25T10:00:00Z",
      "createdAt": "2026-03-25T10:00:00Z"
    }
  ]
}
```

LocalStorage 키 예시:
- `report_app_categories_v1`
- `report_app_reports_v1`
- `report_app_settings_v1`

### 4.3 화면/정보 구조
- 대시보드: 최근 리포트, 카테고리 요약
- 카테고리 페이지: 카테고리 목록, 생성/편집/삭제
- 리포트 목록 페이지: 카테고리/태그/검색 필터
- 리포트 에디터 페이지: 작성 영역 + 미리보기(마크다운+LaTeX)
- 백업/복원 페이지: Markdown 내보내기/가져오기

---

## 5. 기능 명세서

### 5.1 카테고리 관리
- 카테고리 생성: 이름 입력, 중복 검사
- 카테고리 수정: 이름 변경
- 카테고리 삭제: 연결 리포트 처리 정책 필요

삭제 정책 권장:
- 정책 A: 삭제 시 리포트를 "미분류"로 이동
- 정책 B: 삭제 전 사용자 확인 후 일괄 삭제
- MVP에서는 정책 A 권장(데이터 유실 최소화)

### 5.2 리포트 작성/저장
- 새 리포트 생성 (제목, 카테고리, 본문, 태그)
- 자동 저장 (디바운스 500~1000ms)
- 수동 저장 버튼
- 최근 편집 시간 표시

저장 전략:
- 기본: LocalStorage 저장
- 보조: Markdown 파일 내보내기 (`.md`)
- 복원: Markdown 파일 가져오기 + 메타데이터 파싱(가능한 범위)

### 5.3 Markdown + LaTeX 렌더링
- 본문 작성은 Markdown 문법 사용
- 인라인 수식: `$...$`
- 블록 수식: `$$...$$`
- 미리보기 패널에서 실시간 렌더링

렌더링 파이프라인:
1. 사용자 입력
2. Markdown 파싱
3. HTML sanitize (보안)
4. LaTeX 렌더링
5. 미리보기 반영

### 5.4 검색/정렬
- 제목/본문 키워드 검색
- 카테고리 필터
- 최신 수정일 정렬

### 5.5 데이터 백업/복원
- 전체 데이터 JSON 내보내기
- 개별 리포트 Markdown 내보내기
- JSON 가져오기 시 버전 체크 및 마이그레이션 훅 제공

---

## 6. 보안/안정성 고려사항

- XSS 방지: Markdown 렌더링 결과 sanitize 필수(DOMPurify 권장)
- 데이터 손실 방지: 자동 저장 + 내보내기 권장 배너
- 버전 호환: 스키마 버전 필드(`schemaVersion`) 유지
- LocalStorage 한계: 대용량 데이터(보통 5MB 내외) 대비 백업 유도

---

## 7. 디렉터리 구조 제안

```text
/ (repo root)
  index.html
  /assets
    /css
      base.css
      layout.css
      editor.css
    /js
      app.js
      router.js
      state.js
      storage.js
      markdown.js
      latex.js
      ui.js
    /vendor (선택)
  /pages
    dashboard.html
    categories.html
    reports.html
    editor.html
    backup.html
  /data (선택: 샘플 데이터)
  README.md
  plan.md
```

단일 페이지(SPA)로 구성해도 되지만, 초기 복잡도를 낮추려면 멀티 페이지 + 공용 JS 모듈 방식이 안정적이다.

---

## 8. 개발 단계 (Phase)

## Phase 0. 기획 확정
- 요구사항 동결(MVP 범위 확정)
- 화면 흐름도/정보 구조 확정
- 데이터 모델 확정

산출물:
- plan.md
- 와이어프레임(간단한 스케치)

## Phase 1. 프로젝트 초기화
- 기본 폴더 구조 생성
- 공통 레이아웃/스타일 토대 구축
- GitHub Pages 배포 파이프라인 연결

완료 기준:
- 정적 페이지가 GitHub Pages에서 정상 노출

## Phase 2. 카테고리/리포트 CRUD
- 카테고리 CRUD 구현
- 리포트 CRUD 구현
- LocalStorage 연동

완료 기준:
- 데이터 생성/수정/삭제/재로딩 유지 확인

## Phase 3. 에디터 + 미리보기 + LaTeX
- Markdown 입력/미리보기 분할 UI
- KaTeX/MathJax 연동
- 자동 저장 및 저장 상태 표시

완료 기준:
- 샘플 수식 렌더링 성공
- 자동 저장 안정 동작

## Phase 4. 검색/필터/정렬 + 백업/복원
- 검색/필터 UI 구현
- JSON/Markdown Export/Import 구현
- 예외 처리 및 UX 고도화

완료 기준:
- 데이터 백업/복원 시나리오 통과

## Phase 5. 품질 개선 및 배포 안정화
- 반응형 개선
- 접근성 점검(키보드 내비게이션, 명도 대비)
- 성능 점검(초기 로드, 렌더링)
- 문서화(README, 사용 가이드)

완료 기준:
- 과제 제출/연구 사용 가능한 안정 버전 릴리스

---

## 9. 테스트 전략

- 기능 테스트: 카테고리/리포트 CRUD, 검색, 백업/복원
- 렌더링 테스트: Markdown/LaTeX 샘플 케이스
- 회귀 테스트: 저장 포맷 변경 시 이전 데이터 호환
- 브라우저 테스트: Chrome/Edge 우선
- 반응형 테스트: 모바일(폭 375px), 태블릿, 데스크톱

---

## 10. GitHub Pages 배포 전략

### 10.1 배포 방식
1. 메인 브랜치 루트 배포
2. `docs/` 폴더 배포
3. GitHub Actions로 빌드 후 `gh-pages` 브랜치 배포(SSG 사용 시 권장)

### 10.2 권장
- 순수 정적 사이트 시작 시: 메인 브랜치 루트 배포
- SSG 도입 시: Actions + `gh-pages` 브랜치 자동 배포

---

## 11. 향후 확장 로드맵

- PWA 적용(오프라인 캐시)
- 리포트 템플릿(실험 보고서, 문헌 리뷰 등)
- 인용 관리(BibTeX import/export)
- 그래프/다이어그램(Mermaid) 지원
- 다국어 지원
- 클라우드 동기화(향후 백엔드 도입 시)

---

## 12. 결정 사항 요약 (초기 권장안)

- 아키텍처: Client-only 정적 웹앱
- 저장: LocalStorage + JSON/Markdown Export/Import
- Markdown: markdown-it
- 수식: KaTeX
- 보안: DOMPurify sanitize 적용
- 배포: GitHub Pages
- 개발 방식: MVP 우선, 필요 시 Eleventy/Astro로 확장

이 문서를 기준으로 다음 단계에서 실제 프로젝트 초기 구조와 MVP 구현을 시작한다.
