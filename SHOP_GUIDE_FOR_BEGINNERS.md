# SSEUNG 쇼핑몰 만들기 — 초보자용 전체 과정 가이드

이 문서는 **shop-demo (SSEUNG)** 쇼핑몰을 처음부터 만들고, 배포하기까지의 과정을  
초보자가 따라올 수 있도록 **단계적으로** 정리한 가이드입니다.

- 프로젝트 구조: `client`(프론트) + `server`(백엔드) 모노레포
- 프론트: React + Vite
- 백엔드: Node.js + Express
- DB: MongoDB Atlas
- 이미지: Cloudinary
- 결제: PortOne V2
- 배포: GitHub → Heroku(API) → Vercel(웹)

---

## 읽는 방법

문서 안의 표시 의미:

| 표시 | 의미 |
|------|------|
| **[필수]** | 없으면 쇼핑몰이 동작하지 않거나 배포가 안 됨 |
| **[권장]** | 없어도 동작은 하지만, 실서비스/학습에 거의 필요 |
| **[선택]** | 있으면 좋고, 나중에 추가해도 됨 |
| **[주의]** | 초보자가 자주 실수하는 포인트 |

---

# 0. 쇼핑몰이란? (큰 그림)

온라인 쇼핑몰은 보통 이렇게 나뉩니다.

```text
[사용자 브라우저]
      │
      │  상품 보기 / 로그인 / 장바구니 / 결제
      ▼
[프론트엔드]  ← 화면 (React)     ← Vercel에 배포
      │
      │  API 요청 (/api/...)
      ▼
[백엔드]      ← 서버 로직 (Express) ← Heroku에 배포
      │
      ├─ MongoDB Atlas   (회원, 상품, 장바구니, 주문 저장)
      ├─ Cloudinary      (상품 이미지 저장)
      └─ PortOne         (결제)
```

### [필수] 역할 구분

1. **프론트엔드**: 사용자가 보는 화면, 버튼, 라우팅
2. **백엔드**: 로그인 검증, DB 저장, 결제 검증, 관리자 권한
3. **데이터베이스**: 데이터가 실제로 쌓이는 곳
4. **외부 서비스**: 이미지(Cloudinary), 결제(PortOne)

> 프론트만 만들면 “가짜 쇼핑몰”처럼 보일 수 있지만,  
> 로그인·장바구니·주문·결제는 **반드시 백엔드 + DB**가 필요합니다.

---

# 1단계. 개발 환경 준비

## 1-1. [필수] 설치할 것

1. **Node.js 20.x** (LTS 권장)
2. **Git**
3. 코드 에디터 (**Cursor / VS Code**)
4. 계정
   - GitHub
   - MongoDB Atlas
   - Cloudinary
   - PortOne (결제)
   - Heroku (백엔드 배포)
   - Vercel (프론트 배포)

## 1-2. [필수] 터미널에서 확인

```bash
node -v
npm -v
git --version
```

버전이 나오면 준비 완료입니다.

---

# 2단계. 프로젝트 뼈대 만들기

이 프로젝트는 한 폴더 안에 프론트와 서버를 함께 둡니다.

```text
shop-demo/
├── client/          # 프론트 (React + Vite)
├── server/          # 백엔드 (Express + MongoDB)
├── package.json     # 루트 스크립트 / Heroku용
├── Procfile         # Heroku가 서버를 켜는 방법
├── vercel.json      # Vercel이 프론트를 빌드하는 방법
└── .gitignore       # .env, node_modules 등 제외
```

## 2-1. [필수] 왜 이렇게 나누나?

| 폴더 | 하는 일 | 배포 위치 |
|------|---------|-----------|
| `client` | 화면 | Vercel |
| `server` | API | Heroku |

## 2-2. [필수] 로컬 실행 명령

프로젝트 루트에서:

```bash
# 백엔드 (보통 http://localhost:5000)
npm run dev:server

# 프론트 (보통 http://localhost:5173)
npm run dev:client
```

