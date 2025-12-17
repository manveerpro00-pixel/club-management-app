const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'club-secret-key-2024';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Database file
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [
        {
          id: 1,
          username: 'owner',
          password: bcrypt.hashSync('owner123', 10),
          role: 'owner',
          name: 'Club Owner'
        },
        {
          id: 2,
          username: 'admin',
          password: bcrypt.hashSync('admin123', 10),
          role: 'admin',
          name: 'Club Admin'
        },
        {
          id: 3,
          username: 'user',
          password: bcrypt.hashSync('user123', 10),
          role: 'user',
          name: 'John Doe'
        }
      ],
      events: [],
      bookings: [],
      notifications: [],
      settings: {
        maintenanceMode: false,
        clubName: 'Elite Club',
        clubDescription: 'Premium events and experiences'
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read database
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Write database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Check maintenance mode
function checkMaintenance(req, res, next) {
  const db = readDB();
  if (db.settings.maintenanceMode && req.user.role === 'user') {
    return res.status(503).json({ error: 'System under maintenance' });
  }
  next();
}

// Initialize DB
initDB();

// Auth routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  
  const user = db.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
  res.json({ 
    success: true, 
    user: { id: user.id, username: user.username, role: user.role, name: user.name }
  });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Settings routes (Owner only)
app.get('/api/settings', authenticate, authorize('owner'), (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.put('/api/settings', authenticate, authorize('owner'), (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// Events routes
app.get('/api/events', authenticate, checkMaintenance, (req, res) => {
  const db = readDB();
  res.json(db.events);
});

app.post('/api/events', authenticate, authorize('admin', 'owner'), (req, res) => {
  const db = readDB();
  const event = {
    id: Date.now(),
    ...req.body,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };
  db.events.push(event);
  writeDB(db);
  res.json({ success: true, event });
});

app.put('/api/events/:id', authenticate, authorize('admin', 'owner'), (req, res) => {
  const db = readDB();
  const index = db.events.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  db.events[index] = { ...db.events[index], ...req.body };
  writeDB(db);
  res.json({ success: true, event: db.events[index] });
});

app.delete('/api/events/:id', authenticate, authorize('admin', 'owner'), (req, res) => {
  const db = readDB();
  db.events = db.events.filter(e => e.id !== parseInt(req.params.id));
  writeDB(db);
  res.json({ success: true });
});

// Bookings routes
app.get('/api/bookings', authenticate, checkMaintenance, (req, res) => {
  const db = readDB();
  let bookings = db.bookings;
  
  if (req.user.role === 'user') {
    bookings = bookings.filter(b => b.userId === req.user.id);
  }
  
  // Enrich with event and user details
  bookings = bookings.map(b => {
    const event = db.events.find(e => e.id === b.eventId);
    const user = db.users.find(u => u.id === b.userId);
    return {
      ...b,
      eventName: event?.name || 'Unknown Event',
      userName: user?.name || 'Unknown User'
    };
  });
  
  res.json(bookings);
});

app.post('/api/bookings', authenticate, checkMaintenance, (req, res) => {
  const db = readDB();
  const { eventId, tickets } = req.body;
  
  const event = db.events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const bookedTickets = db.bookings
    .filter(b => b.eventId === eventId && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.tickets, 0);
  
  if (bookedTickets + tickets > event.capacity) {
    return res.status(400).json({ error: 'Not enough capacity' });
  }
  
  const booking = {
    id: Date.now(),
    userId: req.user.id,
    eventId,
    tickets,
    totalPrice: event.price * tickets,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString()
  };
  
  db.bookings.push(booking);
  
  // Create notification
  const notification = {
    id: Date.now() + 1,
    userId: req.user.id,
    message: `Booking confirmed for ${event.name} - ${tickets} ticket(s)`,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);
  
  writeDB(db);
  res.json({ success: true, booking });
});

app.delete('/api/bookings/:id', authenticate, (req, res) => {
  const db = readDB();
  const bookingIndex = db.bookings.findIndex(b => b.id === parseInt(req.params.id));
  
  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  const booking = db.bookings[bookingIndex];
  
  if (req.user.role === 'user' && booking.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  booking.status = 'cancelled';
  writeDB(db);
  res.json({ success: true });
});

// Notifications routes
app.get('/api/notifications', authenticate, checkMaintenance, (req, res) => {
  const db = readDB();
  const notifications = db.notifications.filter(n => n.userId === req.user.id);
  res.json(notifications);
});

app.post('/api/notifications', authenticate, authorize('admin', 'owner'), (req, res) => {
  const db = readDB();
  const { message, userIds } = req.body;
  
  const targetUsers = userIds || db.users.filter(u => u.role === 'user').map(u => u.id);
  
  targetUsers.forEach(userId => {
    const notification = {
      id: Date.now() + Math.random(),
      userId,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notification);
  });
  
  writeDB(db);
  res.json({ success: true, count: targetUsers.length });
});

app.put('/api/notifications/:id/read', authenticate, (req, res) => {
  const db = readDB();
  const notification = db.notifications.find(n => n.id === parseFloat(req.params.id));
  
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  notification.read = true;
  writeDB(db);
  res.json({ success: true });
});

// Users management (Owner only)
app.get('/api/users', authenticate, authorize('owner'), (req, res) => {
  const db = readDB();
  const users = db.users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    name: u.name
  }));
  res.json(users);
});

app.post('/api/users', authenticate, authorize('owner'), (req, res) => {
  const db = readDB();
  const { username, password, role, name } = req.body;
  
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  const user = {
    id: Date.now(),
    username,
    password: bcrypt.hashSync(password, 10),
    role,
    name
  };
  
  db.users.push(user);
  writeDB(db);
  res.json({ success: true, user: { id: user.id, username, role, name } });
});

app.delete('/api/users/:id', authenticate, authorize('owner'), (req, res) => {
  const db = readDB();
  const userId = parseInt(req.params.id);
  
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  
  db.users = db.users.filter(u => u.id !== userId);
  writeDB(db);
  res.json({ success: true });
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Club Management App running on http://localhost:${PORT}`);
  console.log('\n📝 Test Credentials:');
  console.log('Owner: username=owner, password=owner123');
  console.log('Admin: username=admin, password=admin123');
  console.log('User: username=user, password=user123');
});
