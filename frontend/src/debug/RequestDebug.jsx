import React, { useEffect, useState } from 'react';
import api from '../services/api';

const RequestDebug = () => {
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  useEffect(() => {
    // Override console.log to capture API logs
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('API Request')) {
        addLog(args.join(' '));
      }
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      originalWarn(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('API Request')) {
        addLog('WARN: ' + args.join(' '));
      }
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, []);

  const testRequest = async () => {
    try {
      addLog('Testing API request...');
      const response = await api.get('/stories/my');
      addLog('Request successful: ' + JSON.stringify(response).substring(0, 100) + '...');
    } catch (error) {
      addLog('Request failed: ' + error.message);
      addLog('Error details: ' + JSON.stringify(error.response?.data || 'No response data'));
    }
  };

  const testMultipartRequest = async () => {
    try {
      addLog('Testing multipart request...');
      const formData = new FormData();
      formData.append('data', JSON.stringify({ title: 'test' }));
      
      const response = await api.post('/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      addLog('Multipart successful: ' + JSON.stringify(response).substring(0, 100) + '...');
    } catch (error) {
      addLog('Multipart failed: ' + error.message);
      addLog('Multipart error details: ' + JSON.stringify(error.response?.data || 'No response data'));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Request Debug</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testRequest} style={{ marginRight: '10px' }}>
          Test GET Request
        </button>
        <button onClick={testMultipartRequest}>
          Test Multipart Request
        </button>
      </div>

      <h3>Console Logs:</h3>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        maxHeight: '400px', 
        overflow: 'auto',
        fontSize: '12px'
      }}>
        {logs.length === 0 ? (
          <p>No logs yet. Try making a request.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              <span style={{ color: '#666' }}>[{log.time}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      <h3>Current Token:</h3>
      <button onClick={() => {
        const token = localStorage.getItem('accessToken');
        alert(`Token: ${token ? 'EXISTS' : 'MISSING'}\nLength: ${token?.length || 0}`);
      }}>
        Check Token
      </button>
    </div>
  );
};

export default RequestDebug;
