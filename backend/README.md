# Smart Traffic Management System — Backend

## Setup
cd backend
pip install -r requirements.txt
cp .env.example .env
python seed.py
uvicorn main:app --reload --port 8000
