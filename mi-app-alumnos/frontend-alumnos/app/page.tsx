"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import type { Student, Statistics } from "@/types/student"
import { Users, UserCheck, UserX, BookOpen, Plus, Search, Filter } from 'lucide-react'
import StudentForm from "@/components/student-form"
import StudentList from "@/components/student-list"

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    activo: undefined as boolean | undefined,
    curso: "",
    nivel: "",
  })
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsData, statsData] = await Promise.all([apiService.getStudents(filters), apiService.getStatistics()])
      setStudents(studentsData)
      setStatistics(statsData)
    } catch (error) {
      toast.error("No se pudieron cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleStudentCreated = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev])
    setIsFormOpen(false)
    loadData() // Recargar estadísticas
    toast.success("Alumno registrado correctamente")
  }

  const handleStudentUpdated = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((student) => (student.id === updatedStudent.id ? updatedStudent : student)))
    loadData() // Recargar estadísticas
  }

  const handleStudentDeleted = (studentId: number) => {
    setStudents((prev) => prev.filter((student) => student.id !== studentId))
    loadData() // Recargar estadísticas
  }

  // Filtrar estudiantes por término de búsqueda
  const filteredStudents = students.filter(
    (student) =>
      student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.curso && student.curso.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎓 Gestión de Alumnos</h1>
              <p className="text-gray-600">Sistema de registro para streams educativos</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Alumno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
                  <DialogDescription>
                    Completa la información del alumno para registrarlo en el sistema
                  </DialogDescription>
                </DialogHeader>
                <StudentForm onSuccess={handleStudentCreated} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_alumnos}</div>
                <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alumnos Activos</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statistics.alumnos_activos}</div>
                <p className="text-xs text-muted-foreground">Participando activamente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alumnos Inactivos</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{statistics.alumnos_inactivos}</div>
                <p className="text-xs text-muted-foreground">Temporalmente desactivados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{statistics.por_curso.length}</div>
                <p className="text-xs text-muted-foreground">Diferentes cursos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar alumnos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.activo?.toString() || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    activo: value === "all" ? undefined : value === "true",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Filtrar por curso"
                value={filters.curso}
                onChange={(e) => setFilters((prev) => ({ ...prev, curso: e.target.value }))}
              />

              <Input
                placeholder="Filtrar por nivel"
                value={filters.nivel}
                onChange={(e) => setFilters((prev) => ({ ...prev, nivel: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alumnos */}
        <StudentList
          students={filteredStudents}
          onStudentUpdated={handleStudentUpdated}
          onStudentDeleted={handleStudentDeleted}
        />
      </div>
    </div>
  )
}