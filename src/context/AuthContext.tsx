import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type User = {
  id: number
  name: string | null
  email: string
  role: string
  membershipStatus: string
  membershipExpiresAt: string | null
}

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  )

  const [user, setUser] = useState<User | null>(null)

  const isAuthenticated = !!token

  useEffect(() => {
    const storedToken = localStorage.getItem('token')

    if (!storedToken) {
      return
    }

    const restoreUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (!response.ok) {
          localStorage.removeItem('token')
          setToken(null)
          return
        }

        const data = await response.json()

        setUser(data.data)
      } catch (error) {
        console.error('Failed to restore session:', error)
      }
    }

    restoreUser()
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}