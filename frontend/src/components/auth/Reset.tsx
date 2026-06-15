import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from './NavBarLanding';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../firebase';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(location.search);
  const oobCode = urlParams.get('oobCode');

  const validatePasswordComplexity = (password: string) => {
    if (password.length < 12) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    if (!/\W/.test(password)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oobCode) {
      setError('Invalid or missing reset link. Please request a new one.');
      return;
    }

    if (!validatePasswordComplexity(newPassword)) {
      setError('Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccessMessage('Your password has been successfully reset!');
      setError('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/Login'), 2000);
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-action-code'
          ? 'This reset link is invalid or has expired. Please request a new one.'
          : err.message || 'Something went wrong.';
      setError(msg);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-base-200 p-6 rounded-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Reset Your Password</h2>

          {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit}>
            <label className="mb-2">New Password</label>
            <input
              type="password"
              className="input w-full mb-2"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label className="mb-2">Confirm Password</label>
            <input
              type="password"
              className="input w-full mb-4"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button className="btn bg-white text-black w-full" type="submit">
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
