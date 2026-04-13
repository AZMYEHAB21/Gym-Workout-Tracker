// ===========================
// LOCAL STORAGE MANAGEMENT
// ===========================

const STORAGE_KEY = 'gymTrackerWorkouts';
const EDIT_KEY = 'gymTrackerEditId';

// Get all workouts from localStorage
function getAllWorkouts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save workouts to localStorage
function saveWorkouts(workouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

// Get single workout by ID
function getWorkoutById(id) {
    const workouts = getAllWorkouts();
    return workouts.find(w => w.id === id);
}

// Add new workout
function addWorkout(workout) {
    const workouts = getAllWorkouts();
    const newWorkout = {
        ...workout,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
    };
    workouts.push(newWorkout);
    saveWorkouts(workouts);
    return newWorkout;
}

// Update existing workout
function updateWorkout(id, updates) {
    const workouts = getAllWorkouts();
    const index = workouts.findIndex(w => w.id === id);
    if (index !== -1) {
        workouts[index] = {
            ...workouts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        saveWorkouts(workouts);
        return workouts[index];
    }
    return null;
}

// Delete workout
function deleteWorkout(id) {
    const workouts = getAllWorkouts();
    const filtered = workouts.filter(w => w.id !== id);
    saveWorkouts(filtered);
}

// ===========================
// UI UTILITIES
// ===========================

// Navigate to different pages
function navigateTo(page) {
    window.location.href = page;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if today
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    
    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

// Format date for input field
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Close modal
function closeModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Toggle menu
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Close menu when clicking a link
function setupMenuLinks() {
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            const menu = document.getElementById('mobileMenu');
            if (menu) {
                menu.classList.remove('active');
            }
        });
    });
}

// ===========================
// DASHBOARD PAGE (index.html)
// ===========================

function initDashboard() {
    const workouts = getAllWorkouts();
    
    // Update stats
    updateDashboardStats(workouts);
    
    // Display recent workouts
    displayRecentWorkouts(workouts);
    
    // Setup menu
    setupMenu();
}

function updateDashboardStats(workouts) {
    // Total workouts
    const totalEl = document.getElementById('totalWorkouts');
    if (totalEl) {
        totalEl.textContent = workouts.length;
    }
    
    // Last workout
    const lastEl = document.getElementById('lastWorkout');
    if (lastEl && workouts.length > 0) {
        const lastWorkout = workouts[workouts.length - 1];
        lastEl.textContent = lastWorkout.exerciseName;
    }
    
    // Heaviest lift
    const heaviestEl = document.getElementById('heaviestLift');
    if (heaviestEl && workouts.length > 0) {
        const heaviest = Math.max(...workouts.map(w => parseFloat(w.weight)));
        heaviestEl.textContent = heaviest.toFixed(1) + ' kg';
    }
}

function displayRecentWorkouts(workouts) {
    const container = document.getElementById('recentWorkouts');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    if (workouts.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Show last 3 workouts
    const recent = workouts.slice(-3).reverse();
    
    container.innerHTML = recent.map(workout => `
        <div class="workout-card">
            <div class="workout-card-header">
                <div>
                    <h4 class="workout-card-title">${escapeHtml(workout.exerciseName)}</h4>
                    <p class="workout-card-date">${formatDate(workout.date)}</p>
                </div>
            </div>
            <div class="workout-card-stats">
                <div class="stat-item">
                    <div class="stat-item-label">Weight</div>
                    <p class="stat-item-value">${parseFloat(workout.weight).toFixed(1)} kg</p>
                </div>
                <div class="stat-item">
                    <div class="stat-item-label">Reps</div>
                    <p class="stat-item-value">${workout.reps}</p>
                </div>
                <div class="stat-item">
                    <div class="stat-item-label">Sets</div>
                    <p class="stat-item-value">${workout.sets}</p>
                </div>
            </div>
            <div class="workout-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editWorkout('${workout.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        </div>
    `).join('');
}

// ===========================
// ADD/EDIT WORKOUT PAGE (add.html)
// ===========================

let currentEditId = null;
let deleteTargetId = null;

function initAddPage() {
    const form = document.getElementById('workoutForm');
    const deleteBtn = document.getElementById('deleteBtn');
    const dateInput = document.getElementById('date');
    const menuBtn = document.getElementById('menuBtn');
    
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Check if editing
    currentEditId = sessionStorage.getItem(EDIT_KEY);
    if (currentEditId) {
        loadEditWorkout(currentEditId);
        sessionStorage.removeItem(EDIT_KEY);
        if (deleteBtn) deleteBtn.style.display = 'flex';
    }
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteTargetId = currentEditId;
            const modal = document.getElementById('deleteModal');
            if (modal) modal.classList.add('active');
        });
    }
    
    setupMenu();
}

