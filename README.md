# AI Event Management Platform

An AI-powered event management platform built with the MERN stack, featuring intelligent event content generation, real-time updates, and secure user authentication.

## 🚀 Features

* **AI Event Generation**: Automatically generate detailed event descriptions, agendas, and highlights using Google Gemini AI.
* **Real-time Interaction**: Integrated Socket.io for live updates and notifications.
* **Secure Authentication**: User management and role-based access control (Organizers vs. Users) powered by Clerk.
* **Dynamic Visuals**: Automatic cover image fetching via the Unsplash API based on event categories.
* **Ticketing System**: Secure registration and ticket management for attendees.
* **Interactive UI**: Modern, responsive interface built with React, Vite, and Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
* **Framework**: React (Vite)
* **Styling**: Tailwind CSS
* **Authentication**: Clerk SDK
* **Animations**: Framer Motion
* **Icons**: Lucide React

### Backend
* **Environment**: Node.js & Express
* **Database**: MongoDB with Mongoose
* **AI Engine**: Google Gemini API
* **Real-time**: Socket.io
* **Validation**: Zod

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user |
| **POST** | `/api/auth/login` | User login |
| **GET** | `/api/events` | Fetch all public events |
| **POST** | `/api/events` | Create a new event (Organizer only) |
| **POST** | `/api/tickets/register` | Register a user for an event |
| **GET** | `/api/tickets/me` | Fetch tickets for the logged-in user |
| **POST** | `/api/ai/generate` | Generate event content using Gemini AI |

---

