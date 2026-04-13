// ===========================
// LOCAL STORAGE MANAGEMENT
// ===========================

const STORAGE_KEY = 'gymTrackerWorkouts';
const EDIT_KEY = 'gymTrackerEditId';

function getAllWorkouts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveWorkouts(workouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

function getWorkoutById(id) {
    return getAllWorkouts().find(w => w.id === id);
}

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

function deleteWorkout(id) {
    const filtered = getAllWorkouts().filter(w => w.id !== id);
    saveWorkouts(filtered);
}

// ===========================
// NAVIGATION
// ===========================

function navigateTo(page) {
    window.location.href = page;
}

// ===========================
// TOAST
// ===========================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===========================
// MENU FIX (🔥 أهم جزء للهامبرغر)
// ===========================

function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;

    menu.classList.toggle('active');
}

// 🔥 تشغيل الزرار بطريقة مضمونة (Click + Touch)
function setupMenuFix() {
    const btn = document.getElementById('menuBtn');

    if (!btn) return;

    btn.addEventListener('click', toggleMenu);

    btn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        toggleMenu();
    }, { passive: false });
}

// إغلاق القائمة عند الضغط خارجها
function setupOutsideClick() {
    document.addEventListener('click', function (e) {
        const menu = document.getElementById('mobileMenu');
        const btn = document.getElementById('menuBtn');

        if (!menu || !btn) return;

        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
}

// ===========================
// INIT MENU
// ===========================

function setupMenu() {
    setupMenuFix();
    setupOutsideClick();

    const links = document.querySelectorAll('.menu-link');

    links.forEach(link => {
        link.addEventListener('click', () => {
            const menu = document.getElementById('mobileMenu');
            if (menu) menu.classList.remove('active');
        });
    });
}

// ===========================
// INIT PAGE DETECTION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    setupMenu();

    if (path.includes('add.html')) {
        initAddPage();
    } else if (path.includes('workouts.html')) {
        initWorkoutsPage();
    } else {
        initDashboard();
    }
});

// ===========================
// ESCAPE HTML
// ===========================

function escapeHtml(text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// ===========================
// باقي وظائفك زي ما هي (مش اتغيرت)
// ===========================

// ⚠️ سيب باقي الكود بتاعك زي ما هو:
// initDashboard
// initAddPage
// initWorkoutsPage
// displayWorkouts
// validateForm
// إلخ...
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
