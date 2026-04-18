import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'
import {format, subDays} from 'date-fns'
import {api} from '../lib/api'
import {Button, Card, PageHeader, Spinner, StatCard} from '../components/ui'
import {useAuth} from "../lib/authContext.ts";

export default function DashboardPage() {
    const {user, logout} = useAuth()
    const nav = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [metric, setMetric] = useState<'count' | 'cumulative'>('cumulative')

    useEffect(() => {
        const start = format(subDays(new Date(), 29), 'yyyy-MM-dd')
        api.getUserPushups(user.id, {start})
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [user.id])

    const points = data?.points ?? []
    const total = points.reduce((s, p) => s + p.count, 0)
    const best = points.reduce((m, p) => Math.max(m, p.count), 0)
    const streak = calcStreak(points)

    // Fill in the last 30 days even if no entry
    const chartData = buildChartData(points, 30)

    return (
        <div>
            <PageHeader
                title={`Hey, ${user.username} 👋`}
                subtitle="Your last 30 days"
                action={
                    <button onClick={() => {
                        logout();
                        nav('/login')
                    }} style={{
                        fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', padding: '4px 8px',
                    }}>Sign out</button>
                }
            />

            <div style={{padding: '0.75rem 1.25rem', display: 'flex', gap: 10}}>
                <StatCard label="Total (30d)" value={total.toLocaleString()} color="var(--accent)"/>
                <StatCard label="Best day" value={best}/>
                <StatCard label="Day streak" value={streak} color="var(--success)"/>
            </div>

            {loading ? <Spinner/> : (
                <div style={{padding: '0 1.25rem 1rem'}}>
                    <Card style={{padding: '1rem 0.75rem'}}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 12,
                            paddingLeft: 8
                        }}>
                            <p style={{fontSize: 13, color: 'var(--muted)'}}>Pushups per day</p>
                            <div style={{display: 'flex', gap: 8}}>
                                <button
                                    onClick={() => setMetric('count')}
                                    style={{
                                        fontSize: 12,
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        border: '1px solid var(--border)',
                                        background: metric === 'count' ? 'var(--accent)' : 'transparent',
                                        color: metric === 'count' ? '#fff' : 'var(--muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Count
                                </button>
                                <button
                                    onClick={() => setMetric('cumulative')}
                                    style={{
                                        fontSize: 12,
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        border: '1px solid var(--border)',
                                        background: metric === 'cumulative' ? 'var(--accent)' : 'transparent',
                                        color: metric === 'cumulative' ? '#fff' : 'var(--muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cumulative
                                </button>
                            </div>
                        </div>
                        {chartData.length === 0 || total === 0 ? (
                            <p style={{textAlign: 'center', color: 'var(--muted)', padding: '2rem 0', fontSize: 14}}>
                                No entries yet — <Link to="/log" style={{color: 'var(--accent)'}}>log your first!</Link>
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={chartData} margin={{left: -20, right: 8}}>
                                    <defs>
                                        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1a6ef5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#1a6ef5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" tick={{fontSize: 10, fill: 'var(--muted)'}} tickLine={false}
                                           axisLine={false} interval="preserveStartEnd"/>
                                    <YAxis tick={{fontSize: 10, fill: 'var(--muted)'}} tickLine={false}
                                           axisLine={false}/>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--surface)',
                                            border: '0.5px solid var(--border)',
                                            borderRadius: 8,
                                            fontSize: 13
                                        }}
                                        labelStyle={{color: 'var(--muted)'}}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={metric}
                                        stroke="#1a6ef5"
                                        strokeWidth={2}
                                        fill="url(#fill)"
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </Card>

                    <div style={{marginTop: '1rem', display: 'flex', gap: 10}}>
                        <Button variant="primary" style={{flex: 1}} onClick={() => nav('/log')}>Log today's
                            pushups</Button>
                        <a href="/tv" target="_blank" rel="noopener" style={{flex: 1}}>
                            <Button variant="ghost" style={{width: '100%'}}>TV view</Button>
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}

function buildChartData(points, days) {
    const map: Record<string, number> = {}
    points.forEach(p => {
        map[p.date] = p.count
    })

    let running = 0
    return Array.from({length: days}, (_, i) => {
        const d = subDays(new Date(), days - 1 - i)
        const key = format(d, 'yyyy-MM-dd')
        const count = map[key] ?? 0
        running += count

        return {
            date: key,
            label: format(d, 'MMM d'),
            count,
            cumulative: running,
        }
    })
}

function calcStreak(points) {
    if (!points.length) return 0
    const dates = new Set(points.map(p => p.date))
    let streak = 0
    let d = new Date()
    while (true) {
        const key = format(d, 'yyyy-MM-dd')
        if (!dates.has(key)) break
        streak++
        d = subDays(d, 1)
    }
    return streak
}