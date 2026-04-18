import {useState} from 'react'
import {format} from 'date-fns'
import {api} from '../lib/api'
import {Button, Card, Input, PageHeader} from '../components/ui'
import {useAuth} from "../lib/authContext.ts";

const PRESETS = [10, 20, 25, 30, 40, 50, 75, 100]

export default function LogPage() {
    const {user} = useAuth()
    const [count, setCount] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)

    async function submit(e) {
        e.preventDefault()
        if (!count || Number(count) <= 0) {
            setError('Enter a count greater than 0');
            return
        }
        setError('');
        setLoading(true)
        try {
            const entry = await api.addPushups({date, count: Number(count)})
            setSuccess(entry)
            setCount('')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <PageHeader title="Log pushups" subtitle={`Logging for ${user.username}`}/>

            <div style={{padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>

                {success && (
                    <div style={{
                        background: '#e6f6f0', border: '0.5px solid #9fe1cb',
                        borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{fontSize: 20}}>✓</span>
                        <p style={{fontSize: 14, color: '#085041'}}>
                            Logged <strong>{success.count}</strong> pushups on {success.date}
                        </p>
                    </div>
                )}

                <Card>
                    <form onSubmit={submit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        <Input
                            label="Date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                        />

                        <div>
                            <label style={{
                                fontSize: 13,
                                color: 'var(--muted)',
                                fontWeight: 500,
                                display: 'block',
                                marginBottom: 8
                            }}>
                                Count
                            </label>
                            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10}}>
                                {PRESETS.map(n => (
                                    <button key={n} type="button" onClick={() => setCount(String(n))} style={{
                                        padding: '6px 14px', borderRadius: 20,
                                        border: '0.5px solid var(--border)',
                                        background: count === String(n) ? 'var(--accent)' : 'var(--surface)',
                                        color: count === String(n) ? '#fff' : 'var(--text)',
                                        fontSize: 14, fontWeight: 500,
                                    }}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Or type a custom number…"
                                value={count}
                                onChange={e => setCount(e.target.value)}
                                error={error}
                            />
                        </div>

                        <Button type="submit" loading={loading} style={{width: '100%'}}>
                            Save
                        </Button>
                    </form>
                </Card>

                <p style={{fontSize: 12, color: 'var(--muted)', textAlign: 'center'}}>
                    Saving again for the same date will replace that day's total.
                </p>
            </div>
        </div>
    )
}