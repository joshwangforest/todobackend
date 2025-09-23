# Todo Backend API

Node.js와 MongoDB Atlas를 사용한 Todo 관리 백엔드 API

## 기능

- ✅ Todo CRUD 작업 (생성, 조회, 수정, 삭제)
- ✅ MongoDB Atlas 클라우드 데이터베이스 연결
- ✅ CORS 설정으로 프론트엔드 통합 지원
- ✅ 한국 시간(KST) 지원
- ✅ 우선순위, 카테고리, 태그 관리
- ✅ 마감일 및 완료 상태 관리
- ✅ 텍스트 검색 기능

## 기술 스택

- **Node.js**: JavaScript 런타임
- **Express**: 웹 프레임워크
- **MongoDB Atlas**: 클라우드 데이터베이스
- **Mongoose**: MongoDB ODM
- **CORS**: Cross-Origin Resource Sharing
- **dotenv**: 환경변수 관리

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/joshwangforest/todobackend.git
cd todobackend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# 서버 설정
PORT=5000
NODE_ENV=development

# MongoDB Atlas 연결 설정
MONGODB_URI=your_mongodb_atlas_connection_string
```

### 4. 서버 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

## API 엔드포인트

### 기본 정보
- **Base URL**: `http://localhost:5000`
- **Content-Type**: `application/json`

### Todo 관리

#### 모든 할 일 조회
```
GET /api/todos
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `completed`: 완료 상태 필터 (true/false)
- `priority`: 우선순위 필터 (low/medium/high)
- `category`: 카테고리 필터
- `sortBy`: 정렬 기준 (priority/dueDate/title)

#### 특정 할 일 조회
```
GET /api/todos/:id
```

#### 새 할 일 생성
```
POST /api/todos
```

**요청 본문:**
```json
{
  "title": "할 일 제목",
  "description": "할 일 설명",
  "priority": "medium",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "tags": ["태그1", "태그2"],
  "category": "카테고리"
}
```

#### 할 일 수정
```
PUT /api/todos/:id
```

#### 할 일 삭제
```
DELETE /api/todos/:id
```

#### 완료/미완료 토글
```
PATCH /api/todos/:id/toggle
```

### 특수 기능

#### 완료된 할 일 조회
```
GET /api/todos/completed/all
```

#### 미완료 할 일 조회
```
GET /api/todos/pending/all
```

#### 마감 임박 할 일 조회
```
GET /api/todos/urgent/all
```

#### 카테고리별 할 일 조회
```
GET /api/todos/category/:category
```

#### 우선순위별 할 일 조회
```
GET /api/todos/priority/:priority
```

#### 텍스트 검색
```
GET /api/todos/search/:query
```

#### 통계 정보 조회
```
GET /api/todos/stats/overview
```

### 시스템 정보

#### 서버 상태 확인
```
GET /api/health
```

#### 데이터베이스 상태 확인
```
GET /api/db-status
```

## 데이터 모델

### Todo 스키마
```javascript
{
  title: String,          // 할 일 제목 (필수)
  description: String,    // 할 일 설명
  completed: Boolean,     // 완료 여부 (기본값: false)
  priority: String,       // 우선순위 (low/medium/high)
  dueDate: Date,         // 마감일
  tags: [String],        // 태그 배열
  category: String,      // 카테고리
  createdAt: Date,       // 생성일 (자동)
  updatedAt: Date,       // 수정일 (자동)
  createdAtKST: Date,    // 한국 시간 생성일
  updatedAtKST: Date     // 한국 시간 수정일
}
```

## 프로젝트 구조

```
todo-backend/
├── index.js              # 메인 서버 파일
├── models/
│   └── Todo.js          # Todo 데이터 모델
├── routers/
│   └── todos.js         # Todo API 라우트
├── public/              # 정적 파일
├── .env                 # 환경변수 (Git 무시)
├── .gitignore          # Git 무시 파일
├── package.json        # 프로젝트 설정
└── README.md           # 프로젝트 문서
```

## 개발자 정보

- GitHub: [joshwangforest](https://github.com/joshwangforest)
- Repository: [todobackend](https://github.com/joshwangforest/todobackend)

## 라이선스

ISC
