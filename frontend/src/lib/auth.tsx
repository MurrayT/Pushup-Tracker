import {type PropsWithChildren, useState} from 'react'
import {api, type User} from './api'
import {AuthCtx} from './authContext'

export function AuthProvider({children}: PropsWithChildren) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const localUser = localStorage.getItem('user')
            return localUser ? JSON.parse(localUser) as User : null
        } catch {
            return null
        }
    })

    async function login(username: string, password: string): Promise<User> {
        const data = await api.login({username, password})
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    async function register(username: string, password: string, referral_code: string): Promise<User> {
        const data = await api.register({username, password, referral_code})
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    function logout(): void {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }

    return <AuthCtx.Provider value={{user, login, register, logout}}>{children}</AuthCtx.Provider>
}