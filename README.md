# 🎉 Club Management System

A full-featured club management web application with role-based access control, event management, booking system, and real-time notifications.

## ✨ Features

### 🔐 Three User Roles

**Owner (Full Control)**
- Toggle maintenance mode (blocks all users)
- Customize club name and description
- Manage admins and users
- Full access to all features

**Admin (Event Management)**
- Create, edit, and delete events
- Set pricing and capacity
- View and manage all bookings
- Send in-app notifications to users
- View payment status

**User (Customer)**
- Browse available events
- Book events with ticket selection
- View personal bookings
- Receive notifications
- Cancel bookings

### 🎯 Core Functionality

- ✅ **Authentication**: Secure login with JWT tokens
- ✅ **Role-Based Access**: Different permissions for Owner/Admin/User
- ✅ **Event Management**: Full CRUD operations for events
- ✅ **Booking System**: Real-time capacity tracking and booking
- ✅ **Payment Tracking**: Dummy payment status (confirmed/paid)
- ✅ **Notifications**: In-app notification system
- ✅ **Maintenance Mode**: Owner can block user access
- ✅ **Persistent Data**: JSON file-based database
- ✅ **Responsive UI**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/manveerpro00-pixel/club-management-app.git
cd club-management-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm run dev
```

4. **Open your browser**
```
http://localhost:3000
```

## 🔑 Test Credentials

### Owner Account
- **Username**: `owner`
- **Password**: `owner123`
- **Access**: Full control, settings, user management

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Event management, bookings, notifications

### User Account
- **Username**: `user`
- **Password**: `user123`
- **Access**: View events, make bookings, receive notifications

## 📁 Project Structure

```
club-management-app/
├── server.js              # Express backend with API routes
├── package.json           # Dependencies and scripts
├── database.json          # Auto-generated persistent storage
└── public/
    ├── index.html         # Frontend HTML
    ├── styles.css         # Responsive CSS styling
    └── app.js             # Frontend JavaScript logic
```

## 🛠️ Technology Stack

**Backend**
- Express.js - Web framework
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- body-parser - Request parsing
- cookie-parser - Cookie handling

**Frontend**
- Vanilla JavaScript - No framework dependencies
- CSS3 - Modern responsive design
- Fetch API - HTTP requests

**Database**
- JSON file storage - Simple and portable

## 📖 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event (Admin/Owner)
- `PUT /api/events/:id` - Update event (Admin/Owner)
- `DELETE /api/events/:id` - Delete event (Admin/Owner)

### Bookings
- `GET /api/bookings` - List bookings (filtered by role)
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Cancel booking

### Notifications
- `GET /api/notifications` - List user notifications
- `POST /api/notifications` - Send notification (Admin/Owner)
- `PUT /api/notifications/:id/read` - Mark as read

### Settings (Owner Only)
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

### Users (Owner Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user

## 🎨 Features Walkthrough

### As Owner
1. Login with owner credentials
2. Navigate to **Settings** to customize club name/description
3. Toggle **Maintenance Mode** to block users
4. Go to **Users** to create/manage admins and users
5. Access all admin features

### As Admin
1. Login with admin credentials
2. Click **Create Event** to add new events
3. Set event details: name, description, date, time, price, capacity
4. View all bookings in **Bookings** tab
5. Send notifications to users via **Notifications** tab

### As User
1. Login with user credentials
2. Browse available events on **Events** tab
3. Click **Book Now** to reserve tickets
4. View your bookings in **Bookings** tab
5. Check notifications in **Notifications** tab
6. Cancel bookings if needed

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- HTTP-only cookies
- Role-based authorization middleware
- Maintenance mode protection

## 🌐 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The app runs on port 3000 by default. Set `PORT` environment variable to change:
```bash
PORT=8080 npm start
```

## 📝 Database Schema

The `database.json` file contains:

```json
{
  "users": [
    {
      "id": 1,
      "username": "owner",
      "password": "hashed_password",
      "role": "owner",
      "name": "Club Owner"
    }
  ],
  "events": [
    {
      "id": 1234567890,
      "name": "Event Name",
      "description": "Event Description",
      "date": "2024-12-25",
      "time": "20:00",
      "price": 50,
      "capacity": 100,
      "createdBy": 1,
      "createdAt": "2024-12-17T14:00:00.000Z"
    }
  ],
  "bookings": [
    {
      "id": 1234567890,
      "userId": 3,
      "eventId": 1234567890,
      "tickets": 2,
      "totalPrice": 100,
      "status": "confirmed",
      "paymentStatus": "paid",
      "createdAt": "2024-12-17T14:00:00.000Z"
    }
  ],
  "notifications": [
    {
      "id": 1234567890,
      "userId": 3,
      "message": "Booking confirmed",
      "read": false,
      "createdAt": "2024-12-17T14:00:00.000Z"
    }
  ],
  "settings": {
    "maintenanceMode": false,
    "clubName": "Elite Club",
    "clubDescription": "Premium events and experiences"
  }
}
```

## 🎯 Key Highlights

✅ **Working Demo**: Fully functional application ready to run  
✅ **Complete Authentication**: Login system with role-based access  
✅ **Persistent Storage**: Data survives server restarts  
✅ **Real-time Updates**: Instant UI updates after actions  
✅ **Responsive Design**: Mobile-friendly interface  
✅ **Maintenance Mode**: Owner can block user access  
✅ **Booking Management**: Capacity tracking and validation  
✅ **Notification System**: In-app messaging  
✅ **Clean Code**: Well-organized and documented  

## 🐛 Troubleshooting

**Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=8080 npm start
```

**Database not initializing**
- Delete `database.json` and restart server
- File will be auto-created with default data

**Login not working**
- Clear browser cookies
- Use exact credentials from test accounts

## 📄 License

MIT License - feel free to use for any purpose

## 👨‍💻 Author

**Manveer**  
Built with ❤️ using Node.js and vanilla JavaScript

---

## 🎬 Demo

**Live Repository**: [https://github.com/manveerpro00-pixel/club-management-app](https://github.com/manveerpro00-pixel/club-management-app)

**Run Locally**:
```bash
git clone https://github.com/manveerpro00-pixel/club-management-app.git
cd club-management-app
npm install
npm run dev
```

Open `http://localhost:3000` and start managing your club! 🎉
