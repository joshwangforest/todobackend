const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정 - 개발 환경에서 모든 origin 허용
const corsOptions = {
  origin: true, // 모든 origin 허용 (개발 환경)
  credentials: true, // 쿠키 및 인증 정보 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Cache-Control',
    'Pragma',
    'User-Agent'
  ],
  exposedHeaders: [
    'Content-Range', 
    'X-Content-Range',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  optionsSuccessStatus: 200, // 일부 브라우저 지원
  preflightContinue: false
};

// 미들웨어 설정
app.use(cors(corsOptions));

// 모든 요청에 CORS 헤더 추가
app.use((req, res, next) => {
  // CORS 헤더 설정
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// 추가 CORS 헤더 설정
app.use((req, res, next) => {
  // Referrer Policy 설정
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // X-Frame-Options 설정
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options 설정
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection 설정
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy 설정
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-backend';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공!');
  console.log(`📊 데이터베이스: ${mongoose.connection.name}`);
  console.log(`🔗 연결 URI: ${MONGODB_URI}`);
})
.catch((error) => {
  console.error('❌ MongoDB 연결 실패:', error.message);
  process.exit(1);
});

// MongoDB 연결 상태 모니터링
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB 연결됨');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB 연결 오류:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB 연결 해제됨');
});

// 정적 파일 서빙
app.use(express.static('public'));

// API 라우트 연결
app.use('/api/todos', require('./routers/todos'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo Backend API가 정상적으로 작동 중입니다!',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? '연결됨' : '연결 안됨',
    timestamp: new Date().toISOString()
  });
});

// API 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? '연결됨' : '연결 안됨',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// MongoDB 상태 확인 라우트
app.get('/api/db-status', (req, res) => {
  const dbStatus = {
    connected: mongoose.connection.readyState === 1,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    readyState: mongoose.connection.readyState
  };
  
  res.json(dbStatus);
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ 
    error: '요청한 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl 
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : '서버 오류'
  });
});

// 서버 시작 - 모든 인터페이스에 바인딩
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 API 엔드포인트:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://127.0.0.1:${PORT}`);
  console.log(`🔍 헬스 체크: http://localhost:${PORT}/api/health`);
  console.log(`📊 DB 상태 확인: http://localhost:${PORT}/api/db-status`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 서버 종료 중...');
  await mongoose.connection.close();
  console.log('✅ MongoDB 연결 종료됨');
  process.exit(0);
});

module.exports = app;
