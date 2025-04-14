import { User } from '../types/User.type'
import { getAccessTokenFromLS, getProfileFormLS } from '../utils/auth'
import { createContext, useState } from 'react'

interface AppContextInterface {
  isAuthenticated: boolean
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
  profile: User | null
  setProfile: React.Dispatch<React.SetStateAction<User | null>>
  reset: () => void
}

const initialAppContext: AppContextInterface = {
  isAuthenticated: Boolean(getAccessTokenFromLS()),
  setIsAuthenticated: () => null,
  profile: getProfileFormLS(),
  setProfile: () => null,
  reset: () => null
}

export const AppContext = createContext<AppContextInterface>(initialAppContext)
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAppContext.isAuthenticated)
  const reset = () => {
    setIsAuthenticated(false)
    setProfile(null)
  }
  const [profile, setProfile] = useState<User | null>(initialAppContext.profile)

  return (
    <AppContext.Provider
      value={{
        reset,
        isAuthenticated,
        setIsAuthenticated,
        profile,
        setProfile
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