### [주의]
- 프론트만 켜고 백엔드를 안 켜면 상품/로그인이 실패합니다.
- 로컬에서는 `client`의 Vite가 `/api` 요청을 `localhost:5000`으로 **프록시**합니다.

---

# 3단계. 데이터베이스 (MongoDB Atlas)

## 3-1. [필수] Atlas란?

클라우드에 있는 MongoDB입니다.  
내 PC에 DB를 직접 설치하지 않아도 됩니다.

## 3-2. [필수] 준비 순서

1. MongoDB Atlas 가입
2. Cluster 생성
3. Database User 생성 (아이디/비밀번호)
4. **Network Access**에 `0.0.0.0/0` 허용  
   → Heroku처럼 IP가 바뀌는 서버에서도 접속 가능
5. 연결 문자열(`MONGODB_URI`) 복사

## 3-3. [필수] 서버 환경변수 (`server/.env`)

```env
PORT=5000
MONGODB_URI=...(Atlas 연결 문자열)
JWT_SECRET=긴-비밀문자열
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
PORTONE_API_SECRET=...(결제 검증용, 나중에)
```

### [주의]
- `.env`는 **절대 GitHub에 올리면 안 됩니다.**
- 이 프로젝트는 `.gitignore`에 `.env`가 이미 들어 있습니다.

## 3-4. [필수] 이 쇼핑몰의 주요 데이터(컬렉션)

| 모델 | 저장 내용 |
|------|-----------|
| User | 회원 (이메일, 비밀번호, 이름, 권한 admin/user) |
| Product | 상품 (이름, 가격, 이미지, 색상, 사이즈, 카테고리) |
| Cart | 장바구니 |
| Order | 주문 / 결제 / 배송 상태 |

---

# 4단계. 백엔드 API 만들기 (Express)

## 4-1. [필수] 서버 진입점

`server/src/index.js`에서 하는 일:

1. `.env` 로드
2. MongoDB 연결
3. CORS 설정 (`CLIENT_ORIGIN`)
4. `/api` 라우트 연결
5. `PORT`로 서버 시작

헬스체크:

- `/` → API 살아 있음 메시지
- `/health` → `{ ok: true }`

## 4-2. [필수] API 구조 (초보자가 외울 패턴)

```text
routes/        → URL 경로 정의
controllers/   → 실제 처리 로직
models/        → DB 스키마
middleware/    → 로그인 검사 등
```

요청 흐름:

```text
브라우저 → /api/cart → route → middleware(로그인?) → controller → model(DB) → 응답
```

## 4-3. [필수] 주요 API 영역

### 인증 (`/api/auth`)
- 로그인
- 내 정보 조회 (`/me`)
- JWT 토큰 발급

### 상품 (`/api/products`)
- 목록 조회
- 상세 조회
- 관리자: 등록/수정/삭제

### 장바구니 (`/api/cart`)
- 조회 / 담기 / 수량 변경 / 삭제
- **로그인 필요**

### 주문 (`/api/orders`)
- 주문 생성
- 내 주문 목록/상세
- 관리자 주문 상태 변경
- 결제 준비/검증 (PortOne)

### 회원 (`/api/users`)
- 회원가입 등

## 4-4. [필수] 로그인(JWT) 개념

1. 이메일/비밀번호로 로그인
2. 서버가 **JWT 토큰** 발급
3. 프론트가 `localStorage`에 저장
4. 이후 API 요청 헤더에  
   `Authorization: Bearer 토큰` 첨부
5. 서버 미들웨어가 토큰 검증

### [주의]
- 화면 상단에 이름이 보여도, 토큰이 없거나 만료되면 API는 실패합니다.
- 프론트와 백엔드의 “로그인 상태”를 반드시 맞춰야 합니다.

---

# 5단계. 프론트엔드 만들기 (React + Vite)

## 5-1. [필수] 주요 폴더

