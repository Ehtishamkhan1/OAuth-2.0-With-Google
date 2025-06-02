# 🔐 Expo Router Auth Flow (Access & Refresh Token Based)

A complete Expo Router authentication setup using **Google OAuth**, **Access + Refresh tokens**, `expo-auth-session`, and secure session handling for **Web and Mobile**. This project includes:

- Secure Google Sign-In using PKCE
- JWT-based access and refresh tokens
- Cookie storage on Web, SecureStore on Mobile
- Protected API routes using a custom `withAuth` middleware
- Cross-platform support (Web + Native)

---

## 📁 Project Overview

This project uses:

- **Expo Router**
- **expo-auth-session**
- **SecureStore** (mobile)
- **Cookies** (web)
- **JWT (with jose)**
- **Custom API routes**
- **Google OAuth**

The auth flow is fully managed via a single context (`AuthContext`) and a reusable API middleware (`withAuth`) that protects routes.

---

## 🛠️ Installation & Setup

1. **Clone the repo**

```bash
git https://github.com/Ehtishamkhan1/OAuth-2.0-With-Google
cd OAuth-2.0-With-Google