import React, { useState } from 'react';
import storyService from '../services/storyService';

const ResponseDebug = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testCreateStory = async () => {
    setLoading(true);
    setError('');
    setResponse(null);
    
    try {
      // Tạo payload giống như CreateStory
      const payload = {
        title: 'Test Story ' + Date.now(),
        summaryHtml: 'This is a test story created for debugging response format.',
        tagIds: [1], // Romance tag
        status: 'draft',
        visibility: 'DRAFT',
        kind: 'original',
        originalAuthorName: null,
        completionStatus: 'ongoing',
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));
      // Không gửi cover file để đơn giản

      console.log('Sending payload:', payload);
      console.log('FormData content:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const apiResponse = await storyService.createStory(formData);
      
      console.log('Full API response:', apiResponse);
      console.log('Response type:', typeof apiResponse);
      console.log('Response keys:', Object.keys(apiResponse || {}));
      console.log('Response.data:', apiResponse?.data);
      console.log('Response.id:', apiResponse?.id);
      console.log('Response.storyId:', apiResponse?.storyId);
      
      setResponse(apiResponse);
      
    } catch (err) {
      console.error('Create story error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Response Debug</h2>
      
      <button onClick={testCreateStory} disabled={loading}>
        {loading ? 'Creating...' : 'Test Create Story'}
      </button>
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>Response Structure:</h3>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            whiteSpace: 'pre-wrap',
            fontSize: '12px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {JSON.stringify(response, null, 2)}
          </div>
          
          <h3>Extracted IDs:</h3>
          <p><strong>response.id:</strong> {response?.id || 'undefined'}</p>
          <p><strong>response.data?.id:</strong> {response?.data?.id || 'undefined'}</p>
          <p><strong>response.storyId:</strong> {response?.storyId || 'undefined'}</p>
          <p><strong>response.data?.storyId:</strong> {response?.data?.storyId || 'undefined'}</p>
        </div>
      )}
    </div>
  );
};

export default ResponseDebug;
