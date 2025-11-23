import { useNavigate } from 'react-router-dom';
import { config } from '../config/env';

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    // XHR 없이 브라우저가 직접 서버 URL로 이동
    // 서버가 302 응답을 반환하면 브라우저가 자동으로 Location 헤더의 URL로 리다이렉트됩니다
    // 이 방법은 CORS 문제를 피할 수 있습니다
    window.location.href = `${config.apiBaseUrl}/users/login/kakao/authorization`;
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #FAFBFC 0%, #F5F7FA 100%)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* 미묘한 배경 패턴 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(102, 126, 234, 0.03) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(118, 75, 162, 0.03) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      {/* 헤더 */}
      <header style={{
        padding: '20px 0',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <button
            onClick={handleBackToHome}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#000000',
            letterSpacing: '-0.5px',
          }}>
            Photo Liner
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
        }}>
          {/* 로고 및 타이틀 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            <div style={{
              fontSize: 'clamp(36px, 6vw, 48px)',
              fontWeight: '800',
              color: '#000000',
              marginBottom: '12px',
              letterSpacing: '-1px',
            }}>
              Photo Liner
            </div>
            <p style={{
              fontSize: '18px',
              color: '#666666',
              margin: 0,
              lineHeight: '1.6',
            }}>
              여행의 순간을 지도에 기록하세요
            </p>
          </div>

          {/* 로그인 카드 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '48px 40px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#000000',
              margin: '0 0 8px 0',
              textAlign: 'center',
              letterSpacing: '-0.5px',
            }}>
              로그인
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#666666',
              margin: '0 0 32px 0',
              textAlign: 'center',
            }}>
              카카오 계정으로 간편하게 시작하세요
            </p>

            <button
              onClick={handleKakaoLogin}
              style={{
                width: '100%',
                padding: '16px 24px',
                backgroundColor: '#FEE500',
                color: '#000000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(254, 229, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FDD835';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 229, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE500';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(254, 229, 0, 0.3)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2C5.589 2 2 5.589 2 10C2 11.5 2.4 12.9 3.1 14.1L2 18L5.9 16.9C7.1 17.6 8.5 18 10 18C14.411 18 18 14.411 18 10C18 5.589 14.411 2 10 2Z" fill="#000000"/>
                <circle cx="7" cy="9" r="1.5" fill="#FEE500"/>
                <circle cx="13" cy="9" r="1.5" fill="#FEE500"/>
                <path d="M7 12C7 12 8.5 13.5 10 13.5C11.5 13.5 13 12 13 12" stroke="#FEE500" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>카카오로 시작하기</span>
            </button>

            {/* 추가 정보 */}
            <div style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            }}>
              <p style={{
                fontSize: '13px',
                color: '#999999',
                textAlign: 'center',
                margin: 0,
                lineHeight: '1.6',
              }}>
                로그인 시 Photo Liner의{' '}
                <a href="#" style={{ color: '#666666', textDecoration: 'none' }}>서비스 이용약관</a>
                {' '}및{' '}
                <a href="#" style={{ color: '#666666', textDecoration: 'none' }}>개인정보 처리방침</a>
                에 동의하게 됩니다.
              </p>
            </div>
          </div>

          {/* 하단 링크 */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
          }}>
            <button
              onClick={handleBackToHome}
              style={{
                background: 'none',
                border: 'none',
                color: '#666666',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '8px',
              }}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

