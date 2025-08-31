# main.py - Backend FastAPI con seguridad y datos temporales
from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config.settings import settings
from typing import List, Optional
import uvicorn
import os
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
import asyncio

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None
)

# 🔐 Configuración de seguridad
security = HTTPBearer(auto_error=False)
API_KEY = os.getenv("API_KEY", "demo-key-2024")

# CORS configurado para producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",  # Permitir todos los subdominios de Vercel
        "https://api-alumnos-1-u8gk.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# 🔐 Función de autenticación
async def get_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Autenticación con API Key para operaciones de escritura"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere API Key para esta operación"
        )
    
    if credentials.credentials != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida"
        )
    return credentials.credentials

# Modelos Pydantic
class StudentBase(BaseModel):
    nombre: str
    apellido: str
    email: str
    telefono: Optional[str] = None
    curso: str
    nivel: str
    activo: bool = True

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    curso: Optional[str] = None
    nivel: Optional[str] = None
    activo: Optional[bool] = None

class Student(StudentBase):
    id: int
    fecha_registro: datetime
    
    class Config:
        from_attributes = True

class Statistics(BaseModel):
    total_alumnos: int
    alumnos_activos: int
    alumnos_inactivos: int
    por_curso: List[dict]
    por_nivel: List[dict]

# 🔄 Base de datos temporal que se resetea cada 30 minutos
INITIAL_STUDENTS = [
    {
        "id": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan@email.com",
        "telefono": "123456789",
        "curso": "Python para Principiantes",
        "nivel": "Principiante",
        "activo": True,
        "fecha_registro": datetime.now()
    },
    {
        "id": 2,
        "nombre": "María",
        "apellido": "García",
        "email": "maria@email.com",
        "telefono": "987654321",
        "curso": "JavaScript Avanzado",
        "nivel": "Intermedio",
        "activo": True,
        "fecha_registro": datetime.now()
    },
    {
        "id": 3,
        "nombre": "Carlos",
        "apellido": "López",
        "email": "carlos@email.com",
        "telefono": "555666777",
        "curso": "Data Science",
        "nivel": "Avanzado",
        "activo": False,
        "fecha_registro": datetime.now()
    }
]

# Variables globales para datos temporales
students_db = INITIAL_STUDENTS.copy()
next_id = 4
last_reset = datetime.now()

# 🔄 Función para resetear datos cada 30 minutos
def reset_data_if_needed():
    global students_db, next_id, last_reset
    
    if datetime.now() - last_reset > timedelta(minutes=30):
        students_db = INITIAL_STUDENTS.copy()
        next_id = 4
        last_reset = datetime.now()
        print("🔄 Datos reseteados automáticamente")

# 🌐 Endpoints públicos (solo lectura)
@app.get("/")
async def root():
    reset_data_if_needed()
    return {
        "message": f"{settings.APP_NAME} - API Demo funcionando",
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "demo_info": {
            "descripcion": "API de demostración - Los datos se resetean cada 30 minutos",
            "ultimo_reset": last_reset.isoformat(),
            "proximo_reset": (last_reset + timedelta(minutes=30)).isoformat()
        },
        "docs": "/docs" if not settings.is_production else "disabled"
    }

@app.get("/health")
async def health_check():
    reset_data_if_needed()
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "timestamp": datetime.now().isoformat(),
        "total_students": len(students_db),
        "demo_mode": True
    }

@app.get("/alumnos", response_model=List[Student])
async def get_students(
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    curso: Optional[str] = Query(None, description="Filtrar por curso"),
    nivel: Optional[str] = Query(None, description="Filtrar por nivel")
):
    """Obtener lista de alumnos con filtros opcionales"""
    reset_data_if_needed()
    
    try:
        filtered_students = students_db.copy()
        
        if activo is not None:
            filtered_students = [s for s in filtered_students if s["activo"] == activo]
        
        if curso:
            filtered_students = [s for s in filtered_students if s["curso"].lower() == curso.lower()]
        
        if nivel:
            filtered_students = [s for s in filtered_students if s["nivel"].lower() == nivel.lower()]
        
        return filtered_students
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener alumnos: {str(e)}")

