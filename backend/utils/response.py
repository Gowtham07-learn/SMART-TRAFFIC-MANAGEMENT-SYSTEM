from datetime import datetime, timezone
from fastapi.responses import JSONResponse

def success(data, status_code: int = 200):
    return JSONResponse(status_code=status_code, content={"success": True, "data": data, "timestamp": datetime.now(timezone.utc).isoformat()})

def error(message: str, detail: str | None = None, status_code: int = 400):
    return JSONResponse(status_code=status_code, content={"success": False, "error": message, "detail": detail, "timestamp": datetime.now(timezone.utc).isoformat()})