```text
client/src/
├── pages/         # 페이지 (Home, Cart, Login, Admin...)
├── components/    # 재사용 UI (Navbar, Hero, ProductCard...)
├── context/       # 전역 상태 (Auth, Cart)
├── api/           # 서버 호출 함수
├── utils/         # 토큰, Cloudinary, PortOne 유틸
├── routes/        # 라우팅
└── data/          # 카테고리 등 상수
```

## 5-2. [필수] 페이지 목록 (사용자 흐름)

| 경로 | 페이지 | 역할 |
|------|--------|------|
| `/` | Home | 히어로 + 상품 목록/카테고리 |
| `/product/:id` | ProductDetail | 옵션 선택, 장바구니 |
| `/cart` | Cart | 장바구니 |
| `/checkout` | Checkout | 주문자/배송/결제 |
| `/order-complete/:id` | OrderComplete | 결제 성공 |
| `/order-fail` | OrderFail | 결제 실패 |
| `/orders` | MyOrders | 내 주문 |
| `/orders/:id` | OrderDetail | 주문 상세 |
| `/login` | Login | 로그인 |
| `/register` | Register | 회원가입 |
| `/admin` | Admin | 관리자 |

## 5-3. [필수] 전역 상태 (Context)

### AuthContext **[필수]**
- 현재 로그인한 유저
- 로그아웃
- 새로고침 후에도 로그인 유지

### CartContext **[필수]**
- 장바구니 데이터
- 담기/새로고침
- 네비바 장바구니 숫자

## 5-4. [권장] 프론트 환경변수 (`client/.env`)

```env
# 로컬: 비워두면 Vite 프록시 사용
VITE_API_URL=

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...

# PortOne (브라우저용 — 비밀키 아님)
VITE_PORTONE_STORE_ID=...
VITE_PORTONE_CHANNEL_KEY=...
```

### [주의]
- Vite 환경변수는 이름 앞에 **`VITE_`** 가 있어야 합니다.
- 배포 시 `VITE_API_URL`은 **Heroku 주소**로 넣습니다.
- 값을 바꾸면 **다시 빌드/재배포**해야 반영됩니다.

---

# 6단계. 핵심 기능 구현 순서 (추천)

초보자는 아래 순서대로 만드는 것이 가장합니다.

## 6-1. [필수] 상품 목록/상세
1. DB에 Product 모델
2. 상품 API
3. Home에서 목록 표시
4. ProductDetail에서 상세 + 색상/사이즈 옵션

## 6-2. [필수] 회원가입/로그인
1. User 모델 (비밀번호 해시)
2. 로그인 API + JWT
3. Login/Register 페이지
4. AuthContext로 네비바 반영 (`OOO님`)

## 6-3. [필수] 장바구니
1. Cart 모델/API
2. 상품 상세에서 담기
3. Cart 페이지
4. 로그인하지 않으면 담기/조회 제한

## 6-4. [필수] 주문 + 결제
1. Checkout 페이지 (배송지, 주문자)
2. PortOne 브라우저 SDK로 결제창
3. 서버에서 결제 금액/상태 검증
4. Order 저장
5. 성공/실패 페이지
6. 내 주문 / 주문 상세

## 6-5. [필수] 관리자
1. 유저 `level: admin`
2. `/admin` 페이지
3. 상품 등록/수정/삭제
4. 주문 상태 변경 (배송시작/완료/취소)
5. Cloudinary로 이미지 업로드 (여러 장)

## 6-6. [권장] UX 다듬기
- 히어로 배너/카테고리 필터
- 주문 목록 탭(배송상태)
- 모바일 레이아웃
- 에러 메시지 명확화

---

# 7단계. 외부 서비스 연동

## 7-1. [필수] Cloudinary (이미지)

### 왜 쓰나?
Heroku/Vercel에 이미지 파일을 직접 저장하기 어렵습니다.  
Cloudinary URL만 DB에 저장합니다.

