import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { SignUp } from '@clerk/clerk-react';
import { useAuthStore } from '../store/useAuthStore';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const benefits = [
  'Access to AI-powered coding assistance',
  'Real-time security vulnerability scanning',
  'Cloud sync across all your devices',
  'Priority support & updates',
];

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // If Clerk is configured, use Clerk's SignUp component
  if (clerkPubKey) {
    return (
      <div className="min-h-screen bg-gray-950 flex">
        {/* Left side - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-900/20 to-gray-950 p-12 flex-col justify-center">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-6">Start coding smarter today</h2>
            <ul className="space-y-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                    <Check size={14} />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Right side - Clerk SignUp */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2">
                <span className="text-3xl">🚀</span>
                <span className="text-2xl font-bold text-violet-400">Morris IDE</span>
              </Link>
            </div>
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'bg-gray-900 border border-gray-800',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-gray-400',
                  formFieldLabel: 'text-gray-400',
                  formFieldInput: 'bg-gray-800 border-gray-700 text-white',
                  formButtonPrimary: 'bg-violet-600 hover:bg-violet-700',
                  footerActionLink: 'text-violet-400',
                }
              }}
              redirectUrl="/dashboard"
              signInUrl="/login"
            />
          </div>
        </div>
      </div>
    );
  }

  // Demo mode signup form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-900/20 to-gray-950 p-12 flex-col justify-center">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-6">Start coding smarter today</h2>
          <ul className="space-y-4">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                  <Check size={14} />
                </div>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-12 p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
            <p className="text-gray-400 italic">"Morris IDE has transformed how I write code. The AI assistance catches bugs before I even finish typing!"</p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold">JD</div>
              <div>
                <div className="font-medium">Jane Developer</div>
                <div className="text-sm text-gray-500">Senior Engineer @ TechCorp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">🚀</span>
              <span className="text-2xl font-bold text-violet-400">Morris IDE</span>
            </Link>
            <p className="text-gray-400 mt-2">Create your free account</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:border-violet-500 focus:outline-none"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 rounded-lg py-3 font-medium flex items-center justify-center gap-2">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By signing up, you agree to our <a href="#" className="text-violet-400">Terms</a> and <a href="#" className="text-violet-400">Privacy Policy</a>
              </p>
            </form>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
