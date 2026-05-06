import random
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.junction import Junction
from models.signal import TrafficSignal
from models.analytics import SimulationResult
from services.signal_service import clamp
from utils.geo import within_coimbatore, COIMBATORE_BOUNDS


async def run_simulation(db: AsyncSession, simulation_id: str, scenario: dict):
    try:
        j_result = await db.execute(
            select(Junction).where(
                Junction.latitude.between(COIMBATORE_BOUNDS["lat_min"], COIMBATORE_BOUNDS["lat_max"]),
                Junction.longitude.between(COIMBATORE_BOUNDS["lon_min"], COIMBATORE_BOUNDS["lon_max"]),
            )
        )
        junctions = [j for j in j_result.scalars().all() if within_coimbatore(j.latitude, j.longitude)]
        s_result = await db.execute(select(TrafficSignal))
        signals = {str(s.junction_id): s for s in s_result.scalars().all()}

        modified = {m["junction_id"]: m for m in scenario.get("modified_junctions", [])}
        duration = scenario.get("duration_minutes", 60)

        junction_results = []
        for j in junctions:
            jid = str(j.id)
            signal = signals.get(jid)
            if not signal:
                continue

            base_ns = signal.green_duration_ns
            base_ew = signal.green_duration_ew
            mod_ns = clamp(modified.get(jid, {}).get("green_ns", base_ns))
            mod_ew = clamp(modified.get(jid, {}).get("green_ew", base_ew))

            cycle = base_ns + base_ew + 10
            mod_cycle = mod_ns + mod_ew + 10

            vehicles_per_min = random.randint(10, 40)
            total_vehicles = vehicles_per_min * duration

            baseline_delay = (cycle / 2) * random.uniform(0.8, 1.2)
            scenario_delay = (mod_cycle / 2) * random.uniform(0.7, 1.1)

            baseline_throughput = int((base_ns + base_ew) / cycle * vehicles_per_min * 60)
            scenario_throughput = int((mod_ns + mod_ew) / mod_cycle * vehicles_per_min * 60)

            improvement = round(
                ((baseline_delay - scenario_delay) / baseline_delay) * 100, 1
            ) if baseline_delay > 0 else 0

            junction_results.append({
                "junction_id": jid,
                "junction_name": j.name,
                "baseline_avg_delay_seconds": round(baseline_delay, 1),
                "scenario_avg_delay_seconds": round(scenario_delay, 1),
                "improvement_percent": improvement,
                "baseline_throughput_vph": baseline_throughput,
                "scenario_throughput_vph": scenario_throughput,
                "peak_queue_length": random.randint(5, 30),
                "total_vehicles_simulated": total_vehicles
            })

        avg_improvement = round(
            sum(r["improvement_percent"] for r in junction_results) / len(junction_results), 1
        ) if junction_results else 0

        final_results = {
            "summary": {
                "total_junctions": len(junction_results),
                "duration_minutes": duration,
                "avg_improvement_percent": avg_improvement,
                "total_vehicles_simulated": sum(r["total_vehicles_simulated"] for r in junction_results)
            },
            "junctions": junction_results
        }

        sim_result = await db.get(SimulationResult, simulation_id)
        if sim_result:
            sim_result.results = final_results
            sim_result.status = "COMPLETE"
            sim_result.completed_at = datetime.utcnow()
            await db.commit()

    except Exception as e:
        sim_result = await db.get(SimulationResult, simulation_id)
        if sim_result:
            sim_result.status = "FAILED"
            sim_result.results = {"error": str(e)}
            await db.commit()