### 준비
1. Cloudinary 가입
2. Cloud Name 확인
3. **Unsigned Upload Preset** 생성
4. `VITE_CLOUDINARY_*`에 설정

### 이 프로젝트 동작
- 관리자에서 Upload Widget 실행
- 여러 장 선택 가능 (최대 6장)
- 첫 번째 이미지가 대표 이미지

### [주의]
- API Secret을 프론트(`VITE_`)에 넣지 마세요.
- Unsigned preset만 브라우저에서 사용합니다.

## 7-2. [필수] PortOne V2 (결제)

### 역할 분리

| 위치 | 값 | 용도 |
|------|----|------|
| 프론트 | Store ID, Channel Key | 결제창 띄우기 |
| 서버 | API Secret | 결제 위변조 검증 |

### 결제 흐름 (필수 이해)

```text
1. 장바구니 → 결제하기
2. 서버에 결제 준비(금액/주문정보)
3. PortOne 결제창
4. 결제 완료 후 서버가 PortOne에 실제 결제 내역 조회
5. 금액이 맞으면 Order 생성
6. 성공 페이지로 이동
```

### [주의]
- 프론트만 믿고 주문을 저장하면 **위조 결제**가 가능합니다.
- 반드시 서버에서 검증하세요. (`PORTONE_API_SECRET`)

---

# 8단계. 로컬에서 완성도 점검 (배포 전)

## [필수] 체크리스트

- [ ] 서버 연결 성공 (`연결성공!`)
- [ ] 홈에 상품 보임
- [ ] 회원가입/로그인
- [ ] 로그인 후 네비바에 이름
- [ ] 장바구니 담기/수량/삭제
- [ ] 결제 테스트 (테스트 채널)
- [ ] 주문내역/주문상세
- [ ] 관리자 상품 등록 (이미지 포함)
- [ ] 관리자 주문 상태 변경

## [주의] 배포 전 보안

- [ ] `server/.env`, `client/.env`가 Git 추적 대상이 아닌지 확인
- [ ] 비밀번호/시크릿을 채팅·문서에 붙여넣지 않기

---

# 9단계. 배포 전체 순서 (매우 중요)

권장 순서:

```text
1) 배포 준비
2) GitHub에 코드 푸시
3) Heroku에 백엔드 배포  ← API 주소 먼저 확보
4) Vercel에 프론트 배포  ← VITE_API_URL에 Heroku 주소
5) 서로 연결 (CORS, 결제 도메인)
6) 최종 점검
```

> 프론트를 먼저 배포해도 되지만,  
> **API 주소가 있어야** 프론트 환경변수를 정확히 넣을 수 있어  
> **백엔드 먼저**가 더 쉽습니다.

---

# 10단계. GitHub 배포 (소스 보관소)

## 10-1. [필수] 하는 일

1. GitHub 저장소 생성
2. 로컬 코드를 `main`에 push
3. Heroku/Vercel이 이 저장소를 보고 배포

## 10-2. [필수] 커밋 전 확인

```bash
git status
```

올라가면 안 되는 것:

- `.env`
- `node_modules`
- 비밀번호, API Secret

## 10-3. [권장] Git 사용자 설정 (한 번만)

```bash
git config --global user.name "이름"
git config --global user.email "이메일@example.com"
```

---

# 11단계. Heroku 백엔드 배포 (웹 UI 기준)

## 11-1. [필수] 앱 생성
1. Heroku Dashboard → Create new app
2. Deploy 탭 → GitHub 연결
3. 저장소 선택 후 Connect

## 11-2. [필수] Config Vars 설정
Settings → Config Vars

| KEY | 설명 |
|-----|------|
| `MONGODB_URI` | Atlas 연결 |
| `JWT_SECRET` | JWT 비밀키 |
| `JWT_EXPIRES_IN` | 예: `7d` |
| `PORTONE_API_SECRET` | 결제 검증 |
| `CLIENT_ORIGIN` | Vercel 주소 (끝 `/` 없이) |

