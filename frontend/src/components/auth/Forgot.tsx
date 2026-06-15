import { useState } from 'react';
import Navigation from './NavBarLanding';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendReset = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent. Check your inbox and follow the link to reset your password.');
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found'
          ? 'No account found with this email address.'
          : 'Failed to send reset email. Please try again.';
      setError(msg);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-base-200 p-6 rounded-lg w-full max-w-md space-y-4">
          <h2 className="text-xl font-bold">Forgot your password?</h2>
          <p className="text-sm text-gray-400">
            Enter your email and we'll send you a link to reset your password.
          </p>

          <label className="block">Email</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-400">{success}</p>}

          <button
            className="btn bg-white text-black w-full"
            onClick={handleSendReset}
          >
            Send Reset Email
          </button>

          <a href="/Login" className="block text-center text-sm text-blue-400 hover:underline mt-2">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
