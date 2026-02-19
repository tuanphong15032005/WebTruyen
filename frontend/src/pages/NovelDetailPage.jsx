import React from 'react';
import { useParams } from 'react-router-dom';

function NovelDetailPage() {
    const { id } = useParams();

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h1 style={{ marginTop: 0 }}>Novel Detail</h1>
            <p style={{ opacity: 0.85 }}>Placeholder page for novel id: {id}</p>
        </div>
    );
}

export default NovelDetailPage;
