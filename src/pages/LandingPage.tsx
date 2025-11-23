import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

export const LandingPage = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleGetStarted = () => {
    if (authenticated) {
      navigate('/main');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #FAFBFC 0%, #F5F7FA 100%)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
    }}>
      {/* 미묘한 배경 패턴 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.03) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      {/* 헤더 */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        padding: '20px 0',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#000000',
            letterSpacing: '-0.5px',
          }}>
            Photo Liner
          </div>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '10px 24px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
            }}
          >
            {authenticated ? '시작하기' : '로그인'}
          </button>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section style={{
        padding: '120px 24px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 72px)',
          fontWeight: '800',
          color: '#000000',
          margin: '0 0 24px 0',
          letterSpacing: '-1px',
          lineHeight: '1.1',
        }}>
          여행의 순간을<br />
          지도에 기록하세요
        </h1>
        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          color: '#666666',
          margin: '0 0 48px 0',
          lineHeight: '1.6',
        }}>
          Photo Liner로 사진을 업로드하고<br />
          여행 경로를 한눈에 확인해보세요
        </p>
        <button
          onClick={handleGetStarted}
          style={{
            padding: '18px 48px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#333333';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#000000';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          {authenticated ? '시작하기' : '무료로 시작하기'}
        </button>
      </section>

      {/* 주요 기능 섹션 */}
      <section style={{
        padding: '100px 24px',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '700',
            color: '#000000',
            textAlign: 'center',
            margin: '0 0 16px 0',
            letterSpacing: '-0.5px',
          }}>
            주요 기능
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#666666',
            textAlign: 'center',
            margin: '0 0 64px 0',
          }}>
            Photo Liner의 강력한 기능들을 만나보세요
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            marginTop: '64px',
          }}>
            {/* 기능 1 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
              border: '1px solid rgba(0, 0, 0, 0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.03)';
            }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                fontSize: '32px',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.04)',
              }}>
                🗺️
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#000000',
                margin: '0 0 12px 0',
              }}>
                여행 경로 시각화
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#666666',
                lineHeight: '1.6',
                margin: 0,
              }}>
                앨범 내 사진들에 대한 날짜 순 경로를 지도에서 바로 볼 수 있습니다. 
                편리하게 여행 경로를 파악할 수 있어요.
              </p>
            </div>

            {/* 기능 2 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
              border: '1px solid rgba(0, 0, 0, 0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.03)';
            }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                fontSize: '32px',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.04)',
              }}>
                📸
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#000000',
                margin: '0 0 12px 0',
              }}>
                지도에서 사진 확인
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#666666',
                lineHeight: '1.6',
                margin: 0,
              }}>
                업로드한 사진들을 지도에서 바로 볼 수 있습니다. 
                각 사진의 위치를 한눈에 확인하고 추억을 되돌아보세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section style={{
        padding: '100px 24px',
        background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
        color: '#FFFFFF',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '700',
            margin: '0 0 24px 0',
            letterSpacing: '-0.5px',
          }}>
            지금 시작해보세요
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#CCCCCC',
            margin: '0 0 40px 0',
            lineHeight: '1.6',
          }}>
            Photo Liner와 함께 여행의 순간들을 기록하고 공유해보세요
          </p>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '18px 48px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {authenticated ? '시작하기' : '무료로 시작하기'}
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer style={{
        padding: '40px 24px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '12px',
          }}>
            Photo Liner
          </div>
          <p style={{
            fontSize: '14px',
            color: '#999999',
            margin: 0,
          }}>
            © 2025 Photo Liner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

