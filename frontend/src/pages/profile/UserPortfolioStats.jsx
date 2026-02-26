import React from 'react';

const UserPortfolioStats = ({ data }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stories Card */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <div className="text-2xl font-bold text-blue-900">{data.storiesCount}</div>
                            <div className="text-sm text-blue-700">Stories Published</div>
                        </div>
                    </div>
                </div>
                
                {/* Followers Card */}
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <div className="text-2xl font-bold text-green-900">{data.followersCount}</div>
                            <div className="text-sm text-green-700">Followers</div>
                        </div>
                    </div>
                </div>
                
                {/* Comments Card */}
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <div className="text-2xl font-bold text-purple-900">{data.commentsCount}</div>
                            <div className="text-sm text-purple-700">Comments Received</div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    {data.isAuthor ? (
                        <p>This author has published {data.storiesCount} stories and received {data.commentsCount} comments from readers.</p>
                    ) : (
                        <p>This user is an active reader and community member.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPortfolioStats;
