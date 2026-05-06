from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from config import settings


def _build_engine_url_and_args(raw_url: str):
    connect_args = {}
    db_url = raw_url

    # asyncpg does not accept `sslmode` in the DSN query string.
    # For Supabase SSL, pass it as connect_args instead.
    if "sslmode=" in db_url:
        parts = urlsplit(db_url)
        qs = parse_qsl(parts.query, keep_blank_values=True)
        sslmode = None
        filtered = []
        for key, value in qs:
            if key.lower() == "sslmode":
                sslmode = value
            else:
                filtered.append((key, value))

        db_url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(filtered), parts.fragment))
        if sslmode and sslmode.lower() in {"require", "verify-ca", "verify-full"}:
            connect_args["ssl"] = "require"

    return db_url, connect_args


engine_url, engine_connect_args = _build_engine_url_and_args(settings.DATABASE_URL)

engine = create_async_engine(
    engine_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=engine_connect_args,
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