@app.get("/alumnos/{student_id}", response_model=Student)
async def get_student(student_id: int):
    """Obtener un alumno por ID"""
    reset_data_if_needed()
    
    try:
        student = next((s for s in students_db if s["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener alumno: {str(e)}")

@app.get("/estadisticas", response_model=Statistics)
async def get_statistics():
    """Obtener estadísticas del sistema"""
    reset_data_if_needed()
    
    try:
        total_alumnos = len(students_db)
        alumnos_activos = len([s for s in students_db if s["activo"]])
        alumnos_inactivos = total_alumnos - alumnos_activos
        
        cursos_count = {}
        for student in students_db:
            curso = student["curso"]
            cursos_count[curso] = cursos_count.get(curso, 0) + 1
        
        por_curso = [{"curso": curso, "cantidad": cantidad} for curso, cantidad in cursos_count.items()]
        
        niveles_count = {}
        for student in students_db:
            nivel = student["nivel"]
            niveles_count[nivel] = niveles_count.get(nivel, 0) + 1
        
        por_nivel = [{"nivel": nivel, "cantidad": cantidad} for nivel, cantidad in niveles_count.items()]
        
        return {
            "total_alumnos": total_alumnos,
            "alumnos_activos": alumnos_activos,
            "alumnos_inactivos": alumnos_inactivos,
            "por_curso": por_curso,
            "por_nivel": por_nivel
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")

# 🔐 Endpoints protegidos (requieren API Key)
@app.post("/alumnos", response_model=Student)
async def create_student(student: StudentCreate, api_key: str = Depends(get_api_key)):
    """Crear un nuevo alumno (requiere API Key)"""
    reset_data_if_needed()
    
    try:
        global next_id
        
        if any(s["email"] == student.email for s in students_db):
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        new_student = {
            "id": next_id,
            **student.model_dump(),
            "fecha_registro": datetime.now()
        }
        
        students_db.append(new_student)
        next_id += 1
        
        return new_student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear alumno: {str(e)}")

@app.put("/alumnos/{student_id}", response_model=Student)
async def update_student(student_id: int, student_update: StudentUpdate, api_key: str = Depends(get_api_key)):
    """Actualizar un alumno existente (requiere API Key)"""
    reset_data_if_needed()
    
    try:
        student = next((s for s in students_db if s["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
        update_data = student_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field in student:
                student[field] = value
        
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar alumno: {str(e)}")

@app.delete("/alumnos/{student_id}")
async def delete_student(student_id: int, api_key: str = Depends(get_api_key)):
    """Eliminar un alumno (requiere API Key)"""
    reset_data_if_needed()
    
    try:
        global students_db
        student = next((s for s in students_db if s["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
        students_db = [s for s in students_db if s["id"] != student_id]
        
        return {"message": "Alumno eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar alumno: {str(e)}")

@app.patch("/alumnos/{student_id}/desactivar")
async def deactivate_student(student_id: int, api_key: str = Depends(get_api_key)):
    """Desactivar un alumno (requiere API Key)"""
    reset_data_if_needed()
    
    try:
        student = next((s for s in students_db if s["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
        student["activo"] = False
        
        return {"message": "Alumno desactivado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al desactivar alumno: {str(e)}")

@app.patch("/alumnos/{student_id}/activar")
async def activate_student(student_id: int, api_key: str = Depends(get_api_key)):
    """Activar un alumno (requiere API Key)"""
    reset_data_if_needed()
    
    try:
        student = next((s for s in students_db if s["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
        student["activo"] = True
        
        return {"message": "Alumno activado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al activar alumno: {str(e)}")

# 🔄 Endpoint para resetear datos manualmente (solo para demo)
@app.post("/reset-demo")
async def reset_demo_data(api_key: str = Depends(get_api_key)):
    """Resetear datos de demostración manualmente"""
    global students_db, next_id, last_reset
    
    students_db = INITIAL_STUDENTS.copy()
    next_id = 4
    last_reset = datetime.now()
    
    return {
        "message": "Datos de demostración reseteados exitosamente",
        "timestamp": last_reset.isoformat(),
        "total_students": len(students_db)
    }

if __name__ == "__main__":
    print("🚀 Iniciando API de Alumnos (Modo Demo)...")
    print(f"📍 API disponible en: http://0.0.0.0:{os.getenv('PORT', 8000)}")
    print("📍 Documentación en: /docs")
    print("🔐 Operaciones de escritura protegidas con API Key")
    print("🔄 Datos se resetean automáticamente cada 30 minutos")
    print("="*50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False
    )
