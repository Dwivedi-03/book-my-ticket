Here’s your **UPDATED README (aligned with your CURRENT project: Docker + PostgreSQL + Movies + Shows + Seats system + improved schema)** 🔥

I’ve cleaned old parts, fixed mismatches, and upgraded it to your latest architecture.

---

# 🎬 Sakura Cinema - Movie Ticket Booking System

A full-stack movie ticket booking system with authentication, multi-movie support, showtimes, and seat booking — built using **Node.js, Express, PostgreSQL (Docker), and Vanilla Frontend**.

---

## 🚀 Features

### 🔐 Authentication System

* Sign up with first name, last name, username, email
* Secure login with bcrypt password hashing
* Session-based authentication
* Protected booking routes

---

### 🎬 Movie Management

* Multiple movies supported
* Japanese + English titles
* Genre, rating, duration, poster support
* Active/inactive movie system

---

### 🕒 Showtimes System

* Each movie has multiple shows
* Show-specific pricing
* Independent seat mapping per show

---

### 💺 Seat Booking System

* Real-time seat availability per show
* Transaction-safe booking (PostgreSQL locking)
* Prevents double booking
* User-specific booking history

---

### 🎨 Modern UI

* Japanese cinema-inspired design
* Tailwind CSS styling
* Responsive layout
* Dynamic seat grid system

---

## 🧰 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Dockerized)
* **Auth:** bcrypt + express-session
* **Frontend:** HTML, Tailwind CSS, Vanilla JS
* **DevOps:** Docker + Docker Compose

---

## 📦 Project Structure

```
movie-ticket-app/
│
├── index.mjs          # Express backend API
│
├── index.html         # Frontend UI
│
├── schema.sql         # PostgreSQL schema
│
├── docker-compose.yml
├── Dockerfile
├── package.json
├── .env
└── README.md
```

---

## 🗄️ Database Setup

### 1️⃣ Create Database via Docker

```bash
docker-compose up -d
```

---

### 2️⃣ Run Schema

```bash
docker exec -i movie_postgres psql -U postgres -d moviedb < db/schema.sql
```

---

## 🧱 Database Schema Overview

### 👤 Users

* first_name
* last_name
* username
* email
* password

---

### 🎬 Movies

* title (English)
* title_japanese
* description
* duration
* genre
* rating

---

### 🕒 Shows

* movie_id (FK)
* show_time
* price
* screen_name

---

### 💺 Seats

* show_id (FK)
* seat_number
* row_label
* is_booked
* user_id

---

### 🎟️ Bookings

* user_id
* show_id
* seat_id
* status

---

### 💳 Payments (optional)

* booking_id
* amount
* payment_status

---

## 🚀 Running the Project

### 🔧 Development Mode

```bash
docker-compose up --build
```

---

### 🌐 Access App

* Frontend:

```
http://localhost:3000
```

* API Test:

```
http://localhost:3000/api
```

---

## 🔌 API Endpoints

### 🔐 Auth

* `POST /api/signup`
* `POST /api/login`
* `POST /api/logout`
* `GET /api/check-auth`

---

### 🎬 Movies

* `GET /api/movies`

---

### 🕒 Shows

* `GET /api/shows/:movieId`

---

### 💺 Seats

* `GET /api/seats/:showId`
* `PUT /api/book/:seatId`

---

### 🎟️ Bookings

* `GET /api/my-bookings`

---

## 🔒 Security Features

* Password hashing (bcrypt)
* SQL injection protection (parameterized queries)
* Session authentication
* Row-level locking for seat booking
* Transaction-safe booking system

---

## ⚙️ Docker Setup

### Start containers

```bash
docker-compose up -d
```

### Stop containers

```bash
docker-compose down
```

### Reset database

```bash
docker-compose down -v
```

---

## 📈 Future Enhancements

* ⚡ WebSocket real-time seat updates
* 🎫 QR ticket generation
* 💳 Payment gateway integration
* 🎬 Admin panel (movies + shows management)
* ⏱ Seat reservation timer (10 min hold system)
* 📱 Mobile responsive PWA version

---

## 🧠 What this project demonstrates

* Full-stack architecture design
* Relational database modeling
* Transaction-safe booking system
* Docker-based development environment
* Real-world booking system logic (like BookMyShow)

---

## ❤️ Author

Built with passion for learning real-world backend systems + cinema booking logic 🎬
