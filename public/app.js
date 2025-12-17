// State
let currentUser = null;
let events = [];
let bookings = [];
let notifications = [];
let settings = {};

// API Helper
async function api(endpoint, options = {}) {
    try {
        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

// Notification Toast
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const data = await api('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        currentUser = data.user;
        document.body.className = `role-${currentUser.role}`;
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('appScreen').classList.add('active');
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role;
        
        await loadData();
        showNotification(`Welcome back, ${currentUser.name}!`);
    } catch (error) {
        // Error already shown by api helper
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('/logout', { method: 'POST' });
    currentUser = null;
    document.getElementById('appScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('loginForm').reset();
});

// Load Data
async function loadData() {
    try {
        await Promise.all([
            loadEvents(),
            loadBookings(),
            loadNotifications(),
            currentUser.role === 'owner' ? loadSettings() : Promise.resolve()
        ]);
    } catch (error) {
        if (error.message.includes('maintenance')) {
            document.getElementById('maintenanceBanner').style.display = 'block';
        }
    }
}

async function loadEvents() {
    try {
        events = await api('/events');
        renderEvents();
    } catch (error) {
        // Handle maintenance mode
    }
}

async function loadBookings() {
    try {
        bookings = await api('/bookings');
        renderBookings();
    } catch (error) {
        // Handle maintenance mode
    }
}

async function loadNotifications() {
    try {
        notifications = await api('/notifications');
        renderNotifications();
    } catch (error) {
        // Handle maintenance mode
    }
}

async function loadSettings() {
    settings = await api('/settings');
    document.getElementById('settingsClubName').value = settings.clubName;
    document.getElementById('settingsClubDescription').value = settings.clubDescription;
    document.getElementById('settingsMaintenanceMode').checked = settings.maintenanceMode;
    document.getElementById('clubName').textContent = settings.clubName;
}

// Render Events
function renderEvents() {
    const container = document.getElementById('eventsList');
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No events yet</h3>
                <p>Create your first event to get started</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => {
        const bookedTickets = bookings
            .filter(b => b.eventId === event.id && b.status !== 'cancelled')
            .reduce((sum, b) => sum + b.tickets, 0);
        const available = event.capacity - bookedTickets;
        
        return `
            <div class="event-card">
                <h3>${event.name}</h3>
                <p>${event.description}</p>
                <div class="event-meta">
                    <span>📅 ${event.date}</span>
                    <span>🕐 ${event.time}</span>
                    <span>👥 ${available}/${event.capacity} available</span>
                </div>
                <div class="event-price">$${event.price}</div>
                <div class="event-actions">
                    ${currentUser.role === 'user' ? `
                        <button class="btn btn-success btn-sm" onclick="openBookingModal(${event.id})" ${available === 0 ? 'disabled' : ''}>
                            ${available === 0 ? 'Sold Out' : 'Book Now'}
                        </button>
                    ` : ''}
                    ${currentUser.role !== 'user' ? `
                        <button class="btn btn-primary btn-sm" onclick="editEvent(${event.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteEvent(${event.id})">Delete</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Render Bookings
function renderBookings() {
    const container = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No bookings yet</h3>
                <p>Book an event to see it here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Event</th>
                    ${currentUser.role !== 'user' ? '<th>User</th>' : ''}
                    <th>Tickets</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${bookings.map(booking => `
                    <tr>
                        <td>${booking.eventName}</td>
                        ${currentUser.role !== 'user' ? `<td>${booking.userName}</td>` : ''}
                        <td>${booking.tickets}</td>
                        <td>$${booking.totalPrice}</td>
                        <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                        <td><span class="status-badge status-${booking.paymentStatus}">${booking.paymentStatus}</span></td>
                        <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                        <td>
                            ${booking.status !== 'cancelled' ? `
                                <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render Notifications
function renderNotifications() {
    const container = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${!notif.read ? 'unread' : ''}" onclick="markAsRead(${notif.id})">
            <div class="notification-header">
                <strong>${!notif.read ? '🔵 ' : ''}${notif.message}</strong>
                <span class="notification-time">${new Date(notif.createdAt).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
    });
});

// Event Modal
document.getElementById('createEventBtn').addEventListener('click', () => {
    document.getElementById('eventModalTitle').textContent = 'Create Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('eventModal').classList.add('active');
});

document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventData = {
        name: document.getElementById('eventName').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        price: parseFloat(document.getElementById('eventPrice').value),
        capacity: parseInt(document.getElementById('eventCapacity').value)
    };
    
    const eventId = document.getElementById('eventId').value;
    
    if (eventId) {
        await api(`/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });
        showNotification('Event updated successfully');
    } else {
        await api('/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
        showNotification('Event created successfully');
    }
    
    closeModal('eventModal');
    await loadEvents();
});

function editEvent(id) {
    const event = events.find(e => e.id === id);
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventName').value = event.name;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventPrice').value = event.price;
    document.getElementById('eventCapacity').value = event.capacity;
    document.getElementById('eventModal').classList.add('active');
}

async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    await api(`/events/${id}`, { method: 'DELETE' });
    showNotification('Event deleted successfully');
    await loadEvents();
}

// Booking Modal
function openBookingModal(eventId) {
    const event = events.find(e => e.id === eventId);
    document.getElementById('bookingEventId').value = eventId;
    document.getElementById('bookingEventDetails').innerHTML = `
        <h3>${event.name}</h3>
        <p>${event.description}</p>
        <p><strong>Date:</strong> ${event.date} at ${event.time}</p>
        <p><strong>Price:</strong> $${event.price} per ticket</p>
    `;
    document.getElementById('bookingTickets').value = 1;
    updateBookingTotal();
    document.getElementById('bookingModal').classList.add('active');
}

document.getElementById('bookingTickets').addEventListener('input', updateBookingTotal);

function updateBookingTotal() {
    const eventId = parseInt(document.getElementById('bookingEventId').value);
    const event = events.find(e => e.id === eventId);
    const tickets = parseInt(document.getElementById('bookingTickets').value) || 0;
    const total = event.price * tickets;
    document.getElementById('bookingTotal').innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
}

document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookingData = {
        eventId: parseInt(document.getElementById('bookingEventId').value),
        tickets: parseInt(document.getElementById('bookingTickets').value)
    };
    
    await api('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    });
    
    showNotification('Booking confirmed!');
    closeModal('bookingModal');
    await loadBookings();
    await loadNotifications();
});

async function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    await api(`/bookings/${id}`, { method: 'DELETE' });
    showNotification('Booking cancelled');
    await loadBookings();
}

// Notification Modal
document.getElementById('sendNotificationBtn').addEventListener('click', () => {
    document.getElementById('notificationForm').reset();
    document.getElementById('notificationModal').classList.add('active');
});

document.getElementById('notificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = document.getElementById('notificationMessage').value;
    
    await api('/notifications', {
        method: 'POST',
        body: JSON.stringify({ message })
    });
    
    showNotification('Notification sent to all users');
    closeModal('notificationModal');
});

async function markAsRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif.read) return;
    
    await api(`/notifications/${id}/read`, { method: 'PUT' });
    await loadNotifications();
}

// Settings
document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const settingsData = {
        clubName: document.getElementById('settingsClubName').value,
        clubDescription: document.getElementById('settingsClubDescription').value,
        maintenanceMode: document.getElementById('settingsMaintenanceMode').checked
    };
    
    await api('/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData)
    });
    
    showNotification('Settings saved successfully');
    await loadSettings();
});

// Users Management
document.getElementById('createUserBtn').addEventListener('click', () => {
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.add('active');
});

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('newUserName').value,
        username: document.getElementById('newUserUsername').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value
    };
    
    await api('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    showNotification('User created successfully');
    closeModal('userModal');
    await loadUsers();
});

async function loadUsers() {
    const users = await api('/users');
    const container = document.getElementById('usersList');
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.username}</td>
                        <td><span class="status-badge">${user.role}</span></td>
                        <td>
                            ${user.id !== currentUser.id ? `
                                <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    await api(`/users/${id}`, { method: 'DELETE' });
    showNotification('User deleted successfully');
    await loadUsers();
}

// Modal Close
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        closeModal(btn.closest('.modal').id);
    });
});

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// Check auth on load
async function checkAuth() {
    try {
        const data = await api('/me');
        currentUser = data.user;
        document.body.className = `role-${currentUser.role}`;
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('appScreen').classList.add('active');
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role;
        await loadData();
    } catch (error) {
        // Not authenticated, stay on login screen
    }
}

checkAuth();
