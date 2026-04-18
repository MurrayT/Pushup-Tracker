import {NavLink, Outlet} from 'react-router'

const navItems = [
    {to: '/', label: 'Home', icon: HomeIcon},
    {to: '/log', label: 'Log', icon: PlusIcon},
    {to: '/leaderboard', label: 'Leaderboard', icon: TrophyIcon},
]

export default function Layout() {
    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100dvh'}}>
            <main style={{flex: 1, overflowY: 'auto', paddingBottom: '5rem'}}>
                <Outlet/>
            </main>

            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'var(--surface)',
                borderTop: '0.5px solid var(--border)',
                display: 'flex',
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}>
                {navItems.map(({to, label, icon: Icon}) => (
                    <NavLink key={to} to={to} end={to === '/'} style={{flex: 1}}>
                        {({isActive}) => (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                gap: 3, padding: '10px 0',
                                color: isActive ? 'var(--accent)' : 'var(--muted)',
                                fontSize: 11, fontWeight: isActive ? 600 : 400,
                            }}>
                                <Icon size={22} active={isActive}/>
                                {label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}

interface NavIconProps {
    size: number;
    active: boolean;
}

function HomeIcon({size, active}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
        </svg>
    )
}

function PlusIcon({size, active}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8v8M8 12h8"/>
        </svg>
    )
}

function TrophyIcon({size, active}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4H4v4c0 2.2 1.8 4 4 4"/>
            <path d="M17 4h3v4c0 2.2-1.8 4-4 4"/>
            <path d="M7 4h10v6a5 5 0 0 1-10 0V4z"/>
        </svg>
    )
}