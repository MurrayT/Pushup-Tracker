import {useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {Button, Input} from '../components/ui'
import {useAuth} from "../lib/authContext.ts";

export default function LoginPage() {
    const {login} = useAuth()
    const nav = useNavigate()
    const [form, setForm] = useState({username: '', password: ''})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

    async function submit(e) {
        e.preventDefault()
        setError('');
        setLoading(true)
        try {
            await login(form.username, form.password)
            nav('/', {replace: true})
        } catch (err) {
            setError(err.message)
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
                    <h1 style={{fontSize: 26, fontWeight: 700}}>Pushup Tracker</h1>
                    <p style={{color: 'var(--muted)', marginTop: 6}}>Log in to track your gains</p>
                </div>

                <form onSubmit={submit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <Input label="Username" value={form.username} onChange={set('username')} autoComplete="username"
                           required/>
                    <Input label="Password" type="password" value={form.password} onChange={set('password')}
                           autoComplete="current-password" required/>

                    {error && (
                        <p style={{
                            fontSize: 13,
                            color: 'var(--danger)',
                            padding: '0.5rem 0.75rem',
                            background: '#fce8e8',
                            borderRadius: 'var(--radius-sm)'
                        }}>{error}</p>
                    )}

                    <Button type="submit" loading={loading} style={{width: '100%', marginTop: 4}}>Sign in</Button>
                </form>

                <p style={{textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginTop: '1.5rem'}}>
                    No account?{' '}
                    <Link to="/register" style={{color: 'var(--accent)', fontWeight: 500}}>Register</Link>
                </p>
            </div>
        </div>
    )
}