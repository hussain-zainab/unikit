# 🎓 Unikit — University Management System

Unikit is a full-stack university management platform designed to replace traditional manual systems with a modern, efficient, and secure digital solution.

---

## 🚀 Features

* 📊 **Smart Attendance System**
  Eliminates manual attendance with real-time tracking and management.

* 📢 **Centralized Announcements**
  No need for WhatsApp groups — all updates in one place.

* 💬 **Batch Communication**
  Teachers can communicate directly with their assigned batches.

* 🕵️ **Anonymous Complaints System**
  Students can report issues safely without revealing identity.

* 👨‍🏫 **Role-Based Access**
  Separate dashboards for Admin, HOD, Teachers, and Students.

* 🔐 **Authentication & Security**
  JWT-based authentication with protected routes.

---

## 🏗️ Tech Stack

### Frontend

* React Native (Expo)
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB

---

## 📂 Project Structure

```
unikit/
│
├── backend/     # Express server & APIs
├── frontend/    # React Native app (Expo)
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```
git clone https://github.com/hussain-zainab/unikit.git
cd unikit
```

---

### 2. Backend Setup

```
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/unikit
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

Run backend:

```
npm run dev
```

---

### 3. Frontend Setup

```
cd frontend
npm install
npx expo start
```

---

## 🌐 API Configuration

Update your backend IP in:

```
frontend/src/constants/config.js
```

Example:

```
export const API_URL = "http://192.168.0.2:5000";
```

---

## 🔑 Demo Credentials

```
HOD:     hod@university.edu     / hod@123
Admin:   admin@university.edu   / admin@123
Teacher: teacher@university.edu / (set on first login)
Student: student@university.edu / (set on first login)
```

---

## 🎯 Problem Solved

* ❌ Manual attendance errors
* ❌ Scattered communication (WhatsApp groups)
* ❌ Lack of privacy for complaints
* ❌ Inefficient administrative workflows

---

## 💡 Future Improvements

* Cloud deployment (AWS / Render / Firebase)
* Push notifications
* Analytics dashboard
* Role-based permissions enhancement

---

## 📌 Author

**Zainab Hussain**
GitHub: https://github.com/hussain-zainab

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and share it!
