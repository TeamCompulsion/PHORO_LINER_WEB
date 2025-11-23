import { config } from '../config/env';

export const LoginPage = () => {
  const handleKakaoLogin = () => {
    // XHR 없이 브라우저가 직접 서버 URL로 이동
    // 서버가 302 응답을 반환하면 브라우저가 자동으로 Location 헤더의 URL로 리다이렉트됩니다
    // 이 방법은 CORS 문제를 피할 수 있습니다
    window.location.href = `${config.apiBaseUrl}/users/login/kakao/authorization`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F2F2F7',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '48px 32px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '32px',
          fontWeight: '700',
          color: '#000000',
          textAlign: 'center',
          letterSpacing: '-0.5px',
        }}>
          Photo Liner
        </h1>
        <p style={{
          margin: '0 0 40px 0',
          fontSize: '16px',
          color: '#8E8E93',
          textAlign: 'center',
        }}>
          사진을 지도에 기록하세요
        </p>

        <button
          onClick={handleKakaoLogin}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#FEE500',
            color: '#000000',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>카카오 로그인</span>
        </button>
      </div>
    </div>
  );
};

