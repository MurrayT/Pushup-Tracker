import {createContext, useContext} from 'react'
import type {User} from "./api.ts";


export interface AuthContextData {
    user: User | null
    login: (username: string, password: string) => Promise<User>
    register: (username: string, password: string, referralCode: string) => Promise<User>
    logout: () => void
}

export const AuthCtx = createContext<AuthContextData | null>(null)

export function useAuth(): AuthContextData {
    const ctx = useContext(AuthCtx)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}