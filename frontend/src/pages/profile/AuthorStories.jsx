import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthorStories = ({ userId }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const publishedStories = stories.filter(
        (story) => String(story?.status || '').trim().toLowerCase() === 'published'
    );

    useEffect(() => {
        const fetchAuthorStories = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8081/api/users/${userId}/stories`);
                const storiesData = await response.json();
                setStories(storiesData);
            } catch (error) {
                console.error('Error fetching author stories:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchAuthorStories();
        }
    }, [userId]);

    const handleStoryClick = (storyId) => {
        navigate(`/stories/${storyId}/metadata`);
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading stories...</p>
            </div>
        );
    }

    if (publishedStories.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">No published stories yet.</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Published Stories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {publishedStories.map((story) => (
                    <div
                        key={story.storyId}
                        onClick={() => handleStoryClick(story.storyId)}
                        className="cursor-pointer group"
                    >
                        <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                            {/* Story Cover */}
                            <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                                {story.coverUrl ? (
                                    <img
                                        src={story.coverUrl}
                                        alt={story.title}
                                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-64 bg-gray-300 flex items-center justify-center">
                                        <span className="text-gray-500 text-4xl">📚</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Story Info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <h4 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-blue-300 transition-colors">
                                    {story.title}
                                </h4>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-300">
                                        {story.status || 'Ongoing'}
                                    </span>
                                    <span className="text-xs text-gray-300">
                                        {new Date(story.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuthorStories;
