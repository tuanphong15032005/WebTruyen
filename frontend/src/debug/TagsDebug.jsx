import React, { useEffect, useState } from 'react';
import storyService from '../services/storyService';

const TagsDebug = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await storyService.getTags();
        console.log('Raw response:', response);
        console.log('Type of response:', typeof response);
        console.log('Is array?', Array.isArray(response));
        
        setTags(response);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'Failed to fetch tags');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Tags Debug</h2>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <h3>Response Data:</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(tags, null, 2)}
      </pre>
      
      <h3>Response Type:</h3>
      <p>{typeof tags}</p>
      
      <h3>Is Array:</h3>
      <p>{Array.isArray(tags) ? 'Yes' : 'No'}</p>
      
      <h3>Length:</h3>
      <p>{tags?.length || 0}</p>
    </div>
  );
};

export default TagsDebug;
