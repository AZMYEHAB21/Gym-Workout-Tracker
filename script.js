// ===========================
// LOCAL STORAGE MANAGEMENT
// ===========================

const STORAGE_KEY = 'gymTrackerWorkouts';
const EDIT_KEY = 'gymTrackerEditId';

// الحصول على كل التمارين
function getAllWorkouts() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error reading from localStorage", e);
        return [];
    }
}

// حفظ التمارين
function saveWorkouts(workouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

// الحصول على تمرين واحد بالـ ID
function getWorkoutById(id) {
    const workouts = getAllWorkouts();
    return workouts.find(w => w.id === id);
}

// إضافة تمرين جديد
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

// تحديث تمرين موجود
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

// حذف تمرين
function deleteWorkout(id) {
    const workouts = getAllWorkouts();
    const filtered = workouts.filter(w => w.id !== id);
    saveWorkouts(filtered);
}

// ===========================
// UI UTILITIES
// ===========================

// التنقل بين الصفحات (تم تعديله ليتناسب مع WebView)
function navigateTo(page) {
    window.location.href = page;
}

// إظهار التنبيهات
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// تنسيق التاريخ للعرض
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

// تنسيق التاريخ للمدخلات
function formatDateForInput(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function closeModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('active');
}

function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        // إضافة أو حذف الكلاس اللي بيفتح المنيو
        menu.classList.toggle('active');
        
        // منع الصفحة من السكرول لما المنيو تفتح (اختياري بس بيخلي الشكل أنضف)
        if (menu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
}

function setupMenuLinks() {
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.onclick = () => {
            const menu = document.getElementById('mobileMenu');
            if (menu) menu.classList.remove('active');
        };
    });
}

// ===========================
// DASHBOARD PAGE (index.html)
// ===========================

function initDashboard() {
    const workouts = getAllWorkouts();
    updateDashboardStats(workouts);
    displayRecentWorkouts(workouts);
    setupMenu();
}

function updateDashboardStats(workouts) {
    const totalEl = document.getElementById('totalWorkouts');
    const lastEl = document.getElementById('lastWorkout');
    const heaviestEl = document.getElementById('heaviestLift');

    if (totalEl) totalEl.textContent = workouts.length;
    
    if (lastEl && workouts.length > 0) {
        const lastWorkout = workouts[workouts.length - 1];
        lastEl.textContent = lastWorkout.exerciseName;
    }
    
    if (heaviestEl && workouts.length > 0) {
        const weights = workouts.map(w => parseFloat(w.weight) || 0);
        const heaviest = Math.max(...weights);
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
                <div class="stat-item"><div class="stat-item-label">Weight</div><p class="stat-item-value">${parseFloat(workout.weight).toFixed(1)} kg</p></div>
                <div class="stat-item"><div class="stat-item-label">Reps</div><p class="stat-item-value">${workout.reps}</p></div>
                <div class="stat-item"><div class="stat-item-label">Sets</div><p class="stat-item-value">${workout.sets}</p></div>
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
    
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    currentEditId = sessionStorage.getItem(EDIT_KEY);
    if (currentEditId) {
        loadEditWorkout(currentEditId);
        if (deleteBtn) deleteBtn.style.display = 'flex';
    }
    
    if (form) form.onsubmit = handleFormSubmit;
    
    if (deleteBtn) {
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            deleteTargetId = currentEditId;
            const modal = document.getElementById('deleteModal');
            if (modal) modal.classList.add('active');
        };
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
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-check"></i> Update Workout';
    
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
    
    if (!validateForm(formData)) return;
    
    if (currentEditId) {
        updateWorkout(currentEditId, formData);
        sessionStorage.removeItem(EDIT_KEY);
        showToast('Workout Updated!', 'success');
    } else {
        addWorkout(formData);
        showToast('Workout Added!', 'success');
    }
    
    setTimeout(() => navigateTo('workouts.html'), 1000);
}

function validateForm(data) {
    let isValid = true;
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    
    if (!data.exerciseName) {
        const err = document.getElementById('exerciseNameError');
        if(err) { err.textContent = 'Required'; err.classList.add('show'); }
        isValid = false;
    }
    // ... باقي التحققات بنفس المنطق
    return isValid;
}

function confirmDelete() {
    if (deleteTargetId) {
        deleteWorkout(deleteTargetId);
        sessionStorage.removeItem(EDIT_KEY);
        closeModal();
        showToast('Deleted!', 'warning');
        setTimeout(() => navigateTo('workouts.html'), 1000);
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
                <div class="stat-item"><div class="stat-item-label">Weight</div><p class="stat-item-value">${parseFloat(workout.weight).toFixed(1)} kg</p></div>
                <div class="stat-item"><div class="stat-item-label">Reps</div><p class="stat-item-value">${workout.reps}</p></div>
                <div class="stat-item"><div class="stat-item-label">Sets</div><p class="stat-item-value">${workout.sets}</p></div>
            </div>
            <div class="workout-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editWorkout('${workout.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteWorkoutPrompt('${workout.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function setupFilters(workouts) {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) searchInput.oninput = () => applyFilters(workouts);
    if (dateFilter) dateFilter.onchange = () => applyFilters(workouts);
}

function applyFilters(allWorkouts) {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const dateVal = document.getElementById('dateFilter')?.value || '';
    
    let filtered = allWorkouts.filter(w => {
        const matchesSearch = w.exerciseName.toLowerCase().includes(query);
        const matchesDate = dateVal ? w.date === dateVal : true;
        return matchesSearch && matchesDate;
    });
    
    displayWorkouts(filtered);
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
    if (modal) modal.classList.add('active');
}

function setupMenu() {
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) menuBtn.onclick = toggleMenu;
    
    window.onclick = (e) => {
        const menu = document.getElementById('mobileMenu');
        if (menu && !menu.contains(e.target) && e.target !== menuBtn) {
            menu.classList.remove('active');
        }
    };
    setupMenuLinks();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
