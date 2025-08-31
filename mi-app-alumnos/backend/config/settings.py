import os
from typing import List

class Settings:
    # Base
    APP_NAME: str = "API Gestión de Alumnos"
    VERSION: str = "1.0.0"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Database - Render proporciona DATABASE_URL automáticamente
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./alumnos.db")
    
    # CORS - Render necesita configuración específica
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000"
    ).split(",")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    
    # Render específico
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def is_staging(self) -> bool:
        return self.ENVIRONMENT == "staging"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

settings = Settings()