import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import UserPortfolioHeader from './UserPortfolioHeader';
import UserPortfolioSidebar from './UserPortfolioSidebar';
import UserPortfolioStats from './UserPortfolioStats';
import AuthorStories from './AuthorStories';

const UserPortfolioPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPortfolioData = async () => {
            try {
                console.log('🔍 Fetching portfolio for userId:', userId); // Debug log
                setLoading(true);
                const response = await api.get(`/users/${userId}/portfolio`);
                console.log('📡 Full API Response:', response); // Debug log
                console.log('📡 Response type:', typeof response); // Debug log
                console.log('📡 Response keys:', Object.keys(response || {})); // Debug log
                
                // Fix: Use response directly instead of response.data
                const portfolioData = response.data || response;
                console.log('📊 Portfolio data:', portfolioData); // Debug log
                setPortfolioData(portfolioData);
            } catch (err) {
                console.error('❌ Portfolio fetch error:', err); // Debug log
                setError(err.response?.data?.message || 'Failed to load portfolio data');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchPortfolioData();
        }
    }, [userId]);

    const handleDonateClick = () => {
        navigate(`/donate/${userId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading portfolio...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!portfolioData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Portfolio data not available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Profile */}
            <UserPortfolioHeader 
                data={portfolioData} 
                onDonateClick={handleDonateClick}
            />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-1">
                        <UserPortfolioSidebar data={portfolioData} />
                    </div>
                    
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        <UserPortfolioStats data={portfolioData} />
                        
                        {/* Author Stories - Only show if user is author */}
                        {portfolioData.author && (
                            <AuthorStories userId={userId} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPortfolioPage;
