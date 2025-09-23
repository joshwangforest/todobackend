const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '할 일 제목은 필수입니다.'],
    trim: true,
    maxlength: [200, '제목은 200자를 초과할 수 없습니다.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '설명은 1000자를 초과할 수 없습니다.']
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: '마감일은 현재 시간보다 미래여야 합니다.'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '태그는 50자를 초과할 수 없습니다.']
  }],
  category: {
    type: String,
    trim: true,
    maxlength: [100, '카테고리는 100자를 초과할 수 없습니다.']
  }
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 마감일까지 남은 시간
todoSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) return '마감됨';
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  return `${hours}시간 남음`;
});

// 가상 필드: 마감 임박 여부
todoSchema.virtual('isUrgent').get(function() {
  if (!this.dueDate || this.completed) return false;
  
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();
  const hoursRemaining = timeDiff / (1000 * 60 * 60);
  
  return hoursRemaining <= 24; // 24시간 이내
});

// 인덱스 설정
todoSchema.index({ title: 'text', description: 'text' }); // 텍스트 검색용
todoSchema.index({ completed: 1, createdAt: -1 }); // 완료 상태와 생성일 기준 정렬
todoSchema.index({ priority: 1, dueDate: 1 }); // 우선순위와 마감일 기준 정렬
todoSchema.index({ category: 1 }); // 카테고리별 검색

// 인스턴스 메서드: 할 일 완료 처리
todoSchema.methods.markAsCompleted = function() {
  this.completed = true;
  return this.save();
};

// 인스턴스 메서드: 할 일 미완료 처리
todoSchema.methods.markAsIncomplete = function() {
  this.completed = false;
  return this.save();
};

// 정적 메서드: 완료된 할 일 조회
todoSchema.statics.findCompleted = function() {
  return this.find({ completed: true }).sort({ updatedAt: -1 });
};

// 정적 메서드: 미완료 할 일 조회
todoSchema.statics.findPending = function() {
  return this.find({ completed: false }).sort({ priority: -1, dueDate: 1 });
};

// 정적 메서드: 마감 임박 할 일 조회
todoSchema.statics.findUrgent = function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    completed: false,
    dueDate: { $lte: tomorrow, $gte: new Date() }
  }).sort({ dueDate: 1 });
};

// 정적 메서드: 카테고리별 할 일 조회
todoSchema.statics.findByCategory = function(category) {
  return this.find({ category: category }).sort({ createdAt: -1 });
};

// 정적 메서드: 우선순위별 할 일 조회
todoSchema.statics.findByPriority = function(priority) {
  return this.find({ priority: priority }).sort({ createdAt: -1 });
};

// 정적 메서드: 텍스트 검색
todoSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

// 한국 시간 변환 함수
const getKoreanTime = () => {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreanTime;
};

// 가상 필드: 한국 시간으로 변환된 생성일
todoSchema.virtual('createdAtKST').get(function() {
  if (!this.createdAt) return null;
  return new Date(this.createdAt.getTime() + (9 * 60 * 60 * 1000));
});

// 가상 필드: 한국 시간으로 변환된 수정일
todoSchema.virtual('updatedAtKST').get(function() {
  if (!this.updatedAt) return null;
  return new Date(this.updatedAt.getTime() + (9 * 60 * 60 * 1000));
});

// 저장 전 미들웨어: 한국 시간으로 변환
todoSchema.pre('save', function(next) {
  if (this.isNew) {
    this.createdAtKST = getKoreanTime();
  }
  this.updatedAtKST = getKoreanTime();
  next();
});

module.exports = mongoose.model('Todo', todoSchema);
