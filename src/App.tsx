import { useEffect } from 'react';
import { MainPage } from './pages/MainPage';
import { validateEnv } from './config/env';
import './App.css';

function App() {
  useEffect(() => {
    try {
      validateEnv();
    } catch (error) {
      console.error('Environment validation error:', error);
    }
  }, []);

  try {
    return <MainPage />;
  } catch (error) {
    console.error('MainPage render error:', error);
    return (
      <div style={{
        padding: '20px',
        color: '#FF3B30',
        fontSize: '16px',
      }}>
        애플리케이션을 로드하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.
      </div>
    );
  }
}

export default App;
