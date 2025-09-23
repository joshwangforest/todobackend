const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// 모든 할 일 조회 (페이지네이션 지원)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // 필터링 옵션
    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // 정렬 옵션
    let sort = { createdAt: -1 };
    if (req.query.sortBy === 'priority') {
      sort = { priority: -1, dueDate: 1 };
    } else if (req.query.sortBy === 'dueDate') {
      sort = { dueDate: 1 };
    } else if (req.query.sortBy === 'title') {
      sort = { title: 1 };
    }
    
    const todos = await Todo.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Todo.countDocuments(filter);
    
    // 한국 시간으로 변환된 데이터 추가
    const todosWithKST = todos.map(todo => ({
      ...todo.toObject(),
      createdAtKST: new Date(todo.createdAt.getTime() + (9 * 60 * 60 * 1000)),
      updatedAtKST: new Date(todo.updatedAt.getTime() + (9 * 60 * 60 * 1000))
    }));
    
    res.json({
      success: true,
      data: todosWithKST,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '할 일 목록을 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

// 특정 할 일 조회
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할 일을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '할 일을 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

// 새 할 일 생성
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate, tags, category } = req.body;
    
    // 필수 필드 검증
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '할 일 제목은 필수입니다.'
      });
    }
    
    const todo = new Todo({
      title: title.trim(),
      description: description?.trim(),
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags || [],
      category: category?.trim()
    });
    
    await todo.save();
    
    // 한국 시간으로 변환된 데이터 추가
    const todoWithKST = {
      ...todo.toObject(),
      createdAtKST: new Date(todo.createdAt.getTime() + (9 * 60 * 60 * 1000)),
      updatedAtKST: new Date(todo.updatedAt.getTime() + (9 * 60 * 60 * 1000))
    };
    
    res.status(201).json({
      success: true,
      message: '할 일이 성공적으로 생성되었습니다.',
      data: todoWithKST
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '할 일 생성에 실패했습니다.',
      error: error.message
    });
  }
});

// 할 일 수정
router.put('/:id', async (req, res) => {
  try {
    const { title, description, completed, priority, dueDate, tags, category } = req.body;
    
    const updateData = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category?.trim();
    
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할 일을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '할 일이 성공적으로 수정되었습니다.',
      data: todo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '할 일 수정에 실패했습니다.',
      error: error.message
    });
  }
});

// 할 일 삭제
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할 일을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '할 일이 성공적으로 삭제되었습니다.',
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '할 일 삭제에 실패했습니다.',
      error: error.message
    });
  }
});

// 할 일 완료/미완료 토글
router.patch('/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할 일을 찾을 수 없습니다.'
      });
    }
    
    todo.completed = !todo.completed;
    await todo.save();
    
    res.json({
      success: true,
      message: `할 일이 ${todo.completed ? '완료' : '미완료'}로 변경되었습니다.`,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '할 일 상태 변경에 실패했습니다.',
      error: error.message
    });
  }
});

// 완료된 할 일 조회
router.get('/completed/all', async (req, res) => {
  try {
    const todos = await Todo.findCompleted();
    
    res.json({
      success: true,
      data: todos,
      count: todos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '완료된 할 일을 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

// 미완료 할 일 조회
router.get('/pending/all', async (req, res) => {
  try {
    const todos = await Todo.findPending();
    
    res.json({
      success: true,
      data: todos,
      count: todos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '미완료 할 일을 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

// 마감 임박 할 일 조회
router.get('/urgent/all', async (req, res) => {
  try {
    const todos = await Todo.findUrgent();
    
    res.json({
      success: true,
      data: todos,
      count: todos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '마감 임박 할 일을 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

// 카테고리별 할 일 조회
router.get('/category/:category', async (req, res) => {
  try {
    const todos = await Todo.findByCategory(req.params.category);
    
    res.json({
      success: true,
      data: todos,
      count: todos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '카테고리별 할 일을 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

// 우선순위별 할 일 조회
router.get('/priority/:priority', async (req, res) => {
  try {
    const priority = req.params.priority;
    
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 우선순위입니다. (low, medium, high 중 하나)'
      });
    }
    
    const todos = await Todo.findByPriority(priority);
    
    res.json({
      success: true,
      data: todos,
      count: todos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '우선순위별 할 일을 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

// 텍스트 검색
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const todos = await Todo.search(query);
    
    res.json({
      success: true,
      data: todos,
      count: todos.length,
      query: query
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '검색에 실패했습니다.',
      error: error.message
    });
  }
});

// 통계 정보 조회
router.get('/stats/overview', async (req, res) => {
  try {
    const total = await Todo.countDocuments();
    const completed = await Todo.countDocuments({ completed: true });
    const pending = await Todo.countDocuments({ completed: false });
    const urgent = await Todo.findUrgent();
    
    // 우선순위별 통계
    const priorityStats = await Todo.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 카테고리별 통계
    const categoryStats = await Todo.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        completed,
        pending,
        urgent: urgent.length,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        priorityStats,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '통계 정보를 가져오는데 실패했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
