import React, {type PropsWithChildren} from "react";

export function Card({children, style}: PropsWithChildren<{ style?: React.CSSProperties }>) {
    return (
        <div style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem 1.25rem',
            ...style,
        }}>
            {children}
        </div>
    )
}

export function PageHeader({title, subtitle, action}: { title: string, subtitle?: string, action?: React.ReactNode }) {
    return (
        <div style={{
            padding: '1.5rem 1.25rem 0.75rem',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
            <div>
                <h1 style={{fontSize: 22, fontWeight: 600, lineHeight: 1.2}}>{title}</h1>
                {subtitle && <p style={{fontSize: 14, color: 'var(--muted)', marginTop: 3}}>{subtitle}</p>}
            </div>
            {action}
        </div>
    )
}

export function StatCard({label, value, color}: { label: string, value: string | number, color?: string }) {
    return (
        <div style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.875rem 1rem',
            flex: 1,
        }}>
            <p style={{fontSize: 12, color: 'var(--muted)', marginBottom: 4}}>{label}</p>
            <p style={{fontSize: 24, fontWeight: 600, color: color || 'var(--text)'}}>{value}</p>
        </div>
    )
}

export function Button({
                           children,
                           variant = 'primary',
                           style,
                           loading,
                           ...props
                       }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger',
    loading?: boolean
}) {
    const base = {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '0 1.25rem', height: 44,
        borderRadius: 'var(--radius-sm)', border: '0.5px solid transparent',
        fontWeight: 500, fontSize: 15, transition: 'opacity 0.15s',
        opacity: loading ? 0.6 : 1,
        ...style,
    }
    const variants = {
        primary: {background: 'var(--accent)', color: '#fff', border: 'none'},
        ghost: {background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text)'},
        danger: {background: 'var(--danger)', color: '#fff', border: 'none'},
    }
    return (
        <button style={{...base, ...variants[variant]}} disabled={loading} {...props}>
            {loading ? 'Loading…' : children}
        </button>
    )
}

export function Input({label, error, style, ...props}: React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string,
    error?: string
}) {
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            {label && <label style={{fontSize: 13, color: 'var(--muted)', fontWeight: 500}}>{label}</label>}
            <input style={{
                height: 44, padding: '0 12px',
                background: 'var(--surface)', color: 'var(--text)',
                border: `0.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', fontSize: 15,
                width: '100%',
                ...style,
            }} {...props} />
            {error && <p style={{fontSize: 12, color: 'var(--danger)'}}>{error}</p>}
        </div>
    )
}

export function Avatar({name, size = 36}: { name: string, size?: number }) {
    const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
    const hue = name ? [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 360 : 200
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `hsl(${hue}, 65%, 88%)`,
            color: `hsl(${hue}, 55%, 35%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.38, fontWeight: 600, flexShrink: 0,
        }}>
            {initials}
        </div>
    )
}

export function Spinner() {
    return (
        <div style={{display: 'flex', justifyContent: 'center', padding: '3rem 0'}}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2.5px solid var(--border)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 0.7s linear infinite',
            }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}