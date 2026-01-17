/**
 * 任务管理器 - 核心功能脚本
 * 
 * 功能说明：
 * - 管理任务的增删改查（CRUD）操作
 * - 数据持久化存储在浏览器localStorage中
 * - 支持任务搜索和多种过滤视图
 * - 实时更新统计信息
 * - 提供用户友好的交互体验
 */

// DOM元素选择器缓存
const dom = {
    taskList: document.getElementById('task-list'),
    searchInput: document.getElementById('search-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    totalCount: document.getElementById('total-count'),
    completedPercentage: document.getElementById('completed-percentage')
};

// 任务数据模型
let tasks = [];

// 应用初始化
function init() {
    loadTasks();
    renderTasks();
    setupEventListeners();
    updateStats();
}

// 从localStorage加载任务数据
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            // 确保所有任务都有必要的属性
            tasks = tasks.map(task => ({
                id: task.id,
                title: task.title || '未命名任务',
                description: task.description || '',
                dueDate: task.dueDate || '',
                completed: Boolean(task.completed),
                createdAt: task.createdAt || new Date().toISOString()
            }));
        }
    } catch (error) {
        console.error('加载任务数据失败:', error);
        tasks = [];
    }
}

// 保存任务数据到localStorage
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('保存任务数据失败:', error);
        alert('存储空间已满，无法保存更多任务！');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索功能
    dom.searchInput.addEventListener('input', handleSearch);
    
    // 添加新任务按钮
    dom.addTaskBtn.addEventListener('click', showAddTaskModal);
    
    // 过滤按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新活动状态
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // 重新渲染任务列表
            renderTasks();
        });
    });
}

// 处理搜索输入
function handleSearch() {
    const keyword = dom.searchInput.value.trim().toLowerCase();
    renderTasks(keyword);
}

// 显示添加/编辑任务模态框
function showAddTaskModal(task = null) {
    // 创建半透明背景层
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // 模态框标题
    const title = document.createElement('h2');
    title.textContent = task ? '编辑任务' : '添加新任务';
    modal.appendChild(title);
    
    // 表单内容
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label for="task-title">任务标题 *</label>
            <input type="text" id="task-title" value="${task ? task.title : ''}" required>
        </div>
        <div class="form-group">
            <label for="task-description">任务描述</label>
            <textarea id="task-description" rows="3">${task ? task.description : ''}</textarea>
        </div>
        <div class="form-group">
            <label for="task-due-date">截止日期</label>
            <input type="date" id="task-due-date" value="${task ? task.dueDate : ''}">
        </div>
    `;
    
    // 按钮区域
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = '保存';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = '取消';
    
    buttonGroup.appendChild(saveBtn);
    buttonGroup.appendChild(cancelBtn);
    form.appendChild(buttonGroup);
    modal.appendChild(form);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // 自动聚焦到标题输入框
    document.getElementById('task-title').focus();
    
    // 表单提交事件
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const dueDate = document.getElementById('task-due-date').value;
        
        if (task) {
            // 编辑现有任务
            task.title = title;
            task.description = description;
            task.dueDate = dueDate;
            task.updatedAt = new Date().toISOString();
        } else {
            // 添加新任务
            const newTask = {
                id: Date.now(), // 使用时间戳作为简单ID
                title,
                description,
                dueDate,
                completed: false,
                createdAt: new Date().toISOString()
            };
            tasks.unshift(newTask); // 新任务添加到顶部
        }
        
        saveTasks();
        renderTasks();
        updateStats();
        
        // 关闭模态框
        document.body.removeChild(backdrop);
    });
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(backdrop);
    });
    
    // 点击背景关闭模态框
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    });
}

// 删除任务
function deleteTask(id) {
    if (confirm('确定要删除这个任务吗？')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 切换任务完成状态
function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 获取当前激活的过滤器
function getActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

// 渲染任务列表
function renderTasks(searchKeyword = '') {
    // 清空当前列表
    dom.taskList.innerHTML = '';
    
    // 获取当前过滤器
    const filter = getActiveFilter();
    
    // 过滤任务
    let filteredTasks = tasks;
    
    // 应用搜索过滤
    if (searchKeyword) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchKeyword) || 
            task.description.toLowerCase().includes(searchKeyword)
        );
    }
    
    // 应用状态过滤
    switch (filter) {
        case 'pending':
            filteredTasks = filteredTasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed);
            break;
        case 'today':
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = filteredTasks.filter(task => task.dueDate === today);
            break;
        case 'this-week':
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const due = new Date(task.dueDate);
                const today = new Date();
                const diffTime = due.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7;
            });
            break;
    }
    
    // 按创建时间倒序排列
    filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 渲染任务项
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = '没有找到匹配的任务';
        dom.taskList.appendChild(emptyState);
    } else {
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            dom.taskList.appendChild(taskElement);
        });
    }
}

// 创建单个任务元素
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = task.completed ? 'task-item task-completed' : 'task-item';
    
    // 构建HTML内容
    let html = `
        <div class="task-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
        </div>
        <div class="task-content">
            <div class="task-title">${task.title}</div>
    `;
    
    // 添加截止日期
    if (task.dueDate) {
        const dateObj = new Date(task.dueDate);
        const formattedDate = dateObj.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
        html += `<div class="task-due-date">截止日期: ${formattedDate}</div>`;
    }
    
    // 添加描述
    if (task.description) {
        html += `<div class="task-description">${task.description}</div>`;
    }
    
    html += `</div>
        <div class="task-actions">
            <button class="task-btn edit-btn">编辑</button>
            <button class="task-btn delete-btn">删除</button>
        </div>`;
    
    taskItem.innerHTML = html;
    
    // 添加事件监听器
    // 复选框点击
    const checkbox = taskItem.querySelector('.task-checkbox input');
    checkbox.addEventListener('change', () => {
        toggleTaskStatus(task.id);
    });
    
    // 编辑按钮
    const editBtn = taskItem.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAddTaskModal(task);
    });
    
    // 删除按钮
    const deleteBtn = taskItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    // 点击整个任务项也切换完成状态
    taskItem.addEventListener('click', (e) => {
        // 如果点击的是按钮或输入框，则不触发
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
            return;
        }
        toggleTaskStatus(task.id);
    });
    
    return taskItem;
}

// 更新统计信息
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    dom.totalCount.textContent = total;
    dom.completedPercentage.textContent = `${percentage}%`;
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', init);