### [주의]
- `PORT`는 Heroku가 자동 설정 → 직접 넣지 않아도 됨
- Atlas Network Access `0.0.0.0/0` 확인

## 11-3. [필수] Deploy Branch
1. Deploy 탭
2. Branch: `main`
3. **Deploy Branch** 클릭  
   (Connect만 하고 Deploy를 안 누르면 앱이 비어 있음)

성공 로그 예:

```text
Procfile declares types -> web
Your app was successfully deployed.
```

## 11-4. [필수] Dyno ON
Resources 탭에서 `web` 토글 ON → Confirm

### [주의] Heroku 과금
- 무료 상시 실행은 없음
- Eco 구독 또는 Basic dyno 필요
- 토글이 바로 꺼지면 Billing/구독 상태를 확인

## 11-5. [필수] 확인
브라우저에서:

```text
https://앱이름.herokuapp.com/
→ {"message":"Shop Demo API is running"}
```

이 주소를 메모하세요.  
다음 단계 `VITE_API_URL`에 사용합니다. (**끝 `/` 없이**)

---

# 12단계. Vercel 프론트 배포

## 12-1. [필수] 프로젝트 Import
1. Vercel 로그인
2. GitHub 저장소 Import
3. 이 레포는 루트 `vercel.json`이 client를 빌드하도록 되어 있음  
   → Root Directory는 보통 비움(저장소 루트)

## 12-2. [필수] Environment Variables

Settings → Environment Variables

| KEY | 값 |
|-----|-----|
| `VITE_API_URL` | Heroku 주소 (끝 `/` 없이) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned preset |
| `VITE_PORTONE_STORE_ID` | PortOne |
| `VITE_PORTONE_CHANNEL_KEY` | PortOne |

Environment: Production (필요 시 Preview도)

## 12-3. [필수] 재배포
환경변수를 바꾼 뒤에는 반드시 **Redeploy**  
(가능하면 Build Cache 없이)

## 12-4. [필수] Heroku CORS 다시 맞추기
Heroku Config Vars:

```text
CLIENT_ORIGIN=https://your-app.vercel.app
```

로컬도 허용하려면:

```text
CLIENT_ORIGIN=https://your-app.vercel.app,http://localhost:5173
```

---

# 13단계. 배포 후 최종 연결/점검

## 13-1. [필수] 점검 항목

- [ ] Vercel 사이트 접속
- [ ] 상품 목록 로딩
- [ ] 로그인/회원가입
- [ ] 장바구니
- [ ] 결제 (테스트)
- [ ] 관리자 이미지 업로드
- [ ] 주문 상태 변경

## 13-2. [권장] PortOne 콘솔
- 결제 허용 도메인에 Vercel 주소 등록

## 13-3. [권장] 자주 나는 배포 오류

| 증상 | 원인 | 해결 |
|------|------|------|
| Heroku “There’s nothing here, yet.” | Deploy Branch 안 함 / dyno OFF | Deploy + web ON |
| Resources에 process 없음 | 배포 안 됨 / Root Directory 잘못됨 | main 재배포, Root 비우기 |
| Vercel에서 API 실패 | `VITE_API_URL` 없음/오타 | 환경변수 수정 후 Redeploy |
| CORS 에러 | `CLIENT_ORIGIN` 불일치 | Vercel 주소 정확히 등록 (끝 `/` X) |
| 로그인은 된 것 같은데 장바구니 거부 | 토큰/상태 불일치 | 재로그인, Auth 동기화 |
| 이미지가 안 올라감 | Cloudinary env 누락 | Vercel env + preset 확인 |

---

# 14단계. 이 쇼핑몰의 “필수 요소” 한눈에 보기

## A. [필수] 기술 구성
- React(Vite) 프론트
- Express 백엔드
- MongoDB
- JWT 인증
- 장바구니/주문 API
- 배포(GitHub + Heroku + Vercel)

