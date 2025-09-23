const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static('public'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo Backend API가 정상적으로 작동 중입니다!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use('*', (req, res) => {
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

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 API 엔드포인트: http://localhost:${PORT}`);
  console.log(`🔍 헬스 체크: http://localhost:${PORT}/api/health`);
});

module.exports = app;
