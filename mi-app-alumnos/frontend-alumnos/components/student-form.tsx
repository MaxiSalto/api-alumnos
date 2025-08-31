"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import type { Student, StudentCreate, StudentUpdate } from "@/types/student"

interface StudentFormProps {
  student?: Student
  onSuccess: (student: Student) => void
  onCancel?: () => void
}

export default function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const [formData, setFormData] = useState({
    nombre: student?.nombre || "",
    apellido: student?.apellido || "",
    email: student?.email || "",
    telefono: student?.telefono || "",
    fecha_nacimiento: student?.fecha_nacimiento || "",
    curso: student?.curso || "",
    nivel: student?.nivel || "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let result: Student

      if (student) {
        // Actualizar alumno existente
        const updateData: StudentUpdate = {}
        Object.keys(formData).forEach((key) => {
          const value = formData[key as keyof typeof formData]
          if (value !== student[key as keyof Student]) {
            (updateData as any)[key] = value || undefined
          }
        })

        result = await apiService.updateStudent(student.id, updateData)
      } else {
        // Crear nuevo alumno
        const createData: StudentCreate = {
          ...formData,
          telefono: formData.telefono || undefined,
          fecha_nacimiento: formData.fecha_nacimiento || undefined,
          curso: formData.curso || undefined,
          nivel: formData.nivel || undefined,
        }

        result = await apiService.createStudent(createData)
      }

      onSuccess(result)

      if (!student) {
        // Limpiar formulario solo si es creación
        setFormData({
          nombre: "",
          apellido: "",
          email: "",
          telefono: "",
          fecha_nacimiento: "",
          curso: "",
          nivel: "",
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            required
            placeholder="Ingresa el nombre"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input
            id="apellido"
            value={formData.apellido}
            onChange={(e) => handleChange("apellido", e.target.value)}
            required
            placeholder="Ingresa el apellido"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
          placeholder="ejemplo@email.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            placeholder="+52 555 1234567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
          <Input
            id="fecha_nacimiento"
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="curso">Curso</Label>
          <Select value={formData.curso} onValueChange={(value) => handleChange("curso", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Python para Principiantes">Python para Principiantes</SelectItem>
              <SelectItem value="JavaScript Avanzado">JavaScript Avanzado</SelectItem>
              <SelectItem value="React y Node.js">React y Node.js</SelectItem>
              <SelectItem value="Data Science">Data Science</SelectItem>
              <SelectItem value="Machine Learning">Machine Learning</SelectItem>
              <SelectItem value="Desarrollo Web Full Stack">Desarrollo Web Full Stack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nivel">Nivel</Label>
          <Select value={formData.nivel} onValueChange={(value) => handleChange("nivel", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Principiante">Principiante</SelectItem>
              <SelectItem value="Intermedio">Intermedio</SelectItem>
              <SelectItem value="Avanzado">Avanzado</SelectItem>
              <SelectItem value="Experto">Experto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Procesando..." : student ? "Actualizar" : "Registrar"}
        </Button>
      </div>
    </form>
  )
}