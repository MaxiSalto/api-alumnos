export interface Student {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono?: string
  fecha_nacimiento?: string
  curso?: string
  nivel?: string
  fecha_registro: string
  activo: boolean
}

export interface StudentCreate {
  nombre: string
  apellido: string
  email: string
  telefono?: string
  fecha_nacimiento?: string
  curso?: string
  nivel?: string
}

export interface StudentUpdate {
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
  fecha_nacimiento?: string
  curso?: string
  nivel?: string
  activo?: boolean
}

export interface Statistics {
  total_alumnos: number
  alumnos_activos: number
  alumnos_inactivos: number
  por_curso: Array<{ curso: string; cantidad: number }>
  por_nivel: Array<{ nivel: string; cantidad: number }>
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
