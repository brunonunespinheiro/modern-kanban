// Kanban App - Module Pattern
const KanbanApp = (() => {
    // State
    let tasks = JSON.parse(localStorage.getItem('kanban-tasks')) || {
        'todo': [],
        'in-progress': [],
        'review': [],
        'done': []
    };
    
    let draggedTask = null;
    let draggedColumn = null;
    
    // DOM Elements
    const clearTasksBtn = document.getElementById('clear-tasks-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskForm = document.getElementById('task-form');
    const taskLists = document.querySelectorAll('.task-list');
    const taskCounters = document.querySelectorAll('.task-count');
    
    // Bootstrap components
    const taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
    const toastEl = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastEl);
    const toastMessage = document.getElementById('toast-message');
    
    // Initialize
    const init = () => {
        // Render initial tasks
        renderAllTasks();
        
        // Setup Event Listeners
        clearTasksBtn.addEventListener('click', confirmClearTasks);
        saveTaskBtn.addEventListener('click', handleTaskSubmit);
        
        // Setup drag and drop
        setupDragAndDrop();
    };
    
    // Render tasks
    const renderAllTasks = () => {
        Object.keys(tasks).forEach(column => {
            renderTasks(column);
        });
        updateTaskCounters();
    };
    
    // Render tasks for a specific column
    const renderTasks = (column) => {
        const taskList = document.getElementById(column);
        taskList.innerHTML = '';
        
        tasks[column].forEach((task, index) => {
            const taskElement = createTaskElement(task, column, index);
            taskList.appendChild(taskElement);
        });
    };
    
    // Create task element
    const createTaskElement = (task, column, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'card kanban-card';
        taskElement.setAttribute('draggable', 'true');
        taskElement.setAttribute('data-index', index);
        taskElement.setAttribute('data-column', column);
        
        // Format tags for display
        const tagsHtml = task.tags.length > 0 
            ? task.tags.map(tag => `<span class="badge bg-light text-dark me-1 task-tag">${tag}</span>`).join('') 
            : '';
        
        // Add task content
        taskElement.innerHTML = `
            <div class="card-body">
                <span class="badge priority-${task.priority} card-priority">${task.priority}</span>
                <h5 class="card-title">${task.title}</h5>
                <p class="card-text text-muted small">${task.description || 'No description provided'}</p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="task-tags">
                        ${tagsHtml}
                    </div>
                    <div class="avatar rounded-circle text-center">
                        ${getInitials(task.assignee)}
                    </div>
                </div>
            </div>
        `;
        
        // Add drag event listeners
        taskElement.addEventListener('dragstart', handleDragStart);
        taskElement.addEventListener('dragend', handleDragEnd);
        
        return taskElement;
    };
    
    // Get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    };
    
    // Update task counters
    const updateTaskCounters = () => {
        taskCounters.forEach(counter => {
            const column = counter.closest('.kanban-column').getAttribute('data-column');
            counter.textContent = tasks[column].length;
        });
    };
    
    // Handle task form submit
    const handleTaskSubmit = (e) => {
        if (e) e.preventDefault();
        
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const assignee = document.getElementById('task-assignee').value;
        const tagsInput = document.getElementById('task-tags').value;
        
        if (!title) {
            alert('Title is required!');
            return;
        }
        
        // Process tags
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            priority,
            assignee,
            tags,
            createdAt: new Date().toISOString()
        };
        
        // Add task to todo column
        tasks.todo.unshift(newTask);
        
        // Save to local storage
        saveTasksToStorage();
        
        // Render todo column
        renderTasks('todo');
        updateTaskCounters();
        
        // Close modal and show toast
        taskModal.hide();
        document.getElementById('task-form').reset();
        
        showToast('Task added successfully!', 'success');
    };
    
    // Confirm clear all tasks
    const confirmClearTasks = () => {
        if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
            clearAllTasks();
        }
    };
    
    // Clear all tasks
    const clearAllTasks = () => {
        tasks = {
            'todo': [],
            'in-progress': [],
            'review': [],
            'done': []
        };
        
        saveTasksToStorage();
        renderAllTasks();
        showToast('All tasks cleared!', 'success');
    };
    
    // Show toast notification
    const showToast = (message, type = 'success') => {
        toastMessage.textContent = message;
        
        // Set toast class based on type
        toastEl.className = 'toast';
        if (type === 'success') {
            toastEl.classList.add('bg-success', 'text-white');
        } else if (type === 'error') {
            toastEl.classList.add('bg-danger', 'text-white');
        }
        
        toast.show();
    };
    
    // Setup drag and drop
    const setupDragAndDrop = () => {
        taskLists.forEach(list => {
            list.addEventListener('dragover', handleDragOver);
            list.addEventListener('drop', handleDrop);
        });
    };
    
    // Handle drag start
    const handleDragStart = (e) => {
        draggedTask = e.target;
        draggedColumn = draggedTask.getAttribute('data-column');
        const index = parseInt(draggedTask.getAttribute('data-index'));
        
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
        
        setTimeout(() => {
            draggedTask.classList.add('dragging');
        }, 0);
    };
    
    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        
        const targetColumn = e.currentTarget.id;
        const taskIndex = parseInt(draggedTask.getAttribute('data-index'));
        
        if (draggedColumn !== targetColumn) {
            // Move task to new column
            const task = tasks[draggedColumn][taskIndex];
            tasks[draggedColumn] = tasks[draggedColumn].filter((_, index) => index !== taskIndex);
            tasks[targetColumn].unshift(task);
            
            // Save and render
            saveTasksToStorage();
            renderTasks(draggedColumn);
            renderTasks(targetColumn);
            updateTaskCounters();
            
            showToast(`Task moved to ${formatColumnName(targetColumn)}!`, 'success');
        }
    };
    
    // Format column name
    const formatColumnName = (column) => {
        return column.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    // Handle drag end
    const handleDragEnd = () => {
        draggedTask.classList.remove('dragging');
        draggedTask = null;
        draggedColumn = null;
    };
    
    // Save tasks to local storage
    const saveTasksToStorage = () => {
        localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
    };
    
    // Load sample data for demo
    const loadSampleData = () => {
        if (Object.values(tasks).every(column => column.length === 0)) {
            tasks = {
                'todo': [
                    {
                        id: '1',
                        title: 'Research API integration',
                        description: 'Investigate the best approach for integrating with the payment processing API',
                        priority: 'high',
                        assignee: 'Alex Smith',
                        tags: ['Research', 'Backend'],
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: '2',
                        title: 'Design login form',
                        description: 'Create wireframes for the new login and signup forms',
                        priority: 'medium',
                        assignee: 'Jordan Lee',
                        tags: ['UI', 'Design'],
                        createdAt: new Date().toISOString()
                    }
                ],
                'in-progress': [
                    {
                        id: '3',
                        title: 'Implement authentication',
                        description: 'Set up JWT authentication for the API endpoints',
                        priority: 'high',
                        assignee: 'Taylor Kim',
                        tags: ['Backend', 'Security'],
                        createdAt: new Date().toISOString()
                    }
                ],
                'review': [
                    {
                        id: '4',
                        title: 'Homepage redesign',
                        description: 'Update the homepage with the new branding guidelines',
                        priority: 'medium',
                        assignee: 'Morgan Chen',
                        tags: ['UI', 'Frontend'],
                        createdAt: new Date().toISOString()
                    }
                ],
                'done': [
                    {
                        id: '5',
                        title: 'Setup development environment',
                        description: 'Configure Docker containers for local development',
                        priority: 'low',
                        assignee: 'Jamie Wilson',
                        tags: ['DevOps'],
                        createdAt: new Date().toISOString()
                    }
                ]
            };
            
            saveTasksToStorage();
        }
    };
    
    // Load sample data and initialize
    loadSampleData();
    
    return {
        init
    };
})();

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    KanbanApp.init();
});