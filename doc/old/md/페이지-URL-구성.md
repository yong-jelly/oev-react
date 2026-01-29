# 페이지 URL 구성

## 개요

이 문서는 트럭커 앱의 전체 URL 라우팅 구조를 정리합니다.

## URL 구조 테이블

### 인증/온보딩

| URL | 페이지 | 설명 | 접근 권한 |
|-----|--------|------|-----------|
| `/login` | LoginPage | 로그인 | 비인증 |
| `/onboarding` | OnboardingPage | 온보딩/가입 | 비인증 |

### 메인 페이지

| URL | 페이지 | 설명 | 접근 권한 |
|-----|--------|------|-----------|
| `/` | HomePage | 홈 (주문 목록, 활성 운행) | 인증 |
| `/leaderboard` | LeaderboardPage | 리더보드 (랭킹) | 인증 |

### 프로필/설정

| URL | 페이지 | 설명 | 접근 권한 |
|-----|--------|------|-----------|
| `/profile` | ProfilePage | 내 프로필 (기본 탭) | 인증 |
| `/profile/:tab` | ProfilePage | 내 프로필 (특정 탭) | 인증 |
| `/profile/edit` | ProfileEditPage | 프로필 수정 | 인증 |
| `/garage` | GaragePage | 차고 (장비 관리) | 인증 |
| `/transactions` | TransactionHistoryPage | 거래 내역 | 인증 |

### 운행 관련

| URL | 페이지 | 설명 | 접근 권한 |
|-----|--------|------|-----------|
| `/order/:orderId` | OrderDetailPage | 주문 상세 (운행 시작 전) | 인증 |
| `/run/:runId` | ActiveRunPage | 내 운행 (인터랙션 가능) | 인증, 본인만 |
| `/settlement` | SettlementPage | 운행 완료 정산 | 인증 |

### 기타

| URL | 페이지 | 설명 | 접근 권한 |
|-----|--------|------|-----------|
| `/hire` | HireDriverPage | 드라이버 고용 | 인증 |
| `/help` | HelpPage | 도움말 | 인증 |
| `/super/admin/setting` | AdminSettingPage | 관리자 설정 | 관리자 |

### 공개 페이지 (`/p/*`)

| URL | 페이지 | 설명 | 접근 권한 |
|-----|--------|------|-----------|
| `/p/status/:id` | PublicProfilePage | 공개 프로필 (유저/봇) | 공개 |
| `/p/run/:runId` | PublicRunPage | 공개 운행 조회 (읽기 전용) | 공개 |

## URL 설계 원칙

### 1. 공개 vs 비공개 구분
- `/p/*` 접두사: 공개 페이지 (Public)
- 그 외: 인증 필요 페이지

### 2. 리소스 기반 URL
- `/order/:orderId` - 주문 리소스
- `/run/:runId` - 운행 리소스
- `/profile/:tab` - 프로필 + 탭 파라미터

### 3. 읽기 전용 vs 인터랙션 구분

| 구분 | URL | 특징 |
|------|-----|------|
| 본인 운행 | `/run/:runId` | 가속, 연료 보충, 도착 등 조작 가능 |
| 공개 운행 | `/p/run/:runId` | 지도, 진행률만 조회 (읽기 전용) |

## 파일 구조

```
src/pages/
├── Home.tsx              # /
├── Login.tsx             # /login
├── Onboarding.tsx        # /onboarding
├── Profile.tsx           # /profile, /profile/:tab
├── ProfileEdit.tsx       # /profile/edit
├── OrderDetail.tsx       # /order/:orderId
├── ActiveRun.tsx         # /run/:runId (본인 운행)
├── Settlement.tsx        # /settlement
├── Garage.tsx            # /garage
├── Leaderboard.tsx       # /leaderboard
├── TransactionHistory.tsx # /transactions
├── HireDriver.tsx        # /hire
├── Help.tsx              # /help
├── AdminSetting.tsx      # /super/admin/setting
├── PublicProfile.tsx     # /p/status/:id
└── PublicRun.tsx         # /p/run/:runId (공개 운행)
```

## 라우트 정의 위치

`src/app/App.tsx`에서 모든 라우트를 정의합니다.
