import React from 'react'
import ReactDOM, {type Container} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router'
import {AuthProvider} from './lib/auth'
import './index.css'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LogPage from './pages/LogPage'
import LeaderboardPage from './pages/LeaderboardPage'
import TVPage from './pages/TVPage'
import Layout from './components/Layout'
import PrivateRoute from "./components/PrivateRoute"


ReactDOM.createRoot(document.getElementById('root') as Container).render(
    <React.StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path="/tv" element={<TVPage/>}/>
                    <Route element={<PrivateRoute><Layout/></PrivateRoute>}>
                        <Route index element={<DashboardPage/>}/>
                        <Route path="/log" element={<LogPage/>}/>
                        <Route path="/leaderboard" element={<LeaderboardPage/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>
)