# main.py - Backend FastAPI compatible con tu frontend
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from typing import List, Optional
import uvicorn
import os
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if not settings.is_production else None,  # Ocultar docs en prod
    redoc_url="/redoc" if not settings.is_production else None
)

# CORS configurado para Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

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
    fecha_registro: datetime  # ✅ Cambiado para coincidir con frontend
    
    class Config:
        from_attributes = True

# ✅ MODELO ACTUALIZADO PARA COINCIDIR CON FRONTEND
class Statistics(BaseModel):
    total_alumnos: int
    alumnos_activos: int
    alumnos_inactivos: int
    por_curso: List[dict]  # ✅ Array como espera el frontend
    por_nivel: List[dict]  # ✅ Array como espera el frontend

# Base de datos simulada
students_db = [
    {
        "id": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan@email.com",
        "telefono": "123456789",
        "curso": "Matemáticas",
        "nivel": "Básico",
        "activo": True,
        "fecha_registro": datetime.now()
    },
    {
        "id": 2,
        "nombre": "María",
        "apellido": "García",
        "email": "maria@email.com",
        "telefono": "987654321",
        "curso": "Ciencias",
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
        "curso": "Historia",
        "nivel": "Avanzado",
        "activo": False,
        "fecha_registro": datetime.now()
    }
]

next_id = 4


# Health check para Render
@app.get("/")
async def root():
    return {
        "message": f"{settings.APP_NAME} - API funcionando",
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "docs": "/docs" if not settings.is_production else "disabled"
    }

# Health check para monitoreo
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/alumnos", response_model=List[Student])
async def get_students(
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    curso: Optional[str] = Query(None, description="Filtrar por curso"),
    nivel: Optional[str] = Query(None, description="Filtrar por nivel")
):
    """Obtener lista de alumnos con filtros opcionales"""
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
    try:
        student = next((s for s in students_db if s["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener alumno: {str(e)}")

@app.post("/alumnos", response_model=Student)
async def create_student(student: StudentCreate):
    """Crear un nuevo alumno"""
    try:
        global next_id
        
        # Verificar si el email ya existe
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
async def update_student(student_id: int, student_update: StudentUpdate):
    """Actualizar un alumno existente"""
    try:
        student = next((s for s in students_db if s["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
        # Actualizar campos
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
async def delete_student(student_id: int):
    """Eliminar un alumno"""
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
async def deactivate_student(student_id: int):
    """Desactivar un alumno"""
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
async def activate_student(student_id: int):
    """Activar un alumno"""
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

# ✅ ENDPOINT ACTUALIZADO PARA COINCIDIR CON FRONTEND
@app.get("/estadisticas", response_model=Statistics)
async def get_statistics():
    """Obtener estadísticas del sistema"""
    try:
        total_alumnos = len(students_db)
        alumnos_activos = len([s for s in students_db if s["activo"]])
        alumnos_inactivos = total_alumnos - alumnos_activos
        
        # ✅ Contar por curso (como array)
        cursos_count = {}
        for student in students_db:
            curso = student["curso"]
            cursos_count[curso] = cursos_count.get(curso, 0) + 1
        
        por_curso = [{"curso": curso, "cantidad": cantidad} for curso, cantidad in cursos_count.items()]
        
        # ✅ Contar por nivel (como array)
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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "timestamp": datetime.now().isoformat()
    }
