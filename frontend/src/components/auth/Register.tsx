import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { Logo } from '@/components/ui/logo';

const wordList = [
  "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew", "kiwi", "lemon",
  "mango", "nectarine", "orange", "papaya", "quince", "raspberry", "strawberry", "tangerine", "umbrella",
  "violet", "watermelon", "xenon", "yellow", "zebra", "avocado", "blueberry", "cantaloupe", "dragonfruit",
  "endive", "fennel", "gooseberry", "hazelnut", "indigo", "jalapeno", "kumquat", "lime", "melon", "nectar",
  "olive", "peach", "pear", "plum", "pineapple", "pomegranate", "quinoa", "saffron", "tomato",
  "ugli", "vanilla", "watercress", "xylophone", "yellowtail", "zinnia", "artichoke", "celery",
  "coconut", "dandelion", "edamame", "garbanzo", "habanero", "iceberg", "jicama", "litchi",
  "paprika", "potato", "salad", "taro", "tomatillo", "yam", "zucchini", "apricot", "beetroot",
  "dill", "grapefruit", "honey", "kiwifruit", "lemonade", "radish", "spinach", "rosemary", "thyme",
];

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const generatePassphrase = () =>
  Array.from({ length: 12 }, () => wordList[Math.floor(Math.random() * wordList.length)]).join(' ');

const validatePasswordComplexity = (password: string) =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /\W/.test(password);

const walletTypes = [
  { id: 'Individual', label: 'Individual', description: 'Personal crypto management' },
  { id: 'Trader', label: 'Trader', description: 'Active trading & analytics' },
  { id: 'Institutional', label: 'Institutional', description: 'Enterprise-grade security' },
];

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletType, setWalletType] = useState('Individual');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!validatePasswordComplexity(password)) {
      setError('Password must be at least 12 characters and include uppercase, lowercase, number, and symbol');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();

      const res = await fetch(`${API_URL}/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletType, recoveryPhrase: generatePassphrase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create wallet');
      }

      navigate('/Login');
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists'
          : err.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="flex justify-center">
            <Logo size="md" className="mb-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your wallet</h1>
          <p className="text-white/40 text-sm mt-1">Get started in seconds</p>
        </div>

        <div className="bg-white/3 border border-white/10 rounded-2xl p-8 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F0E7A1]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Password</label>
            <input
              type="password"
              placeholder="Min. 12 chars, mixed case, number, symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F0E7A1]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Confirm password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F0E7A1]/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/60">Account type</label>
            <div className="grid grid-cols-3 gap-2">
              {walletTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setWalletType(t.id)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    walletType === t.id
                      ? 'border-[#F0E7A1]/50 bg-[#F0E7A1]/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`text-xs font-semibold ${walletType === t.id ? 'text-[#F0E7A1]' : 'text-white/70'}`}>{t.label}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-2.5 bg-[#F0E7A1] text-black font-semibold rounded-xl hover:bg-[#F0E7A1]/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating wallet…' : 'Create wallet'}
          </button>
        </div>

        <p className="text-center text-sm text-white/30 mt-6">
          Already have an account?{' '}
          <Link to="/Login" className="text-[#F0E7A1]/70 hover:text-[#F0E7A1] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
