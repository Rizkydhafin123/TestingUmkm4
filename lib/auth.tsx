"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  username: string
  name: string
  role: "admin" | "user"
  rw?: string
  created_at?: string
  must_change_password?: boolean
  last_password_change?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>
  logout: () => void
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  isLoading: boolean
}

export interface RegisterData {
  username: string
  password: string
  name: string
  rw: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Singleton Neon client
let _sql: ReturnType<typeof neon> | null = null
function getDbClient() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Database operations will not work.")
    return null
  }
  return (_sql ??= neon(process.env.DATABASE_URL))
}

// Generate UUID v4 (fallback for local storage, though now primarily DB handles it)
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUserFromSession = async () => {
      setIsLoading(true)
      const storedUserId = localStorage.getItem("auth_user_id")
      if (storedUserId) {
        const sql = getDbClient()
        if (sql) {
          try {
            const [dbUser] =
              await sql`SELECT id, username, name, role, rw, created_at FROM users WHERE id = ${storedUserId}`
            if (dbUser) {
              setUser({ ...dbUser, must_change_password: false }) // Assume password is changed if logged in via DB
            } else {
              localStorage.removeItem("auth_user_id") // User not found in DB
            }
          } catch (error) {
            console.error("Error fetching user from DB:", error)
            localStorage.removeItem("auth_user_id")
          }
        } else {
          // Fallback for local storage if DB not configured (should not happen in production with Neon)
          const localUsers = JSON.parse(localStorage.getItem("registered_users") || "[]")
          const foundUser = localUsers.find((u: any) => u.id === storedUserId)
          if (foundUser) {
            const { password: _, ...userWithoutPassword } = foundUser
            setUser(userWithoutPassword)
          } else {
            localStorage.removeItem("auth_user_id")
          }
        }
      }
      setIsLoading(false)
    }

    loadUserFromSession()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    const sql = getDbClient()

    if (!sql) {
      // Fallback to local storage for login if DB not configured (development/testing without Neon)
      const users = JSON.parse(localStorage.getItem("registered_users") || "[]")
      const foundUser = users.find((u: any) => u.username === username && u.password === password)
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
        localStorage.setItem("auth_user_id", userWithoutPassword.id)
        setIsLoading(false)
        return true
      }
      setIsLoading(false)
      return false
    }

    try {
      const [dbUser] =
        await sql`SELECT id, username, name, role, rw, password_hash FROM users WHERE username = ${username}`

      if (dbUser && (await bcrypt.compare(password, dbUser.password_hash))) {
        const loggedInUser: User = {
          id: dbUser.id,
          username: dbUser.username,
          name: dbUser.name,
          role: dbUser.role,
          rw: dbUser.rw,
          created_at: dbUser.created_at,
          must_change_password: false, // Assume password is changed if logged in via DB
        }
        setUser(loggedInUser)
        localStorage.setItem("auth_user_id", loggedInUser.id)
        return true
      }
      return false
    } catch (error) {
      console.error("Database login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    const sql = getDbClient()

    if (!sql) {
      // Fallback to local storage for register if DB not configured
      const users = JSON.parse(localStorage.getItem("registered_users") || "[]")
      const existingUser = users.find((u: any) => u.username === userData.username)
      if (existingUser) {
        setIsLoading(false)
        return { success: false, message: "Username sudah digunakan" }
      }
      const newUser = {
        id: generateUUID(),
        username: userData.username,
        password: userData.password, // Storing plain text in local storage for fallback
        name: userData.name,
        role: "user" as const,
        rw: userData.rw,
        created_at: new Date().toISOString(),
      }
      users.push(newUser)
      localStorage.setItem("registered_users", JSON.stringify(users))
      setIsLoading(false)
      return { success: true, message: "Registrasi berhasil! Silakan login." }
    }

    try {
      const [existingUser] = await sql`SELECT id FROM users WHERE username = ${userData.username}`
      if (existingUser) {
        return { success: false, message: "Username sudah digunakan" }
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10) // Hash password
      const newUserId = generateUUID() // Generate UUID for new user

      await sql`
        INSERT INTO users (id, username, name, role, rw, password_hash)
        VALUES (${newUserId}, ${userData.username}, ${userData.name}, 'user', ${userData.rw}, ${hashedPassword});
      `
      return { success: true, message: "Registrasi berhasil! Silakan login." }
    } catch (error) {
      console.error("Database registration error:", error)
      return { success: false, message: "Terjadi kesalahan saat registrasi" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_user_id")
  }

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: "User tidak ditemukan" }
    }

    setIsLoading(true)
    const sql = getDbClient()

    if (!sql) {
      // Fallback to local storage for change password if DB not configured
      const users = JSON.parse(localStorage.getItem("registered_users") || "[]")
      const userIndex = users.findIndex((u: any) => u.id === user.id)

      if (userIndex === -1) {
        setIsLoading(false)
        return { success: false, message: "User tidak ditemukan" }
      }

      if (oldPassword !== users[userIndex].password) {
        setIsLoading(false)
        return { success: false, message: "Password lama tidak benar" }
      }

      if (newPassword.length < 6) {
        setIsLoading(false)
        return { success: false, message: "Password baru minimal 6 karakter" }
      }

      if (oldPassword === newPassword) {
        setIsLoading(false)
        return { success: false, message: "Password baru harus berbeda dari password lama" }
      }

      users[userIndex].password = newPassword
      users[userIndex].last_password_change = new Date().toISOString()
      localStorage.setItem("registered_users", JSON.stringify(users))
      setIsLoading(false)
      return { success: true, message: "Password berhasil diubah" }
    }

    try {
      const [dbUser] = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`

      if (!dbUser || !(await bcrypt.compare(oldPassword, dbUser.password_hash))) {
        return { success: false, message: "Password lama tidak benar" }
      }

      if (newPassword.length < 6) {
        return { success: false, message: "Password baru minimal 6 karakter" }
      }

      if (oldPassword === newPassword) {
        return { success: false, message: "Password baru harus berbeda dari password lama" }
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 10)
      await sql`
        UPDATE users
        SET password_hash = ${newHashedPassword}, updated_at = NOW()
        WHERE id = ${user.id};
      `
      // Update local user state to reflect password change status
      setUser((prevUser) => (prevUser ? { ...prevUser, must_change_password: false } : null))

      return { success: true, message: "Password berhasil diubah" }
    } catch (error) {
      console.error("Database change password error:", error)
      return { success: false, message: "Terjadi kesalahan saat mengubah password" }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, changePassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
