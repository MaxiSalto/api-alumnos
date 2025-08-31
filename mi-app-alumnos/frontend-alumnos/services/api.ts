import type { Student, StudentCreate, StudentUpdate, Statistics } from "@/types/student"

// ✅ Configuración profesional por entornos
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Gestión Alumnos",
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = config.apiUrl

    // Log solo en desarrollo
    if (config.environment === "development") {
      console.log("🚀 API URL:", this.baseUrl)
      console.log("🌍 Environment:", config.environment)
      console.log("📱 App Name:", config.appName)
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // Log detallado solo en desarrollo
    if (config.environment === "development") {
      console.log(`🌐 ${options.method || "GET"} ${url}`)
    }

    const config_request: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config_request)

      // Log de respuesta solo en desarrollo
      if (config.environment === "development") {
        console.log(`📡 Response Status: ${response.status}`)
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`

        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          // Si no puede parsear el JSON, usa el mensaje por defecto
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Log de datos solo en desarrollo
      if (config.environment === "development") {
        console.log("📦 Response Data:", data)
      }

      return data
    } catch (error) {
      // Log de errores siempre (pero más detallado en desarrollo)
      if (config.environment === "development") {
        console.error("❌ API request failed:", error)
      } else {
        // En producción, log más simple
      }

      // Mensajes de error específicos por entorno
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const errorMessage =
          config.environment === "development"
            ? `❌ No se puede conectar a la API en ${this.baseUrl}. 
        
Verifica que:
1. El backend esté corriendo en el puerto correcto
2. No haya bloqueos de CORS
3. La URL sea correcta

Comando para iniciar el backend:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
            : `No se puede conectar al servidor. Por favor, intenta más tarde.`

        throw new Error(errorMessage)
      }

      throw error
    }
  }

  // ✅ Método para probar la conexión
  async testConnection(): Promise<any> {
    try {
      const response = await this.request<any>("/")
      if (config.environment === "development") {
        console.log("✅ Conexión exitosa con la API")
      }
      return response
    } catch (error) {
      if (config.environment === "development") {
        console.error("❌ Error de conexión:", error)
      }
      throw error
    }
  }

  // ✅ Health check para monitoreo
  async healthCheck(): Promise<any> {
    try {
      const response = await this.request<any>("/health")
      return response
    } catch (error) {
      throw new Error("Health check failed")
    }
  }

  async getStudents(filters?: {
    activo?: boolean
    curso?: string
    nivel?: string
  }): Promise<Student[]> {
    const params = new URLSearchParams()

    if (filters?.activo !== undefined) {
      params.append("activo", filters.activo.toString())
    }
    if (filters?.curso) {
      params.append("curso", filters.curso)
    }
    if (filters?.nivel) {
      params.append("nivel", filters.nivel)
    }

    const query = params.toString()
    const endpoint = query ? `/alumnos?${query}` : "/alumnos"

    return this.request<Student[]>(endpoint)
  }

  async getStudent(id: number): Promise<Student> {
    return this.request<Student>(`/alumnos/${id}`)
  }

  async createStudent(student: StudentCreate): Promise<Student> {
    return this.request<Student>("/alumnos", {
      method: "POST",
      body: JSON.stringify(student),
    })
  }

  async updateStudent(id: number, student: StudentUpdate): Promise<Student> {
    return this.request<Student>(`/alumnos/${id}`, {
      method: "PUT",
      body: JSON.stringify(student),
    })
  }

  async deleteStudent(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/alumnos/${id}`, {
      method: "DELETE",
    })
  }

  async deactivateStudent(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/alumnos/${id}/desactivar`, {
      method: "PATCH",
    })
  }

  async activateStudent(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/alumnos/${id}/activar`, {
      method: "PATCH",
    })
  }

  async getStatistics(): Promise<Statistics> {
    return this.request<Statistics>("/estadisticas")
  }

  // ✅ Método para obtener configuración actual
  getConfig() {
    return {
      apiUrl: this.baseUrl,
      environment: config.environment,
      appName: config.appName,
    }
  }
}

export const apiService = new ApiService()

// ✅ Función de utilidad para probar la conexión
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await apiService.testConnection()
    return true
  } catch (error) {
    if (config.environment === "development") {
      console.error("Error testing API connection:", error)
    }
    return false
  }
}

// ✅ Función para verificar el estado de la API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await apiService.healthCheck()
    return true
  } catch (error) {
    return false
  }
}

// ✅ Exportar configuración para uso en otros componentes
export { config as apiConfig }
