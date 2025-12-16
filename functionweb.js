document.addEventListener('DOMContentLoaded', () => {

    // --- Core Elements ---
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const mainContent = document.getElementById('mainContentArea');
    const dashboardTrigger = document.querySelector('.dashboard-trigger');
    const dashboardWidgets = document.getElementById('dashboardWidgets');

    // --- Dashboard Widget Elements ---
    const taskPercentDisplay = document.getElementById('taskPercentDisplay');
    const taskProgressBar = document.getElementById('taskProgressBar');
    const moodFill = document.getElementById('moodBatteryFill');
    const moodStatusText = document.getElementById('moodBatteryStatus');
    const upcomingEventsList = document.getElementById('upcomingEventsList');
    const budgetRemainingDisplay = document.getElementById('budgetRemainingDisplay');
    const budgetWidgetStatus = document.querySelector('.budget-widget .widget-status');

    // --- Calendar Elements and State (New) ---
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const monthYearDisplay = document.getElementById('currentMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    // ---------------- NAME PROMPT OVERLAY ----------------
    const nameOverlay = document.getElementById('namePromptOverlay');
    const nameInput = document.getElementById('nameInput');
    const submitNameBtn = document.getElementById('submitNameBtn');
    const welcomeMessage = document.getElementById('welcomeMessage');

    function checkName() {
        const savedName = localStorage.getItem('retroAppName');
        if (savedName) {
            welcomeMessage.textContent = `WELCOME, ${savedName}!`;
            nameOverlay.style.display = 'none';
        } else {
            nameOverlay.style.display = 'flex';
        }
    }

    submitNameBtn.addEventListener('click', () => {
        const name = nameInput.value.trim().toUpperCase();
        if (name) {
            localStorage.setItem('retroAppName', name);
            checkName();
        }
    });

    // ---------------- NAVIGATION ----------------
    function navigate(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        navItems.forEach(item => item.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');
        document.querySelector(`.nav-item[data-page="${pageId}"]`).classList.add('active');
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.getAttribute('data-page');
            navigate(pageId);
        });
    });

    // ---------------- STORAGE FUNCTIONS ----------------
    function getTodos() {
        return JSON.parse(localStorage.getItem('todos') || '[]');
    }
    function saveTodos(todos) {
        localStorage.setItem('todos', JSON.stringify(todos));
        updateDashboard();
    }
    function getEvents() {
        return JSON.parse(localStorage.getItem('events') || '[]');
    }
    function saveEvents(events) {
        localStorage.setItem('events', JSON.stringify(events));
        updateDashboard();
        renderCalendar(); // Added for real-time calendar update
    }
    function getSavings() {
        return JSON.parse(localStorage.getItem('savingsHistory') || '[]');
    }
    function saveSavings(savings) {
        localStorage.setItem('savingsHistory', JSON.stringify(savings));
        updateDashboard(true); // Trigger budget update
    }


    // ---------------- TO-DO LOGIC ----------------
    const todoListElement = document.getElementById('todoList');
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');

    function renderTodos() {
        const todos = getTodos();
        todoListElement.innerHTML = '';

        if (todos.length === 0) {
            todoListElement.innerHTML = '<li>NO MISSIONS YET</li>';
            return;
        }

        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.textContent = todo.name;
            if (todo.completed) {
                li.classList.add('completed');
            }

            const actionsDiv = document.createElement('div');
            
            // Toggle Button
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = todo.completed ? 'UNDO' : 'COMPLETE';
            toggleBtn.addEventListener('click', () => {
                todos[index].completed = !todos[index].completed;
                saveTodos(todos);
                renderTodos();
            });
            actionsDiv.appendChild(toggleBtn);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.addEventListener('click', () => {
                todos.splice(index, 1);
                saveTodos(todos);
                renderTodos();
            });
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(actionsDiv);
            todoListElement.appendChild(li);
        });
    }

    addTodoBtn.addEventListener('click', () => {
        const name = todoInput.value.trim();
        if (name) {
            const todos = getTodos();
            todos.push({ name: name.toUpperCase(), completed: false });
            saveTodos(todos);
            todoInput.value = '';
            renderTodos();
        }
    });

    // ---------------- CALENDAR LOGIC ----------------
    function renderCalendar() {
        const events = getEvents();
        // Convert events array to a Set for quick date lookups (YYYY-MM-DD)
        const eventDates = new Set(events.map(e => e.date));

        // Get today's date in YYYY-MM-DD format for highlighting
        const todayISO = new Date().toISOString().slice(0, 10);
        
        // Calendar math
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sunday, 6=Saturday
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPreviousMonth = new Date(currentYear, currentMonth, 0).getDate();

        const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }).toUpperCase();
        monthYearDisplay.textContent = `${monthName} ${currentYear}`;
        
        calendarGrid.innerHTML = ''; // Clear previous grid

        // 1. Render Day Headers (Start with Sunday)
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.classList.add('day-header');
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // 2. Render Placeholder Days (Previous Month)
        for (let i = firstDayOfMonth; i > 0; i--) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day', 'inactive');
            dayCell.textContent = daysInPreviousMonth - i + 1; 
            calendarGrid.appendChild(dayCell);
        }

        // 3. Render Current Month Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            
            // Construct the date string for comparison (YYYY-MM-DD)
            const monthPadded = String(currentMonth + 1).padStart(2, '0');
            const dayPadded = String(day).padStart(2, '0');
            const dateString = `${currentYear}-${monthPadded}-${dayPadded}`;

            if (dateString === todayISO) {
                dayCell.classList.add('today');
            }

            if (eventDates.has(dateString)) {
                dayCell.classList.add('has-event');
                const eventNames = events.filter(e => e.date === dateString).map(e => e.name).join(', ');
                dayCell.title = `EVENTS: ${eventNames}`;
            }
            
            // NEW: Click functionality to pre-fill the date input
            dayCell.addEventListener('click', () => {
                // Only allow clicking on active (current) month days
                if (!dayCell.classList.contains('inactive')) { 
                     eventDateInput.value = dateString;
                     // Optional: You could show a confirmation, but pre-filling the input is the main goal
                }
            });

            calendarGrid.appendChild(dayCell);
        }

        // 4. Render Placeholder Days (Next Month) to complete the grid
        const totalCells = calendarGrid.children.length - 7; // -7 for the headers
        const cellsToFill = 42 - totalCells; // Total max cells (6 rows * 7 days = 42)
        
        for (let i = 1; i <= cellsToFill; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day', 'inactive');
            dayCell.textContent = i;
            calendarGrid.appendChild(dayCell);
        }
    }

    // ---------------- EVENT LOGIC ----------------
    const eventListElement = document.getElementById('eventList');
    const eventInput = document.getElementById('eventInput');
    const eventDateInput = document.getElementById('eventDateInput');
    const addEventBtn = document.getElementById('addEventBtn');

    function renderEvents() {
        renderCalendar();
        const events = getEvents();
        eventListElement.innerHTML = '';
        
        if (events.length === 0) {
            eventListElement.innerHTML = '<li>NO EVENTS YET</li>';
            return;
        }

        // Sort events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        events.forEach((event, index) => {
            const li = document.createElement('li');
            const dateParts = event.date.split('-');
            const dateDisplay = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`; // MM/DD/YYYY
            li.innerHTML = `<strong>${dateDisplay}:</strong> ${event.name}`;

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.addEventListener('click', () => {
                events.splice(index, 1);
                saveEvents(events);
                renderEvents();
            });

            li.appendChild(deleteBtn);
            eventListElement.appendChild(li);
        });
    }

    addEventBtn.addEventListener('click', () => {
        const name = eventInput.value.trim();
        const date = eventDateInput.value;
        if (name && date) {
            const events = getEvents();
            events.push({ name: name.toUpperCase(), date: date });
            saveEvents(events);
            eventInput.value = '';
            eventDateInput.value = '';
            renderEvents();
        }
    });


    // ---------------- BUDGET LOGIC ----------------
    const goalNameInput = document.getElementById('goalNameInput');
    const goalAmountInput = document.getElementById('goalAmountInput');
    const setGoalBtn = document.getElementById('setGoalBtn');
    const currentGoalName = document.getElementById('currentGoalName');
    const budgetRemaining = document.getElementById('budgetRemaining');

    const dailyAmountInput = document.getElementById('dailyAmountInput');
    const logDailyBtn = document.getElementById('logDailyBtn');
    const savingsHistoryList = document.getElementById('savingsHistoryList');

    function renderBudget() {
        // Render Goal Info
        const goal = JSON.parse(localStorage.getItem('budgetGoal') || '{}');
        const savings = getSavings();

        if (goal.name) {
            currentGoalName.textContent = goal.name.toUpperCase();
        } else {
            currentGoalName.textContent = 'N/A';
        }

        // Calculate and update Budget Remaining display on the page
        const totalSavings = savings.reduce((sum, item) => sum + item.amount, 0);
        
        let remainingText = '$0 LEFT';
        if (goal.amount && goal.amount > 0) {
            const remaining = Math.max(0, goal.amount - totalSavings);
            remainingText = `$${remaining.toFixed(0)} LEFT`;
        }
        budgetRemaining.textContent = remainingText; // FIX: Updates the display on the budget page
        // End of fix

        // Render Savings History
        savingsHistoryList.innerHTML = '';
        if (savings.length === 0) {
            savingsHistoryList.innerHTML = '<li>NO LOGS YET</li>';
        } else {
            // Sort to show newest first
            [...savings].reverse().slice(0, 10).forEach(log => {
                const li = document.createElement('li');
                li.textContent = `${log.date}: +$${log.amount.toFixed(2)}`;
                savingsHistoryList.appendChild(li);
            });
            if (savings.length > 10) {
                const li = document.createElement('li');
                li.textContent = `... and ${savings.length - 10} more logs`;
                savingsHistoryList.appendChild(li);
            }
        }
        
        // This will update the dashboard which handles the remaining display
        updateDashboard(true); 
    }

    setGoalBtn.addEventListener('click', () => {
        const name = goalNameInput.value.trim();
        const amount = parseFloat(goalAmountInput.value);
        if (name && amount > 0) {
            localStorage.setItem('budgetGoal', JSON.stringify({ name, amount }));
            renderBudget();
            goalNameInput.value = '';
            goalAmountInput.value = '';
        } else {
            alert("Please enter a valid goal name and amount.");
        }
    });

    logDailyBtn.addEventListener('click', () => {
        const amount = parseFloat(dailyAmountInput.value);
        if (amount > 0) {
            const savings = getSavings();
            const today = new Date().toISOString().slice(0, 10);
            savings.push({ date: today, amount: amount });
            saveSavings(savings);
            dailyAmountInput.value = '';
            renderBudget();
        } else {
            alert("Please enter a positive savings amount.");
        }
    });

    // ---------------- MOOD LOGIC ----------------
    document.querySelectorAll('.mood-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mood = e.target.getAttribute('data-mood');
            localStorage.setItem('lastMood', mood);
            updateDashboard();
            alert(`Your mood is logged as ${mood}!`);
        });
    });


    // ---------------- CALENDAR NAVIGATION LISTENERS ----------------
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // ---------------- DASHBOARD WIDGET UPDATE LOGIC ----------------
    
    function updateDashboard(budgetProgress = null) {
        // --- 1. Tasks (MISSION COMPLETE %) ---
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        const completedTodos = todos.filter(t => t.completed).length;
        
        // Calculate percentage for Dashboard Widget Value
        let completionPercent = (todos.length > 0) ? Math.round((completedTodos / todos.length) * 100) : 0; 
        
        taskPercentDisplay.textContent = `${completionPercent}%`; 

        const taskStatusDisplayElement = document.getElementById('taskStatusDisplay');
        taskProgressBar.style.width = `${completionPercent}%`;
        
        // FIX: Only remove color classes, retaining 'task-progress-fill' for base styles
        const taskColorClasses = ['fill-amazing', 'fill-okay', 'fill-sad'];
        taskColorClasses.forEach(c => taskProgressBar.classList.remove(c));

        let taskProgressClass = '';
        if (completionPercent === 100) {
            taskProgressClass = 'fill-amazing';
            taskStatusDisplayElement.textContent = 'MISSION COMPLETE!';
        } else if (completionPercent > 0) {
            taskProgressClass = 'fill-okay';
            taskStatusDisplayElement.textContent = `${completedTodos} / ${todos.length} TASKS`;
        } else {
            taskProgressClass = 'fill-sad';
            taskStatusDisplayElement.textContent = 'NO TASKS STARTED';
        }
        
        if (taskProgressClass) taskProgressBar.classList.add(taskProgressClass);


        // --- 2. Events (UPCOMING THIS WEEK) ---
        const events = getEvents();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const today = new Date().toISOString().slice(0, 10);
        
        const upcomingEventsThisWeek = events.filter(e => {
            const eventDate = new Date(e.date);
            // Event date is today or later, AND within the next 7 days
            return e.date >= today && eventDate <= oneWeekFromNow;
        });

        upcomingEventsThisWeek.sort((a, b) => new Date(a.date) - new Date(b.date));

        upcomingEventsList.innerHTML = '';
        if (upcomingEventsThisWeek.length > 0) {
            upcomingEventsThisWeek.slice(0, 3).forEach(e => { // Show max 3 events
                const dateParts = e.date.split('-');
                const monthDay = `${dateParts[1]}/${dateParts[2]}`; // MM/DD format
                const li = document.createElement('li');
                li.textContent = `${monthDay}: ${e.name.toUpperCase()}`;
                upcomingEventsList.appendChild(li);
            });
            if (upcomingEventsThisWeek.length > 3) {
                 const li = document.createElement('li');
                 li.textContent = `+${upcomingEventsThisWeek.length - 3} MORE...`;
                 upcomingEventsList.appendChild(li);
            }
        } else {
            upcomingEventsList.innerHTML = '<li>NO EVENTS SCHEDULED</li>';
        }

        // --- 3. Mood Battery ---
        const lastMood = localStorage.getItem('lastMood');
        let moodLevel = 0;
        let moodClass = '';
        let moodText = 'NOT TRACKED YET';

        // FIX: Ensure moodFill classes are reset before applying new ones
        const moodColorClasses = ['fill-amazing', 'fill-happy', 'fill-okay', 'fill-sad'];
        moodColorClasses.forEach(c => moodFill.classList.remove(c));


        switch (lastMood) {
            case 'AMAZING': moodLevel = 100; moodClass = 'fill-amazing'; moodText = 'AMAZING! (100%)'; break;
            case 'HAPPY': moodLevel = 75; moodClass = 'fill-happy'; moodText = 'HAPPY (75%)'; break;
            case 'OKAY': moodLevel = 50; moodClass = 'fill-okay'; moodText = 'OKAY (50%)'; break; // Now Dark Orange
            case 'SAD': moodLevel = 25; moodClass = 'fill-sad'; moodText = 'SAD (25%)'; break; // Now Red-Orange
            default: moodLevel = 0; moodClass = ''; moodText = 'NO DATA';
        }

        // Apply Mood Visuals
        moodFill.style.width = `${moodLevel}%`;
        // moodFill.className = 'mood-battery-fill'; // Base class is retained via HTML
        if (moodClass) moodFill.classList.add(moodClass);
        moodStatusText.textContent = moodText;


        // --- 4. Budget Aim ---
        const goal = JSON.parse(localStorage.getItem('budgetGoal') || '{}');
        const savings = JSON.parse(localStorage.getItem('savingsHistory') || '[]');
        let totalSavings = savings.reduce((sum, item) => sum + item.amount, 0);

        if (goal.amount && goal.amount > 0) {
            const remaining = Math.max(0, goal.amount - totalSavings);
            const progressPercent = Math.min(100, (totalSavings / goal.amount) * 100);

            budgetRemainingDisplay.textContent = `$${remaining.toFixed(0)} LEFT`;
            budgetWidgetStatus.textContent = `${Math.round(progressPercent)}% PROGRESS`;
        } else {
            budgetRemainingDisplay.textContent = '$0 LEFT';
            budgetWidgetStatus.textContent = 'NO GOAL SET';
        }
    }


    // ---------------- DASHBOARD TOGGLE ----------------
    dashboardTrigger.addEventListener('click', (e) => {
        // Prevent event from bubbling up and closing other things if applicable
        e.stopPropagation();
        dashboardWidgets.classList.toggle('hidden');
        if (!dashboardWidgets.classList.contains('hidden')) {
             updateDashboard(); // Update metrics when opening
        }
    });

    // Close dashboard when clicking anywhere else
    document.addEventListener('click', (e) => {
        if (!dashboardWidgets.contains(e.target) && !dashboardTrigger.contains(e.target)) {
            dashboardWidgets.classList.add('hidden');
        }
    });


    // ---------------- INITIALIZATION ----------------
    checkName();
    renderTodos();
    renderEvents();
    renderBudget();
    navigate('home'); // Start on the home page
    renderCalendar(); // Initial calendar display
    updateDashboard(); // Initial dashboard refresh

});