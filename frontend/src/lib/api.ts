type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
    method?: HttpMethod
    body?: BodyInit | null
}

export interface User {
    id: number
    username: string
    created_at: string
}

interface ApiErrorResponse {
    error: string
}

export interface LoginResponse {
    user: User,
    token: string,
}

export interface PushupPoint {
    date: string,
    user_id: number,
    username: string,
    count: number,
    cumulative: number
}

export interface GraphUserSummary {
    user_id: number
    username: string
    total: number
    days: number
}

export interface GraphResponse {
    points: PushupPoint[]
    users: GraphUserSummary[]
}

const BASE = '/api'

function getToken() {
    return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = getToken()

    const headers = new Headers(options.headers)
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const res = await fetch(BASE + path, {...options, headers})

    if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new Error('Unauthorized')
    }

    const data: unknown = await res.json()
    if (!res.ok) {
        const err = data as ApiErrorResponse
        throw new Error(err.error || 'Request failed')
    }
    return data as T
}

export interface RegisterRequest {
    username: string,
    password: string,
    referral_code: string
}

interface LoginRequest {
    username: string,
    password: string
}

interface AddPushupsRequest {
    date?: string,
    count: number
}

interface AddPushupsResponse {
    user_id: number
    username: string
    date: string
    count: number
}

export const api = {
    register: (body: RegisterRequest) => request<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
    }),
    login: (body: LoginRequest) => request<LoginResponse>('/auth/login', {method: 'POST', body: JSON.stringify(body)}),

    getUsers: () => request<{ users: User[] }>('/users'),
    addPushups: (body: AddPushupsRequest) => request<AddPushupsResponse>('/pushups', {
        method: 'POST',
        body: JSON.stringify(body)
    }),
    getPushups: (params?: Record<string, string | number | null>) => request<GraphResponse>('/pushups' + buildQuery(params)),
    getUserPushups: (id: number, params?: Record<string, string | number | null>) => request<GraphResponse>(`/pushups/${id}` + buildQuery(params)),
}

function buildQuery(params: Record<string, string | number | null> = {}) {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') q.set(k, String(v))
    })
    const s = q.toString()
    return s ? '?' + s : ''
}