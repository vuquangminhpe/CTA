/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useState, useEffect } from 'react'
import { getAccessTokenFromLS, getProfileFormLS } from '../utils/auth'
import { UserRole } from '../constants/enum'
interface Profile {
  name?: string
  email?: string
  role?: UserRole
}
// Create Auethentication Context
export const AuthContext = createContext({
  isAuthenticated: false,
  profile: null,
  role: null,
  setIsAuthenticated: (value: boolean | ((prevState: boolean) => boolean)) => {},
  setProfile: (value: Profile | null | ((prevState: Profile | null) => Profile | null)) => {},
  reset: () => null
})

export const AuthProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessTokenFromLS()))
  const [profile, setProfile] = useState(getProfileFormLS())
  const [role, setRole] = useState(profile?.role || null)

  useEffect(() => {
    // Update role when profile changes
    if (profile) {
      setRole(profile.role)
    } else {
      setRole(null)
    }
  }, [profile])

  const reset = () => {
    setIsAuthenticated(false)
    setProfile(null)
    setRole(null)
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        profile,
        setProfile,
        role,
        reset
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
