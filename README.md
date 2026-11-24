<p align="center">
  <img src="./front-end/public/assets/mario-shell.png" width="135" alt="Mario holding a green shell" />
</p>

<h1 align="center">🪙 PIE KIDZ</h1>

<p align="center"><strong>Save for it. Think before you spend. Make a plan.</strong></p>

<p align="center">
  A playful learning platform where kids practice everyday money decisions.
</p>

<p align="center">
  <a href="https://pie-kidz-frontend.vercel.app">
    <img src="https://img.shields.io/badge/▶_Play_the_live_demo-A83226?style=for-the-badge" alt="Play the live demo" />
  </a>
</p>

## 🎮 Pick a money mission

| Mission | What you’ll practice |
| --- | --- |
| 🪙 **Save for a Goal** | Pick something you want and figure out how much to set aside each week. |
| 🛒 **Spend Wisely** | Decide what you need today and what can wait. |
| 🧩 **Make a Budget** | Give your money a plan before you spend it. |

**Try a mission.** You’re saving for something you really want, but you spot a treat you could buy today. Would you buy it, wait, or change your savings plan?

## 🍄 Explore the platform

- **Students** can browse lessons, enroll in courses, and practice with quizzes.
- **Educators** can create courses, add chapters and downloadable resources, and build quizzes.

## 🛠️ Behind the game

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express, JWT |
| Database | MongoDB, Mongoose |
| Local development | Docker Compose |
| Deployment | Vercel, Render, MongoDB Atlas |

## 🚀 Run it locally

Start Docker Desktop and open PowerShell in the repository root. With Node.js installed, run:

```powershell
if (!(Test-Path .env)) {
    $pieKidsSecret = node -p "require('node:crypto').randomBytes(32).toString('hex')"
    "PIE_KIDS_JWT_SECRET=$pieKidsSecret" | Set-Content -Encoding ascii .env
}

docker compose up --build -d
```

- **Play locally** at [localhost:3000](http://localhost:3000/)
- **Check the API** at [localhost:4000/health](http://localhost:4000/health)

The local MongoDB database starts empty. Create a course in the teacher portal to populate the lesson catalog. To connect to an existing MongoDB instance, set `PIE_KIDS_MONGO_URL` in the root `.env` to a connection string the backend container can reach.

Vite reloads changes in `front-end/src` and `front-end/public`. If you change frontend dependencies, the Dockerfile, or the Vite configuration, rebuild with `docker compose up -d --build frontend`. Use `docker compose logs backend` to check backend startup.

## 🤝 Contributing

Fork the repo, make your changes on a branch, and open a pull request.
