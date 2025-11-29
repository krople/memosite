# Phyiv Memo 📝

PC와 모바일 간 간단한 텍스트 공유를 위한 웹 애플리케이션입니다. 로그인 없이 키만으로 메모를 공유할 수 있습니다.

**🚀 서버 없이 Supabase만으로 작동하는 완전한 서버리스 앱!**

## ✨ 주요 기능

- 🔑 **키 기반 공유**: 4자 이상의 간단한 키로 메모 공유
- ⏱️ **유연한 유효시간**: 5분부터 24시간까지 설정 가능 (기본 30분)
- 💾 **실시간 자동 저장**: 0.5초 디바운스로 자동 저장
- 🗑️ **자동 삭제**: 만료된 메모는 5분마다 자동으로 삭제 (pg_cron)
- 🔍 **강력한 검색**: 실시간 하이라이트 및 키보드 탐색 (↓↑)
- 🌙 **다크모드**: 라이트/다크 테마 지원 (localStorage 저장)
- 📱 **모바일 최적화**: 완벽한 반응형 디자인
- 📊 **글자 수 카운터**: 공백 포함/제외 구분 표시
- 🏠 **로컬 모드**: 키 없이도 로컬 전용으로 사용 가능
- ☁️ **완전 서버리스**: Node.js 서버 불필요, 정적 호스팅만으로 작동
- 🔒 **키 삭제**: 사용 중인 키 즉시 삭제 가능

## 🚀 빠른 시작

### 1단계: Supabase 설정

