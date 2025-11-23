import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { MainPage } from './pages/MainPage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { validateEnv } from './config/env';
import { isAuthenticated, setAuthToken, setUserInfo } from './utils/auth';
import './App.css';

// 로그인 콜백 처리 컴포넌트
// 서버가 JWT 토큰을 URL Fragment(#)로 전달하여 프론트엔드로 리다이렉트합니다
// Fragment는 서버로 전송되지 않고 브라우저 히스토리에도 남지 않아 보안상 더 안전합니다
const KakaoCallbackHandler = () => {
  const navigate = useNavigate();
  const processedRef = useRef(false);

  useEffect(() => {
    // React Strict Mode에서 중복 실행 방지
    if (processedRef.current) {
      return;
    }

    // URL Fragment에서 토큰 정보 추출
    // 예: http://localhost:5173/login/kakao#accessToken=xxx
    // 백엔드에서 accessToken만 전달하며, refreshToken은 전달하지 않습니다
    const hash = window.location.hash.substring(1); // # 제거
    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    
    if (accessToken) {
      // 처리 중복 방지 플래그 설정
      processedRef.current = true;
      
      // 서버에서 전달받은 JWT 토큰 저장
      setAuthToken(accessToken);
      
      // 사용자 정보가 별도로 전달되는 경우 (선택사항)
      const userInfo = params.get('userInfo');
      if (userInfo) {
        try {
          setUserInfo(JSON.parse(decodeURIComponent(userInfo)));
        } catch (error) {
          console.warn('사용자 정보 파싱 실패:', error);
        }
      }
      
      // Fragment 제거 (보안을 위해 URL에서 토큰 정보 제거)
      window.history.replaceState(null, '', window.location.pathname);
      
      // 로그인 성공 후 메인 페이지로 이동
      navigate('/main', { replace: true });
    } else {
      // 토큰이 없고, 이미 인증된 상태가 아니라면 로그인 페이지로 리다이렉트
      // (이미 인증된 경우는 navigate하지 않음 - 이미 메인 페이지에 있을 수 있음)
      if (!isAuthenticated()) {
        console.error('토큰이 전달되지 않았습니다.');
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
        navigate('/login', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F2F2F7',
    }}>
      <p style={{ fontSize: '16px', color: '#8E8E93' }}>로그인 처리 중...</p>
    </div>
  );
};

// 인증이 필요한 라우트 보호 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
};

function AppContent() {
  useEffect(() => {
    try {
      validateEnv();
    } catch (error) {
      console.error('Environment validation error:', error);
    }
  }, []);

  try {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/login/kakao"
          element={<KakaoCallbackHandler />}
        />
        <Route
          path="/main"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    );
  } catch (error) {
    console.error('App render error:', error);
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

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
