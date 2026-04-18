import {useCallback, useEffect, useState} from 'react'
import {format, subDays} from 'date-fns'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import {api, type GraphResponse, type GraphUserSummary, type PushupPoint} from '../lib/api'

const PALETTE = [
    '#4d8ef8', '#1d9e75', '#f5a623', '#e84393',
    '#a855f7', '#ef4444', '#06b6d4', '#f97316',
]

const RANGES = [
    {label: '7 days', days: 7},
    {label: '30 days', days: 30},
    {label: '90 days', days: 90},
]

const REFRESH_MS = 60_000

type Metric = 'count' | 'cumulative'
type ChartType = 'line' | 'bar'
type ChartRow = {
    date: string
} & Record<string, number | string>

export default function TVPage() {
    const [range, setRange] = useState(RANGES[1])
    const [data, setData] = useState<GraphResponse | null>(null)
    const [chartType, setChartType] = useState<ChartType>('line')
    const [time, setTime] = useState(new Date())
    const [metric, setMetric] = useState<Metric>('cumulative')

    const load = useCallback(() => {
        const start = format(subDays(new Date(), range.days - 1), 'yyyy-MM-dd')
        api.getPushups({start}).then(setData).catch(console.error)
    }, [range])

    useEffect(() => {
        load()
    }, [load])
    useEffect(() => {
        const t = setInterval(load, REFRESH_MS)
        return () => clearInterval(t)
    }, [load])
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    const users = data?.users ?? []
    const chartData = buildMatrix(data?.points ?? [], users, range.days)
    const ranked = [...users].sort((a, b) => b.total - a.total)
    const grandTotal = users.reduce((s, u) => s + u.total, 0)

    return (
        <div style={{
            minHeight: '100dvh',
            background: '#0d0d0c',
            color: '#e8e8e4',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 2.5rem',
            gap: '1.5rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <span style={{fontSize: 36}}>💪</span>
                    <div>
                        <h1 style={{fontSize: 28, fontWeight: 700, lineHeight: 1}}>Pushup Tracker</h1>
                        <p style={{fontSize: 14, color: '#888882', marginTop: 4}}>Live leaderboard</p>
                    </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{display: 'flex', gap: 6}}>
                        {RANGES.map(r => (
                            <button
                                key={r.label}
                                onClick={() => setRange(r)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 20,
                                    fontSize: 13,
                                    border: '0.5px solid rgba(255,255,255,0.15)',
                                    background: range.label === r.label ? '#1a6ef5' : 'rgba(255,255,255,0.06)',
                                    color: range.label === r.label ? '#fff' : '#888882',
                                    cursor: 'pointer',
                                    fontWeight: range.label === r.label ? 600 : 400,
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <div style={{display: 'flex', gap: 6}}>
                        <button
                            onClick={() => setMetric('count')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                fontSize: 13,
                                border: '0.5px solid rgba(255,255,255,0.15)',
                                background: metric === 'count' ? 'rgba(255,255,255,0.12)' : 'transparent',
                                color: metric === 'count' ? '#e8e8e4' : '#888882',
                                cursor: 'pointer',
                            }}
                        >
                            Count
                        </button>
                        <button
                            onClick={() => setMetric('cumulative')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                fontSize: 13,
                                border: '0.5px solid rgba(255,255,255,0.15)',
                                background: metric === 'cumulative' ? 'rgba(255,255,255,0.12)' : 'transparent',
                                color: metric === 'cumulative' ? '#e8e8e4' : '#888882',
                                cursor: 'pointer',
                            }}
                        >
                            Cumulative
                        </button>
                    </div>

                    <div style={{display: 'flex', gap: 6}}>
                        {['line', 'bar'].map(t => (
                            <button
                                key={t}
                                onClick={() => setChartType(t as ChartType)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    fontSize: 13,
                                    border: '0.5px solid rgba(255,255,255,0.15)',
                                    background: chartType === t ? 'rgba(255,255,255,0.12)' : 'transparent',
                                    color: chartType === t ? '#e8e8e4' : '#888882',
                                    cursor: 'pointer',
                                }}
                            >
                                {t === 'line' ? '〰 Line' : '▮ Bar'}
                            </button>
                        ))}
                    </div>

                    <p style={{fontSize: 22, fontWeight: 300, color: '#888882', minWidth: 80, textAlign: 'right'}}>
                        {format(time, 'HH:mm')}
                    </p>
                </div>
            </div>

            <div style={{display: 'flex', gap: '1rem'}}>
                <KPI label="Total pushups" value={grandTotal.toLocaleString()} accent="#1a6ef5"/>
                <KPI label="Active users" value={users.length}/>
                <KPI label="Range" value={range.label}/>
                {ranked[0] && <KPI label="Leader" value={ranked[0].username} accent="#f5a623"/>}
            </div>

            <div style={{flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', minHeight: 0}}>
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 16,
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    padding: '1.5rem 1rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <p style={{fontSize: 14, color: '#888882', marginBottom: '1rem', paddingLeft: 8}}>
                        Daily pushups — {range.label} ({metric})
                    </p>

                    <div style={{flex: 1, minHeight: 0}}>
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'line' ? (
                                <LineChart data={chartData} margin={{left: -10, right: 16, top: 8}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)"/>
                                    <XAxis dataKey="date" tick={{fontSize: 11, fill: '#888882'}} tickLine={false}
                                           axisLine={false} interval="preserveStartEnd"/>
                                    <YAxis tick={{fontSize: 11, fill: '#888882'}} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={tooltipStyle} labelStyle={{color: '#aaa'}}/>
                                    <Legend wrapperStyle={{fontSize: 13, paddingTop: 8}}/>
                                    {users.map((u, i) => (
                                        <Line
                                            key={u.user_id}
                                            type="monotone"
                                            dataKey={`${u.username}_${metric}`}
                                            name={u.username}
                                            stroke={PALETTE[i % PALETTE.length]}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{r: 5}}
                                        />
                                    ))}
                                </LineChart>
                            ) : (
                                <BarChart data={chartData} margin={{left: -10, right: 16, top: 8}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)"/>
                                    <XAxis dataKey="date" tick={{fontSize: 11, fill: '#888882'}} tickLine={false}
                                           axisLine={false} interval="preserveStartEnd"/>
                                    <YAxis tick={{fontSize: 11, fill: '#888882'}} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={tooltipStyle} labelStyle={{color: '#aaa'}}/>
                                    <Legend wrapperStyle={{fontSize: 13, paddingTop: 8}}/>
                                    {users.map((u, i) => (
                                        <Bar
                                            key={u.user_id}
                                            dataKey={`${u.username}_${metric}`}
                                            name={u.username}
                                            stackId="a"
                                            fill={PALETTE[i % PALETTE.length]}
                                            radius={i === users.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                        />
                                    ))}
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 16,
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    overflowY: 'auto',
                }}>
                    <p style={{fontSize: 14, color: '#888882'}}>Leaderboard</p>

                    {ranked.map((u, i) => {
                        const pct = Math.round((u.total / (ranked[0]?.total || 1)) * 100)
                        const color = PALETTE[users.findIndex(x => x.user_id === u.user_id) % PALETTE.length]
                        return (
                            <div key={u.user_id}>
                                <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5}}>
                                    <span style={{fontSize: 18, width: 24}}>
                                        {['🥇', '🥈', '🥉'][i] ??
                                            <span style={{fontSize: 12, color: '#888882'}}>#{i + 1}</span>}
                                    </span>
                                    <UserDot color={color}/>
                                    <span style={{flex: 1, fontWeight: 500, fontSize: 15}}>{u.username}</span>
                                    <span
                                        style={{fontWeight: 700, fontSize: 18, color}}>{u.total.toLocaleString()}</span>
                                </div>
                                <div style={{
                                    height: 4,
                                    background: 'rgba(255,255,255,0.08)',
                                    borderRadius: 99,
                                    marginLeft: 34,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${pct}%`,
                                        background: color,
                                        borderRadius: 99,
                                        transition: 'width 0.5s'
                                    }}/>
                                </div>
                            </div>
                        )
                    })}

                    {ranked.length === 0 && (
                        <p style={{color: '#888882', textAlign: 'center', marginTop: '2rem', fontSize: 14}}>No data
                            yet</p>
                    )}
                </div>
            </div>

            <p style={{fontSize: 11, color: '#444', textAlign: 'center'}}>
                Auto-refreshes every 60s · {format(new Date(), 'dd MMM yyyy')}
            </p>
        </div>
    )
}

function KPI({label, value, accent}: { label: string; value: string | number; accent?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '0.875rem 1.25rem',
            flex: 1,
        }}>
            <p style={{fontSize: 12, color: '#888882', marginBottom: 4}}>{label}</p>
            <p style={{fontSize: 26, fontWeight: 700, color: accent || '#e8e8e4'}}>{value}</p>
        </div>
    )
}

function UserDot({color}: { color: string }) {
    return <div style={{width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0}}/>
}

const tooltipStyle = {
    background: '#1c1c1a',
    border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    fontSize: 13,
    color: '#e8e8e4',
}

function buildMatrix(points: PushupPoint[], users: GraphUserSummary[], days: number): ChartRow[] {
    const dates = Array.from({length: days}, (_, i) =>
        format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
    )

    const map: Record<string, Record<string, number>> = {}

    points.forEach(p => {
        if (!map[p.date]) map[p.date] = {}
        map[p.date][p.username] = p.count
    })

    const running: Record<string, number> = {}
    users.forEach(u => {
        running[u.username] = 0
    })

    return dates.map(date => {
        const row: ChartRow = {
            date: format(new Date(date + 'T00:00:00'), 'MMM d'),
        }

        users.forEach(u => {
            const count = map[date]?.[u.username] ?? 0
            running[u.username] += count

            row[`${u.username}_count`] = count
            row[`${u.username}_cumulative`] = running[u.username]
        })

        return row
    })
}