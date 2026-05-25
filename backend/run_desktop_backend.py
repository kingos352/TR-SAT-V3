import os
import sys
from pathlib import Path
import uvicorn

def main():
    # 1. Setup Runtime Data Directory & Database URL
    trsat_data_dir = os.environ.get("TRSAT_DATA_DIR")
    if trsat_data_dir:
        data_path = Path(trsat_data_dir)
        data_path.mkdir(parents=True, exist_ok=True)
        db_path = data_path / "trsat_v3.sqlite"
        # Ensure we use an absolute path for SQLAlchemy SQLite URL
        os.environ["DATABASE_URL"] = f"sqlite:///{db_path.resolve()}"
        
        # Load the user's .env file from AppData
        env_path = data_path / ".env"
        if env_path.exists():
            from dotenv import load_dotenv
            load_dotenv(env_path)
    
    # 2. Get Port
    port = int(os.environ.get("TRSAT_DESKTOP_PORT", 8000))
    
    # 3. Import app AFTER environment variables are set so Pydantic picks them up
    from app.main import app
    
    # 4. Start Uvicorn
    # Use loop="asyncio" to prevent some Windows proactor event loop issues if any,
    # though standard is fine.
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

if __name__ == "__main__":
    main()
