"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import type { Student } from "@/types/student"
import { Edit, Trash2, UserCheck, UserX, Mail, Phone, Calendar, BookOpen, TrendingUp, Users } from 'lucide-react'
import StudentForm from "@/components/student-form"

interface StudentListProps {
  students: Student[]
  onStudentUpdated: (student: Student) => void
  onStudentDeleted: (studentId: number) => void
}

export default function StudentList({ students, onStudentUpdated, onStudentDeleted }: StudentListProps) {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleToggleActive = async (student: Student) => {
    try {
      if (student.activo) {
        await apiService.deactivateStudent(student.id)
        toast.success(`${student.nombre} ${student.apellido} ha sido desactivado`)
      } else {
        await apiService.activateStudent(student.id)
        toast.success(`${student.nombre} ${student.apellido} ha sido activado`)
      }

      // Actualizar el estado local
      onStudentUpdated({ ...student, activo: !student.activo })
    } catch (error) {
      toast.error("No se pudo cambiar el estado del alumno")
    }
  }

  const handleDelete = async (student: Student) => {
    try {
      await apiService.deleteStudent(student.id)
      onStudentDeleted(student.id)
      toast.success(`${student.nombre} ${student.apellido} ha sido eliminado permanentemente`)
    } catch (error) {
      toast.error("No se pudo eliminar el alumno")
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsEditDialogOpen(true)
  }

  const handleEditSuccess = (updatedStudent: Student) => {
    onStudentUpdated(updatedStudent)
    setIsEditDialogOpen(false)
    setEditingStudent(null)
    toast.success("Alumno actualizado correctamente")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="w-16 h-16" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alumnos registrados</h3>
          <p className="text-gray-500 text-center">
            Comienza registrando tu primer alumno usando el botón "Nuevo Alumno"
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Lista de Alumnos ({students.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {student.nombre} {student.apellido}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={student.activo ? "default" : "secondary"}>
                      {student.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(student)}>
                    {student.activo ? (
                      <UserX className="w-4 h-4 text-red-600" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-green-600" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar alumno?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente a {student.nombre} {student.apellido} del sistema. Esta
                          acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(student)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{student.email}</span>
              </div>

              {student.telefono && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{student.telefono}</span>
                </div>
              )}

              {student.curso && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="truncate">{student.curso}</span>
                </div>
              )}

              {student.nivel && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{student.nivel}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Registrado: {formatDate(student.fecha_registro)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para editar alumno */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Alumno</DialogTitle>
            <DialogDescription>Modifica la información del alumno</DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <StudentForm
              student={editingStudent}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}