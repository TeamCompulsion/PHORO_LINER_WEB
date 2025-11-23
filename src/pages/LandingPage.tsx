import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

export const LandingPage = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleGetStarted = () => {
    if (isAuthenticated()) {
      navigate('/main');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text-main)',
      fontFamily: 'var(--font-main)',
      overflowX: 'hidden',
    }}>
      {/* Background Gradients */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            background: 'var(--gradient-main)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            Photo Liner
          </div>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-main)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {authenticated ? '앱 열기' : '로그인'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        zIndex: 1,
        padding: '8rem 1.5rem',
        textAlign: 'center',
        maxWidth: '1024px',
        margin: '0 auto',
      }}>
        <div style={{ animation: 'slideUp 0.8s ease-out' }}>
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
          }}>
            여행의 모든 순간을<br />
            <span style={{
              background: 'var(--gradient-main)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>지도 위에 그리다</span>
          </h1>
          <p style={{
            fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
            color: 'var(--text-muted)',
            marginBottom: '3rem',
            maxWidth: '640px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6',
          }}>
            당신의 소중한 추억이 담긴 사진들을 지도 위에 펼쳐보세요.
            Photo Liner가 당신의 여정을 아름다운 이야기로 만들어드립니다.
          </p>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '1rem 2.5rem',
              background: 'var(--gradient-main)',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
            }}
          >
            {authenticated ? '나의 지도 보기' : '무료로 시작하기'}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        position: 'relative',
        zIndex: 1,
        padding: '6rem 1.5rem',
        background: 'linear-gradient(180deg, transparent 0%, rgba(30, 41, 59, 0.3) 100%)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}>
            {[
              {
                icon: '🗺️',
                title: '직관적인 경로 시각화',
                desc: '복잡한 설정 없이 사진만 업로드하세요. 자동으로 촬영 위치와 시간을 분석하여 당신만의 여행 지도를 그려냅니다.'
              },
              {
                icon: '📸',
                title: '위치 기반 갤러리',
                desc: '지도 위의 마커를 클릭하여 그 장소에서의 추억을 생생하게 다시 만나보세요. 시간 순서대로 정리된 여정을 감상할 수 있습니다.'
              },
              {
                icon: '✨',
                title: '아름다운 디자인',
                desc: '당신의 여행 기록을 더욱 돋보이게 만들어줄 세련되고 현대적인 인터페이스를 경험해보세요.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '1.5rem',
                  padding: '2.5rem',
                  transition: 'all 0.3s ease',
                  animation: `slideUp 0.8s ease-out ${index * 0.2}s backwards`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1.5rem',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  color: 'var(--text-main)',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.6',
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        position: 'relative',
        zIndex: 1,
        padding: '8rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'var(--gradient-surface)',
          padding: '4rem 2rem',
          borderRadius: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '800',
            marginBottom: '1.5rem',
          }}>
            지금 바로 시작하세요
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-muted)',
            marginBottom: '3rem',
          }}>
            Photo Liner와 함께라면 당신의 여행은 더욱 특별해집니다.
          </p>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '1rem 3rem',
              backgroundColor: 'var(--text-main)',
              color: 'var(--background)',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {authenticated ? '시작하기' : '무료로 가입하기'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}>
        <p>© 2025 Photo Liner. All rights reserved.</p>
      </footer>
    </div>
  );
};

