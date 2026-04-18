import {useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {useAuth} from '../lib/authContext'
import {Button, Input} from '../components/ui'
import type {RegisterRequest} from '../lib/api'

type RegisterForm = RegisterRequest & {
    email: string
}

export default function RegisterPage() {
    const {register} = useAuth()
    const nav = useNavigate()
    const [form, setForm] = useState<RegisterForm>({username: '', email: '', password: '', referral_code: ''})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const set = (k: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({...f, [k]: e.target.value}))

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await register(form.username, form.password, form.referral_code)
            nav('/', {replace: true})
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '1.5rem'
        }}>
            <div style={{maxWidth: 380, width: '100%', margin: '0 auto'}}>
                <div style={{textAlign: 'center', marginBottom: '2.5rem'}}>
                    <div style={{fontSize: 48, marginBottom: '0.75rem'}}>💪</div>
                    <h1 style={{fontSize: 26, fontWeight: 700}}>Create account</h1>
                    <p style={{color: 'var(--muted)', marginTop: 6}}>Start tracking your pushups</p>
                </div>

                <form onSubmit={submit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <Input label="Username" value={form.username} onChange={set('username')} autoComplete="username"
                           required/>
                    <Input label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email"/>
                    <Input label="Password" type="password" value={form.password} onChange={set('password')}
                           autoComplete="new-password" required/>
                    <Input label="Referral code" value={form.referral_code} onChange={set('referral_code')}
                           autoComplete="off" required/>

                    {error && (
                        <p style={{
                            fontSize: 13,
                            color: 'var(--danger)',
                            padding: '0.5rem 0.75rem',
                            background: '#fce8e8',
                            borderRadius: 'var(--radius-sm)'
                        }}>{error}</p>
                    )}

                    <Button type="submit" loading={loading} style={{width: '100%', marginTop: 4}}>Create
                        account</Button>
                </form>

                <p style={{textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginTop: '1.5rem'}}>
                    Already have an account?{' '}
                    <Link to="/login" style={{color: 'var(--accent)', fontWeight: 500}}>Sign in</Link>
                </p>
            </div>
        </div>
    )
}