1. [Supabase](https://supabase.com)에서 **무료** 프로젝트 생성
2. **SQL Editor**에서 `supabase-setup.sql` 파일 실행
   - 테이블 생성
   - 인덱스 생성  
   - **자동 삭제 스케줄 설정** (5분마다)
3. **Settings > API**에서 정보 확인:
   - `Project URL`: `https://xxxxx.supabase.co`
   - `anon public key`: `eyJhbGc...`

### 2단계: Supabase 정보 입력

#### 방법 A: 파일에 직접 입력 (권장)
`app-supabase.js` 파일 상단 수정:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

#### 방법 B: 첫 실행 시 입력
- 파일에 설정이 없으면 프롬프트 자동 표시
- localStorage에 저장되어 재입력 불필요

### 3단계: 배포

#### GitHub Pages (무료, 가장 간단)
1. 이 저장소 Fork
2. **Settings > Pages > Source**: `main` branch 선택
3. 완료! `https://your-username.github.io/memosite` 접속

#### Vercel (무료, 빠름)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lhwqaz-hue/memosite)

1. 위 버튼 클릭 또는 [Vercel.com](https://vercel.com) 접속
2. GitHub 저장소 연결
3. **Deploy** 클릭 (환경 변수 설정 불필요!)
4. 완료! 제공된 URL로 접속

#### Netlify (무료)
1. [Netlify.com](https://netlify.com) 접속
2. Drag & Drop으로 폴더 업로드
3. 완료!

#### Cloudflare Pages (무료)
1. GitHub 연동
2. 자동 배포
3. 완료!

## 📖 사용 방법

### 메모 생성
1. 사이트 접속
2. **"🔑 새 키 설정"** 클릭
3. 4자 이상의 키 입력 (예: `mykey`)
4. 메모 작성 → 자동 저장됨

### 메모 공유
- **방법 1**: 키만 공유 (상대방이 같은 키로 접속)
- **방법 2**: URL로 공유 `https://your-site.com?p=mykey`

### 유효시간 설정
- 타이머 버튼(⏱️) 클릭
- 5분, 10분, 30분, 1시간, 3시간, 6시간, 12시간, 24시간 선택
- 만료 시 자동 삭제됨

### 검색 기능
- 검색창에 텍스트 입력
- `↓` `↑` 키로 검색 결과 이동
- 실시간 하이라이트 표시

### 테마 전환
- 우측 상단 🌙/☀️ 버튼 클릭
- 설정이 localStorage에 저장됨

### 로컬 모드
- 키 설정 없이 사용
- 브라우저 localStorage에만 저장
- 다른 기기와 공유 불가

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: Supabase (PostgreSQL)
- **CDN**: Supabase JS Library (2.x)
- **Hosting**: 정적 호스팅 (GitHub Pages, Vercel, Netlify 등)
- **Auto-deletion**: pg_cron (Supabase 기본 제공)

## 📁 프로젝트 구조

```
memosite/
├── index.html              # 메인 HTML (Supabase CDN 포함)
├── styles.css              # 스타일시트 (라이트/다크 테마)
├── app-supabase.js         # 클라이언트 로직 (Supabase 직접 연결)
├── supabase-setup.sql      # DB 초기 설정 SQL
├── SUPABASE_AUTO_DELETE.md # 자동 삭제 설정 가이드
├── README.md               # 이 파일
├── .gitignore              # Git 제외 파일
├── package.json            # (선택) 로컬 개발용
└── server.js               # (사용 안 함) 레거시 서버 파일
```

## 🗄️ 데이터베이스 구조

### `memos` 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 기본 키 |
| password | VARCHAR(255) | 메모 키 (고유) |
| content | TEXT | 메모 내용 |
| duration_minutes | INTEGER | 유효 시간 (분) |
| created_at | TIMESTAMPTZ | 생성 시간 |
| last_updated | TIMESTAMPTZ | 마지막 업데이트 |
| expires_at | TIMESTAMPTZ | 만료 시간 |

### 자동 삭제 함수
- **함수명**: `delete_expired_memos()`
- **스케줄**: 5분마다 (`*/5 * * * *`)
- **동작**: `expires_at < NOW()` 인 메모 삭제
- **반환**: 삭제된 메모 개수

## ⚙️ 로컬 개발

```bash
# 저장소 클론
git clone https://github.com/lhwqaz-hue/memosite.git
cd memosite

# index.html을 브라우저에서 열기
# 또는 Live Server 등 사용
open index.html  # macOS
start index.html # Windows
```

첫 실행 시 Supabase URL과 Key를 입력하면 localStorage에 저장됩니다.

## 🔐 보안 고려사항

- **Supabase Anon Key**: 클라이언트에 노출되어도 안전 (공개 키)
- **RLS 비활성화**: 간단한 앱이므로 비활성화됨 (키를 아는 사람만 접근)
- **데이터 암호화**: Supabase가 자동으로 전송 중 암호화 (HTTPS)
- **자동 만료**: 설정된 시간 후 자동 삭제로 데이터 최소화
- **민감한 정보**: 비밀번호, 개인정보 등은 저장하지 마세요

## ⚠️ 주의사항

- 메모는 설정한 시간 후 **자동으로 삭제**됩니다
- Supabase **무료 플랜 제한**:
  - 500MB 데이터베이스
  - 월 500MB 전송량
  - 50,000 월간 활성 사용자
  - 2GB 파일 저장소
- **키를 아는 사람은 누구나 접근 가능**합니다
- **중요한 데이터는 저장하지 마세요**

## 🐛 문제 해결

### Supabase 연결 오류
1. URL과 Key가 정확한지 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 브라우저 콘솔(F12)에서 오류 확인

### 자동 삭제가 작동하지 않음
```sql
-- 스케줄 확인
SELECT * FROM cron.job;

-- 실행 로그 확인
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC LIMIT 10;

-- 수동 실행 테스트
SELECT delete_expired_memos();
```

### localStorage 초기화
```javascript
// 브라우저 콘솔(F12)에서 실행
localStorage.clear();
location.reload();
```

## 📚 추가 문서

- [Supabase 자동 삭제 가이드](SUPABASE_AUTO_DELETE.md)
- [Supabase 공식 문서](https://supabase.com/docs)
- [pg_cron 문서](https://github.com/citusdata/pg_cron)

## 🤝 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 👨‍💻 제작자

**lhwqaz-hue / krople** - [GitHub](https://github.com/lhwqaz-hue)

프로젝트가 도움이 되셨다면 ⭐️ Star를 눌러주세요!

---

**Made with ❤️ using Supabase**

## 빠른 시작 (정적 호스팅)

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성 (무료)
2. SQL Editor에서 `supabase-setup.sql` 파일의 내용 실행
   - 테이블 생성
   - 인덱스 생성
   - **자동 삭제 스케줄 설정 (5분마다 만료된 메모 삭제)**
3. Settings > API에서 다음 정보 확인:
   - `Project URL` (예: https://xxxxx.supabase.co)
   - `anon public` key

💡 자동 삭제 설정에 대한 자세한 내용은 `SUPABASE_AUTO_DELETE.md` 파일을 참조하세요.

### 2. Supabase 정보 입력 (3가지 방법)

#### 방법 1: 파일에 직접 입력 (권장 - 개인 사용)
`app-supabase.js` 파일 상단의 `SUPABASE_CONFIG` 수정:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

#### 방법 2: 첫 실행 시 프롬프트로 입력
- 파일에 설정이 없으면 자동으로 프롬프트 표시
- localStorage에 저장되어 다음부터는 자동 로드

#### 방법 3: 브라우저 콘솔에서 설정
```javascript
localStorage.setItem('supabaseUrl', 'https://xxxxx.supabase.co');
localStorage.setItem('supabaseKey', 'your_anon_key');
```

### 3. 배포 방법

#### GitHub Pages (무료, 가장 간단)
1. 이 저장소를 Fork
2. Settings > Pages에서 Source를 `main` branch로 설정
3. 완료! `https://your-username.github.io/memosite`로 접속
4. 첫 실행 시 Supabase URL과 Key를 입력하면 localStorage에 저장됨

#### Vercel (무료, 권장)
1. [Vercel](https://vercel.com) 접속
2. GitHub 저장소 연결
3. Deploy 클릭
4. 완료! 제공된 URL로 접속

#### Netlify (무료)
1. [Netlify](https://netlify.com) 접속
2. Drag & Drop으로 폴더 업로드 (index.html, styles.css, app-supabase.js)
3. 완료!

**서버가 필요 없습니다!** 정적 파일만으로 작동합니다.

### 로컬 실행

단순히 `index.html` 파일을 브라우저에서 열면 됩니다!

```bash
# 저장소 클론
git clone https://github.com/lhwqaz-hue/memosite.git
cd memosite

# 브라우저에서 index.html 열기
# 또는 Live Server 등 사용
```

첫 실행 시 Supabase URL과 Key를 입력하면 localStorage에 자동 저장됩니다.

## 기술 스택

### 데이터베이스
- **Supabase**: PostgreSQL 기반 실시간 데이터베이스 (무료)
- **Row Level Security**: 보안 설정 (비활성화 - 간단한 앱)

### 프론트엔드
- **Vanilla JavaScript**: 프레임워크 없는 순수 JS
- **HTML5 & CSS3**: 표준 웹 기술
- **CSS Variables**: 다이내믹 테마
- **Responsive Design**: 모바일 우선 디자인

## 프로젝트 구조

```
memosite/
├── server.js           # Express 서버 및 API 엔드포인트
├── package.json        # 프로젝트 메타데이터 및 의존성
├── public/             # 정적 파일
│   ├── index.html      # 메인 HTML
│   ├── styles.css      # 스타일시트 (라이트/다크 테마)
│   └── app.js          # 클라이언트 로직
└── README.md           # 프로젝트 문서
```

## API 엔드포인트

### `POST /api/check-password`
키 사용 가능 여부 확인
```json
{
  "password": "키값"
}
```

### `POST /api/memo`
## 사용 방법 (상세)

### 초기 설정
1. 웹사이트 첫 접속 시 Supabase URL과 Key 입력 프롬프트 표시
2. Supabase 정보는 브라우저 localStorage에 안전하게 저장
3. 이후 자동으로 연결됨

### 메모 생성 및 공유
1. **키 설정**: 4자 이상의 고유한 키 생성
2. **메모 작성**: 자동 저장 (0.5초마다)
3. **공유**: URL에 `?p=키값` 추가하여 공유
   - 예: `https://your-site.com?p=mykey`

### 로컬 모드
- 키 설정 없이도 사용 가능
- 데이터는 브라우저 localStorage에만 저장
- 다른 기기와 공유 불가

## 데이터베이스 구조

### memos 테이블
```sql
- id: SERIAL PRIMARY KEY
- password: VARCHAR(255) UNIQUE
- content: TEXT
- duration_minutes: INTEGER (기본값: 30)
- created_at: TIMESTAMPTZ
- last_updated: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ
```

## 주의사항

⚠️ **중요**: 

- **민감한 정보는 저장하지 마세요**
- 메모는 설정한 시간 후 자동 삭제됩니다
- Supabase 무료 플랜 제한:
  - 500MB 데이터베이스
  - 월 500MB 전송량
  - 50,000 월간 활성 사용자
- Row Level Security가 비활성화되어 있어 키를 아는 사람은 누구나 접근 가능

## 배포

완전히 정적 사이트이므로 어디든 배포 가능:

### GitHub Pages (무료)
```bash
Settings > Pages > Source: main branch
```

### Vercel (무료)
```bash
vercel --prod
```

### Netlify (무료)
Drag & Drop으로 배포 가능

### Cloudflare Pages (무료)
GitHub 연동 자동 배포
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 제작자

**lhwqaz-hue** - [GitHub](https://github.com/lhwqaz-hue)

## 감사

- Express.js 팀
- Node.js 커뮤니티
- 모든 기여자들
