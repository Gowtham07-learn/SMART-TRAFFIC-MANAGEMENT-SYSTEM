import random
from datetime import datetime, timedelta

async def get_forecast(junction_id: str, minutes_ahead: int = 30) -> dict:
    base_volume = random.randint(40, 80)
    points = []
    now = datetime.utcnow()

    for i in range(0, minutes_ahead + 1, 5):
        if i <= 15:
            multiplier = 1 + (i / 15) * random.uniform(0.8, 1.2)
        else:
            multiplier = 1 + ((30 - i) / 15) * random.uniform(0.6, 1.0)

        volume = max(5, int(base_volume * multiplier * random.uniform(0.9, 1.1)))
        congestion_prob = min(0.95, volume / 200)

        if volume < 50: level = "LOW"
        elif volume < 100: level = "MEDIUM"
        elif volume < 150: level = "HIGH"
        else: level = "CRITICAL"

        points.append({"timestamp": (now + timedelta(minutes=i)).isoformat() + "Z", "minutes_from_now": i, "junction_id": junction_id, "predicted_volume": volume, "congestion_probability": round(congestion_prob, 3), "congestion_level": level})

    return {"junction_id": junction_id, "forecast": points, "peak_at_minutes": 15, "peak_volume": max(p["predicted_volume"] for p in points), "model": "LSTM-simulated", "accuracy_percent": 83}