## B. [필수] 비즈니스 기능
- 회원가입/로그인
- 상품 조회
- 장바구니
- 주문/결제
- 관리자 상품/주문 관리

## C. [필수] 외부 서비스
- MongoDB Atlas
- Cloudinary
- PortOne

## D. [권장] 완성도를 올리는 것
- 카테고리 필터
- 다중 이미지/색상/사이즈
- 주문 상세 UI
- 배송 상태 관리
- 반응형 CSS

## E. [선택] 나중에 해도 되는 것
- 소셜 로그인
- 리뷰 실데이터
- 검색/정렬 고도화
- 이메일 알림
- 재고 차감 고도화

---

# 15단계. 학습 로드맵 (초보자용)

지금 만든 것을 기준으로, 다시 공부할 때 추천 순서:

1. **HTML/CSS/JS 기초**
2. **React 컴포넌트/상태/라우팅**
3. **Express 라우트/미들웨어**
4. **MongoDB CRUD**
5. **JWT 인증**
6. **REST API 설계**
7. **외부 API 연동 (이미지/결제)**
8. **환경변수와 배포**
9. **CORS, 도메인, 보안 기본**

---

# 16단계. 일상 개발 루틴 (배포 이후)

코드를 고칠 때마다:

```text
1. 로컬에서 수정/테스트
2. git add / commit
3. git push origin main
4. Heroku·Vercel 자동배포 확인
   (자동이 아니면 수동 Deploy/Redeploy)
5. 배포 사이트에서 재확인
```

### [주의]
- `client`의 `VITE_*`를 바꾸면 Vercel **Redeploy 필수**
- `server` env를 바꾸면 Heroku Config Vars 수정 후 앱 재시작/재배포

---

# 부록 A. 로컬 실행 요약

```bash
# 1) 의존성 (처음 한 번)
npm install --prefix server
npm install --prefix client

# 2) 환경변수 파일 준비
# server/.env
# client/.env

# 3) 실행 (터미널 2개)
npm run dev:server
npm run dev:client

# 4) 브라우저
# http://localhost:5173
```

---

# 부록 B. 배포 URL 예시 (형식만)

```text
GitHub:  https://github.com/사용자/저장소
Heroku:  https://앱이름.herokuapp.com
Vercel:  https://프로젝트.vercel.app
```

환경변수 연결:

```text
Vercel  VITE_API_URL   = Heroku 주소
Heroku  CLIENT_ORIGIN  = Vercel 주소
```

---

# 부록 C. 이 프로젝트를 끝까지 만든 의미

초보자가 이 프로젝트를 완성했다면, 아래를 **실제로 경험한 것**입니다.

1. 화면만 아니라 **서버와 DB가 있는 서비스**
2. 로그인/권한 같은 **인증 시스템**
3. 장바구니·주문 같은 **거래 흐름**
4. 결제·이미지 같은 **외부 서비스 연동**
5. GitHub/Heroku/Vercel로 **실제 인터넷에 공개**

즉, “토이 페이지”가 아니라  
**서비스 하나를 끝까지 배포해본 경험**입니다.

---

# 마무리 체크 (스스로 설명해볼 문장)

초보자가 아래를 설명해낼 수 있으면 충분히 잘 이해한 것입니다.

1. 프론트와 백엔드 역할 차이
2. 왜 MongoDB가 필요한지
3. JWT가 무엇인지
4. 왜 결제를 서버에서 검증하는지
5. 왜 Heroku를 먼저 배포하는지
6. `VITE_API_URL`과 `CLIENT_ORIGIN`이 서로 무엇을 가리키는지
7. `.env`를 Git에 올리면 안 되는 이유

---

작성 기준 프로젝트: `shop-demo` (SSEUNG)  
구성: React + Express + MongoDB + Cloudinary + PortOne  
배포: GitHub + Heroku + Vercel
