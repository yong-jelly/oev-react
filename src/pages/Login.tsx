import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../shared/api/supabase';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (signInError) throw signInError;
      // OAuth는 리다이렉트되므로 여기서 navigate하지 않음
    } catch (err: any) {
      setError(err.message || '구글 로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <header className="p-4">
        <button 
          onClick={() => navigate('/onboarding')} 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft-sm text-surface-700 hover:bg-surface-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[32px] shadow-soft-xl border border-surface-100">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-medium text-surface-900 tracking-tight leading-tight">
              도로 위로<br/>복귀하기
            </h1>
            <p className="text-sm text-surface-500 leading-relaxed">
              트럭커 서비스는 구글 계정을 통한<br/>간편 로그인을 지원합니다.
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-accent-rose/10 text-accent-rose text-xs font-medium animate-in fade-in zoom-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-16 bg-white border-2 border-surface-100 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:border-primary-200 hover:bg-surface-50 disabled:opacity-50 group"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="text-base font-medium text-surface-700 group-hover:text-surface-900">
                {loading ? '연결 중...' : 'Google 계정으로 계속하기'}
              </span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-surface-400 leading-relaxed uppercase tracking-widest font-medium">
              Secure Login via Supabase Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
