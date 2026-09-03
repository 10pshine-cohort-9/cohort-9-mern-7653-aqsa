# cohort-9-mern-7653-aqsa
Cohort 9 — MERN (NodeJS+ReactJS) assignment for Aqsa Arif

# 📝 Notes App

A full-stack Notes Management Application built using the **MERN Stack** and **Tailwind CSS**.

Notes App is a productivity application where users can create multipage notes, add different types of content such as text, drawings, images, videos, and audio, organize notes using folders and categories, manage tasks, export notes as PDF, and quickly write ideas using a Sticky Wall.
---

## 🚀 Features

### Multipage Notes

- Create multipage notes
- Add and manage multiple pages inside a note
- Add text content
- Add drawings
- Add images
- Add videos
- Add audio
- Organize notes using categories
- Organize notes using folders

### Folders & Categories

- Create folders to organize notes
- Assign categories to notes
- Easily manage and organize different types of notes

### Export Notes

- Export notes as PDF
- Save notes for offline use
- Print or share exported notes

### Task Management

The application includes a dedicated task section similar to a To-Do list.

Users can:

- Create tasks
- Add task details
- Set task priority
- Select task dates
- Manage and organize tasks

### Sticky Wall

A Sticky Wall is included for quickly capturing:

- Quick notes
- Ideas
- Reminders
- Important information
- Temporary notes

### Authentication

- JWT-based authentication
- Google OAuth authentication
- Protected user resources
- User-specific notes and tasks

### Media Uploads

The application uses **Cloudinary** for storing and managing media such as:

- Images
- Videos
- Audio
- Other uploaded files

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- JavaScript
- Jest

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Google OAuth
- Cloudinary
- Nodemailer
- Mocha
- Chai

---

# 🧪 Testing

Testing has been implemented for both the frontend and backend.

## Backend Testing

Backend testing is done using:

- Mocha
- Chai

> **Note:** Backend tests run against `MONGO_TEST_URI` and require an active **MongoDB Replica Set** (e.g., local standalone replica set `rs0` or an in-memory runner like `mongodb-memory-server`) to support database transactions during test runs.

## Frontend Testing

Frontend testing is done using:

- Jest

---

## Environment Variables

### Backend Configuration 

Create a `.env` file in the `backend` directory and configure the following variables:
```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/notes-app
MONGO_TEST_URI=mongodb://127.0.0.1:27017/notes-app-test?replicaSet=rs0

JWT_SECRET=<jwt_secret_key>
GOOGLE_CLIENT_ID=<google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<google_oauth_client_secret>

FRONTEND_URL=http://localhost:5173
FRONTEND_ORIGINS=http://localhost:5173

CLOUDINARY_CLOUD_NAME=<cloudinary_name>
CLOUDINARY_API_KEY=<cloudinary_api_key>
CLOUDINARY_API_SECRET=<cloudinary_api_secret>

EMAIL_USER=<smtp_email>
EMAIL_PASS=<smtp_app_password>
```
### Frontend Configuration

Create a `.env` file in the `frontend` directory and configure the following variable:

```env
VITE_API_URL=http://localhost:5000/api
```
## 💻 Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed with a configured replica set for testing

### 1. Clone the Repository
```bash
git clone <repository_url>
cd <repository_folder>
```
### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```
## 🚦 Running Tests

### Backend Tests
From the `backend` directory:
```bash
npm test
```
### Frontend Tests
From the `frontend` directory:
```bash
npm test
```