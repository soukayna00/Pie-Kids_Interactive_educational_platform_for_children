🎮 PIE Kids

**PIE Kids** is an interactive web platform designed to make learning fun and engaging for children.
The project combines **education and gamification** to create a playful learning experience.


## 💡 About the Project

PIE Kids aims to provide a child-friendly environment where kids can learn through interaction, games, and visual content.

The main goal is to:

* Encourage kids to learn while having fun
* Improve engagement using interactive UI
* Create a simple and intuitive experience for young users

---

## ✨ Features

* 🎨 Kid-friendly and colorful UI
* 🧠 Interactive learning activities
* 🎮 Game-inspired experience
* 📱 Responsive design
* ⚡ Fast and simple navigation

---

## 🛠️ Tech Stack

**Frontend**

*React

**Backend** 

* Node.js / Express

**Database** 

* MongoDB

---
-

## Run locally with Docker

Start Docker Desktop and open PowerShell in the `PIE-KIDS` folder.
On first setup, generate a local JWT secret in the root `.env` file:

```powershell
if (!(Test-Path .env)) {
    $pieKidsSecret = node -p "require('node:crypto').randomBytes(32).toString('hex')"
    "PIE_KIDS_JWT_SECRET=$pieKidsSecret" | Set-Content -Encoding ascii .env
}
docker compose up --build -d
```

Open [PIE Kids](http://localhost:3000). The API is on
[localhost:4000](http://localhost:4000). Check startup with `docker compose ps`
and `docker compose logs backend`.

Vite watches `front-end/src` and `front-end/public` through Docker bind mounts.
Save a React, CSS, or image change and the browser updates automatically.
Rebuild the frontend with `docker compose up -d --build frontend` when you
change frontend dependencies, the Dockerfile, or the Vite configuration.

The default MongoDB container starts with an empty database. To use an existing
MongoDB instance, set `PIE_KIDS_MONGO_URL` in the root `.env` to a connection
string reachable from the backend container. MongoDB data and uploaded files
persist across `docker compose down` and subsequent restarts.

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the project and submit a pull request.

---


---

## ⭐ Support

If you like this project, don’t forget to ⭐ the repo!

