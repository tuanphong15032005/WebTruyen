import React from 'react';

const TokenDebug = () => {
  const checkToken = () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      alert('No token found!');
      return;
    }

    try {
      // Decode JWT token
      const parts = token.split('.');
      if (parts.length !== 3) {
        alert('Invalid token format!');
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      
      alert(`Token Info:
- Subject: ${payload.sub}
- Username: ${payload.username}
- Issued At: ${new Date(payload.iat * 1000).toLocaleString()}
- Expires At: ${new Date(payload.exp * 1000).toLocaleString()}
- Current Time: ${new Date(now * 1000).toLocaleString()}
- Is Expired: ${isExpired}
- Time Until Expiry: ${isExpired ? 'EXPIRED' : Math.floor((payload.exp - now) / 60) + ' minutes'}`);

      if (isExpired) {
        alert('TOKEN IS EXPIRED! Please login again.');
      }
    } catch (error) {
      alert('Error decoding token: ' + error.message);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    alert('Tokens cleared. Please login again.');
    window.location.href = '/login';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Token Debug</h2>
      
      <button onClick={checkToken} style={{ marginRight: '10px' }}>
        Check Token Expiry
      </button>
      
      <button onClick={clearTokens}>
        Clear Tokens & Login Again
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Current Token:</h3>
        <div style={{ 
          wordBreak: 'break-all', 
          background: '#f5f5f5', 
          padding: '10px',
          fontSize: '10px'
        }}>
          {localStorage.getItem('accessToken') || 'No token'}
        </div>
      </div>
    </div>
  );
};

export default TokenDebug;
