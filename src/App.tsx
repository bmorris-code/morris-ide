import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import IDELayout from './components/layout/IDELayout';
import { LandingPage, LoginPage, SignupPage, DashboardPage } from './pages';
import { useAuthStore } from './store';
import { isElectron } from './hooks/useElectron';
import './App.css';

// Clerk publishable key (set in .env)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Protected route wrapper (with Clerk)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!clerkPubKey) {
    // Demo mode without Clerk - allow direct access for testing
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

// Web App with routing
function WebApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing / Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* IDE Application */}
        <Route path="/ide" element={
          <ProtectedRoute>
            <IDELayout />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // If running in Electron, go directly to IDE (no auth needed for local)
  if (isElectron()) {
    return <IDELayout />;
  }

  // Wrap with Clerk if key is available
  if (clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <WebApp />
      </ClerkProvider>
    );
  }

  // Fallback without Clerk (demo mode)
  return <WebApp />;
}

export default App;
