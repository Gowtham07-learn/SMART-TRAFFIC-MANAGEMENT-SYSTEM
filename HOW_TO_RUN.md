# How To Run (STMS)

## 1) Start Backend

```bash
cd backend
python -m venv venv
```

Activate virtual environment:

- Windows (PowerShell):
```powershell
venv\Scripts\Activate.ps1
```

- Windows (CMD):
```cmd
venv\Scripts\activate.bat
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create environment file:

```bash
copy .env.example .env
```

Update `.env` if needed (especially `DATABASE_URL` password).

Make sure PostgreSQL and Redis are running, then create DB:

```bash
createdb stms
```

Seed test data:

```bash
python seed.py
```

Run backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend URLs:

- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 2) Start Frontend

Open a new terminal at project root:

```bash
npm install
npm run dev
```

Frontend URL (Vite default): [http://localhost:5173](http://localhost:5173)

---

## 3) Test Login Credentials

Password for all users: `test1234`

- `admin@gmail.com` (ADMIN)
- `traffic@gmail.com` (TRAFFIC_CONTROLLER)
- `driver@gmail.com` (EMERGENCY_DRIVER)
- `citizen@gmail.com` (CITIZEN)

---

## 4) WebSocket Endpoint

Use access token from login:

`ws://localhost:8000/ws/traffic?token=<JWT_ACCESS_TOKEN>`

---

## 5) Common Troubleshooting

- **DB connection error**: verify PostgreSQL is running and `.env` credentials are correct.
- **Redis error**: start Redis locally and confirm `REDIS_URL`.
- **401 on API**: log in again and ensure `Authorization: Bearer <token>` is sent.
- **CORS issue**: run frontend on `localhost:5173` or add your origin in backend CORS list.
