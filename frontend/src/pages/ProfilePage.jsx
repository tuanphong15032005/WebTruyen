import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function ProfilePage() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user')
            if (!storedUser) {
                navigate('/login')
                return
            }
            const userData = JSON.parse(storedUser)
            setUser(userData)
        } catch (error) {
            console.error('Error parsing user data:', error)
            navigate('/login')
        } finally {
            setLoading(false)
        }
    }, [navigate])

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">Please login to view profile.</div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
                <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    onClick={() => navigate('/')}
                >
                    Quay lại
                </button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-2xl font-bold">
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user.username}</h2>
                        <p className="text-sm opacity-80">{user.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                        <div className="text-sm opacity-80 mb-1">Tên hiển thị</div>
                        <div className="font-semibold">{user.displayName || user.username}</div>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                        <div className="text-sm opacity-80 mb-1">Email</div>
                        <div className="font-semibold">{user.email}</div>
                    </div>

                    {user.authorPenName && (
                        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                            <div className="text-sm opacity-80 mb-1">Bút danh tác giả</div>
                            <div className="font-semibold">{user.authorPenName}</div>
                        </div>
                    )}

                    {user.authorProfileBio && (
                        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] md:col-span-2">
                            <div className="text-sm opacity-80 mb-1">Tiểu sử tác giả</div>
                            <div className="font-semibold">{user.authorProfileBio}</div>
                        </div>
                    )}

                    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                        <div className="text-sm opacity-80 mb-1">Ngày tạo</div>
                        <div className="font-semibold">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                    </div>

                    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                        <div className="text-sm opacity-80 mb-1">Trạng thái</div>
                        <div className="font-semibold">
                            {user.verified ? (
                                <span className="text-green-500">✓ Đã xác thực</span>
                            ) : (
                                <span className="text-yellow-500">Chưa xác thực</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
