# Ugotta - Recommendation Social Media / Tracking Application

**ugotta.space** is a full-stack social recommendation tracker and diary for movies, TV shows, and music. Users can log and revisit their favorite recommendations, connect with friends, and share picks directly through in-app messaging — all in one place.

---

## Team — POOSD Group 6

| Name | Role | Contact |
|---|---|---|
| Evan Jania | PM / Front End | evanjania@gmail.com |
| Logan Elkins | API | loganelkins0101@gmail.com |
| Kevin Estrada | Database | kevinkevin2796@gmail.com |
| Siddanth Rajan | Mobile | sid.rajan1323@gmail.com |
| Erkan Altundal | API | erkankerem532@gmail.com |
| Benjamin Quintero | Mobile | email |

---

## Overview

ugotta.space is a MERN stack web application that combines a personal recommendation diary with a social layer. Users maintain a private, organized diary of movie, TV, and music recommendations while also being able to connect with friends, open direct chats, and exchange recommendations seamlessly.

---

## Features

### Authentication & Account Management
- Secure sign-up and login with email verification before account activation
- Password reset flow for forgotten credentials
- Protected routes — dashboard and all features require authentication

### Recommendation Diary
- Personal diary organized into three categories: **Movies**, **TV Shows**, and **Music**
- Add new recommendations to any category at any time
- Browse and reference your full recommendation history from the dashboard

### Friends & Social
- Search and add friends using their registered username
- Friends list management from the dashboard
- Open direct chats with any friend
- Send recommendations directly through chat
- Receive a friend's recommendation and add it straight to your own diary

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js, Express |
| Database | MongoDB |
| Runtime | Node.js |

---

## Project Structure

```
ugotta.space/
├── client/          # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── App.js
├── server/          # Node.js / Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── index.js
├── .env             # Environment variables (not committed)
├── .gitignore
├── LICENSE
└── README.md
```

---

## Environment Variables

A `.env` file is required in the project root. It is not committed to version control. Required variables include:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=your_email_provider
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
PORT=5000
```

---

## Accessing the Application

Once deployed, open a browser and navigate to:

```
https://ugotta.space/
```

- Register a new account on the login/signup page and verify your email
- Log in to access your personal recommendation dashboard
- Add, browse, and manage your movie, TV, and music recommendations
- Connect with friends, open chats, and share recommendations

---

## Assumptions & Limitations

- This is a course project and is **not intended for production use** in its current state. Security hardening should be applied before any real-world deployment.
- Email verification is implemented for account creation, but the email service configuration depends on the environment variables being correctly set.
- The friends and messaging system is designed for direct one-on-one chats; group messaging is not supported.
- The application is optimized for desktop browsers; mobile responsiveness may be limited.
- Recommendation entries are user-generated and rely on manually entered data — there is no external API validation of movie, TV, or music titles.

---

## AI Usage

This project was developed with assistance from Claude (Anthropic) and ChatGPT (OpenAI) for code review, debugging, and documentation, in accordance with class policy.

---

## License

This project is licensed under the [MIT License](LICENSE).