function loadEditWorkout(id) {
    const workout = getWorkoutById(id);
    if (!workout) return;
    
    document.getElementById('exerciseName').value = workout.exerciseName;
    document.getElementById('weight').value = workout.weight;
    document.getElementById('reps').value = workout.reps;
    document.getElementById('sets').value = workout.sets;
    document.getElementById('date').value = workout.date;
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Workout';
    }
    
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = 'Edit Workout';
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        exerciseName: document.getElementById('exerciseName').value.trim(),
        weight: document.getElementById('weight').value,
        reps: document.getElementById('reps').value,
        sets: document.getElementById('sets').value,
        date: document.getElementById('date').value
    };
    
    // Validate
    if (!validateForm(formData)) {
        return;
    }
    
    if (currentEditId) {
        updateWorkout(currentEditId, formData);
        showToast('Workout Updated Successfully!', 'success');
    } else {
        addWorkout(formData);
        showToast('Workout Added Successfully!', 'success');
    }
    
    setTimeout(() => {
        navigateTo('workouts.html');
    }, 1500);
}

function validateForm(data) {
    let isValid = true;
    
    // Clear all errors
    document.querySelectorAll('.form-error').forEach(el => {
        el.classList.remove('show');
    });
    
    // Validate exercise name
    if (!data.exerciseName) {
        document.getElementById('exerciseNameError').textContent = 'Exercise name is required';
        document.getElementById('exerciseNameError').classList.add('show');
        isValid = false;
    }
    
    // Validate weight
    if (!data.weight || parseFloat(data.weight) < 0) {
        document.getElementById('weightError').textContent = 'Valid weight is required';
        document.getElementById('weightError').classList.add('show');
        isValid = false;
    }
    
    // Validate reps
    if (!data.reps || parseInt(data.reps) < 1) {
        document.getElementById('repsError').textContent = 'Reps must be at least 1';
        document.getElementById('repsError').classList.add('show');
        isValid = false;
    }
    
    // Validate sets
    if (!data.sets || parseInt(data.sets) < 1) {
        document.getElementById('setsError').textContent = 'Sets must be at least 1';
        document.getElementById('setsError').classList.add('show');
        isValid = false;
    }
    
    // Validate date
    if (!data.date) {
        document.getElementById('dateError').textContent = 'Date is required';
        document.getElementById('dateError').classList.add('show');
        isValid = false;
    }
    
    return isValid;
}

function confirmDelete() {
    if (deleteTargetId) {
        deleteWorkout(deleteTargetId);
        closeModal();
        showToast('Workout Deleted!', 'warning');
        setTimeout(() => {
            navigateTo('workouts.html');
        }, 1500);
    }
}

// ===========================
// WORKOUTS PAGE (workouts.html)
// ===========================

function initWorkoutsPage() {
    const workouts = getAllWorkouts();
    
    displayWorkouts(workouts);
    setupFilters(workouts);
    setupMenu();
}

function displayWorkouts(workouts) {
    const container = document.getElementById('workoutsList');
    const noResults = document.getElementById('noResults');
    
    if (!container) return;
    
    if (workouts.length === 0) {
        container.innerHTML = '';
        if (noResults) noResults.style.display = 'flex';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    // Sort by date (newest first)
    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sorted.map(workout => `
        <div class="workout-card">
            <div class="workout-card-header">
                <div>
                    <h4 class="workout-card-title">${escapeHtml(workout.exerciseName)}</h4>
                    <p class="workout-card-date">${formatDate(workout.date)}</p>
                </div>
            </div>
            <div class="workout-card-stats">
                <div class="stat-item">
                    <div class="stat-item-label">Weight</div>
                    <p class="stat-item-value">${parseFloat(workout.weight).toFixed(1)} kg</p>
                </div>
                <div class="stat-item">
                    <div class="stat-item-label">Reps</div>
                    <p class="stat-item-value">${workout.reps}</p>
                </div>
                <div class="stat-item">
                    <div class="stat-item-label">Sets</div>
                    <p class="stat-item-value">${workout.sets}</p>
                </div>
            </div>
            <div class="workout-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editWorkout('${workout.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteWorkoutPrompt('${workout.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function setupFilters(workouts) {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters(workouts);
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            applyFilters(workouts);
        });
    }
}

function applyFilters(allWorkouts) {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    
    let filtered = allWorkouts;
    
    // Search filter
    if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.toLowerCase();
        filtered = filtered.filter(w => 
            w.exerciseName.toLowerCase().includes(query)
        );
    }
    
    // Date filter
    if (dateFilter && dateFilter.value) {
        filtered = filtered.filter(w => w.date === dateFilter.value);
    }
    
    displayWorkouts(filtered);
}

function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) searchInput.value = '';
    if (dateFilter) dateFilter.value = '';
    
    const workouts = getAllWorkouts();
    displayWorkouts(workouts);
}

// ===========================
// SHARED FUNCTIONS
// ===========================

function editWorkout(id) {
    sessionStorage.setItem(EDIT_KEY, id);
    navigateTo('add.html');
}

function deleteWorkoutPrompt(id) {
    deleteTargetId = id;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function setupMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const menu = document.getElementById('mobileMenu');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (menu && !menu.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
    
    setupMenuLinks();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('add.html')) {
        initAddPage();
    } else if (path.includes('workouts.html')) {
        initWorkoutsPage();
    } else {
        initDashboard();
    }
});
