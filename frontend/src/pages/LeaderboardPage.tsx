import {useEffect, useState} from 'react'
import {format, subDays} from 'date-fns'
import {api} from '../lib/api'
import {Avatar, PageHeader, Spinner} from '../components/ui'
import {useAuth} from "../lib/authContext.ts";

const RANGES = [
    {label: '7d', days: 7},
    {label: '30d', days: 30},
    {label: '90d', days: 90},
    {label: 'All', days: null},
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
    const {user} = useAuth()
    const [range, setRange] = useState(RANGES[1])
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        const params = range.days
            ? {start: format(subDays(new Date(), range.days - 1), 'yyyy-MM-dd')}
            : {}
        api.getPushups(params)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [range])

    const ranked = (data?.users ?? []).slice().sort((a, b) => b.total - a.total)
    const topTotal = ranked[0]?.total || 1

    return (
        <div>
            <PageHeader title="Leaderboard" subtitle="Everyone's totals"/>

            <div style={{padding: '0.5rem 1.25rem 0', display: 'flex', gap: 6}}>
                {RANGES.map(r => (
                    <button key={r.label} onClick={() => setRange(r)} style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: 13,
                        border: '0.5px solid var(--border)',
                        background: range.label === r.label ? 'var(--accent)' : 'var(--surface)',
                        color: range.label === r.label ? '#fff' : 'var(--muted)',
                        fontWeight: range.label === r.label ? 600 : 400,
                    }}>
                        {r.label}
                    </button>
                ))}
            </div>

            {loading ? <Spinner/> : (
                <div style={{padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 8}}>
                    {ranked.length === 0 && (
                        <p style={{color: 'var(--muted)', textAlign: 'center', padding: '3rem 0'}}>No data yet</p>
                    )}
                    {ranked.map((u, i) => {
                        const isMe = u.user_id === user.id
                        const pct = Math.round((u.total / topTotal) * 100)
                        return (
                            <div key={u.user_id} style={{
                                background: 'var(--surface)',
                                border: `0.5px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius)',
                                padding: '0.875rem 1rem',
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}>
                  <span style={{fontSize: 20, width: 28, textAlign: 'center'}}>
                    {MEDALS[i] ?? <span style={{fontSize: 14, color: 'var(--muted)', fontWeight: 600}}>#{i + 1}</span>}
                  </span>
                                    <Avatar name={u.username} size={34}/>
                                    <div style={{flex: 1}}>
                                        <p style={{fontWeight: 600, fontSize: 15}}>
                                            {u.username}{isMe && <span
                                            style={{fontSize: 12, color: 'var(--accent)', marginLeft: 6}}>you</span>}
                                        </p>
                                        <p style={{
                                            fontSize: 12,
                                            color: 'var(--muted)'
                                        }}>{u.days} day{u.days !== 1 ? 's' : ''} logged</p>
                                    </div>
                                    <p style={{fontWeight: 700, fontSize: 18}}>{u.total.toLocaleString()}</p>
                                </div>

                                {/* Progress bar */}
                                <div style={{height: 5, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden'}}>
                                    <div style={{
                                        height: '100%', width: `${pct}%`,
                                        background: isMe ? 'var(--accent)' : '#9e9e95',
                                        borderRadius: 99,
                                        transition: 'width 0.5s ease',
                                    }}/>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}