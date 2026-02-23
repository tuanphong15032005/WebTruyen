import React, { useEffect, useState } from 'react';

const AuthDebug = () => {
  const [tokenInfo, setTokenInfo] = useState({});

  useEffect(() => {
    // Kiểm tra các token có thể có trong localStorage
    const accessToken = localStorage.getItem('accessToken');
    const userRaw = localStorage.getItem('user');
    let userToken = null;
    
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        userToken = user?.token || user?.accessToken;
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    setTokenInfo({
      accessToken,
      userRaw,
      userToken,
      hasAccessToken: !!accessToken,
      hasUserToken: !!userToken,
      finalToken: accessToken || userToken,
    });

    console.log('Token Debug Info:', {
      accessToken,
      userRaw,
      userToken,
      finalToken: accessToken || userToken,
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Authentication Debug</h2>
      
      <h3>Token Information:</h3>
      <pre style={{ background: '#f5f5f5', padding: '10px' }}>
        {JSON.stringify(tokenInfo, null, 2)}
      </pre>
      
      <h3>localStorage Contents:</h3>
      <button onClick={() => console.log(localStorage)}>
        Log localStorage to console
      </button>
      
      <h3>Test Token:</h3>
      <button onClick={() => {
        const token = localStorage.getItem('accessToken') || 
                     JSON.parse(localStorage.getItem('user') || '{}')?.token ||
                     JSON.parse(localStorage.getItem('user') || '{}')?.accessToken;
        console.log('Final token:', token);
        alert(`Token: ${token ? 'EXISTS' : 'MISSING'}\nLength: ${token?.length || 0}`);
      }}>
        Check Token
      </button>
    </div>
  );
};

export default AuthDebug;
