import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { Logo } from '@/components/ui/logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password'
          : err.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="flex justify-center">
            <Logo size="md" className="mb-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to your wallet</p>
        </div>

        <div className="bg-white/3 border border-white/10 rounded-2xl p-8 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F0E7A1]/50 focus:bg-white/8 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F0E7A1]/50 focus:bg-white/8 transition-colors"
            />
            <div className="flex justify-end">
              <Link
                to="/Forgot"
                tabIndex={-1}
                className="text-xs text-[#F0E7A1]/60 hover:text-[#F0E7A1] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-[#F0E7A1] text-black font-semibold rounded-xl hover:bg-[#F0E7A1]/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        <p className="text-center text-sm text-white/30 mt-6">
          Don't have an account?{' '}
          <Link to="/Register" className="text-[#F0E7A1]/70 hover:text-[#F0E7A1] transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
