import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SessionCreator from '@/components/SessionCreator';
import SessionDashboard from '@/components/SessionDashboard';
import ContactForm from '@/components/ContactForm/ContactForm';
import Auth from '@/components/Auth/Auth';
import UserDashboard from '@/components/UserDashboard';
import { Toaster } from '@/components/ui/toaster';
import { Users, LogOut, Home, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import 'react-phone-number-input/style.css';
import { Analytics } from '@vercel/analytics/react';

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}


function App() {
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoadingAuth(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED' || _event === 'INITIAL_SESSION') {
        setIsLoadingAuth(false);
      }
      if (_event === 'SIGNED_OUT') {
        setIsLoadingAuth(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <AppContent authSession={session} />
        <Toaster />
      </div>
    </Router>
  );
}

function AppContent({ authSession }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentSessionData, setCurrentSessionData] = useState(null);

  const isContactFormRoute = location.pathname.startsWith('/contact/');
  const isAuthRoute = location.pathname === '/auth';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSessionCreated = (sessionData) => {
    setCurrentSessionData(sessionData);
    navigate(`/session/${sessionData.id}/dashboard`);
  };
  
  const handleBackToUserDashboard = () => {
    setCurrentSessionData(null);
    navigate('/dashboard');
  };

  const showHeader = !isContactFormRoute && !isAuthRoute && authSession;
  const showMainTitleAndLoginButton = location.pathname === '/' && !authSession && !isContactFormRoute;


  return (
    <div className="p-4">
      {showHeader && (
        <header className="container mx-auto mb-8 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-purple-300 hover:text-purple-100">
            <Home className="w-5 h-5 mr-2" />
            My Dashboard
          </Button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-purple-300"
          >
            <span>{authSession.user.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20">
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </Button>
          </motion.div>
        </header>
      )}

      {showMainTitleAndLoginButton && (
         <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center my-12"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Users className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Contact
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Flow
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Create time-limited, secure sessions for collecting contacts. Share a link, gather information, 
            and automatically download VCF or CSV files. All data securely stored and managed.
          </motion.p>
          <Button onClick={() => navigate('/auth')} size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg">
            <LogIn className="w-5 h-5 mr-2" /> Get Started / Log In
          </Button>
        </motion.div>
      )}


      <main className="container mx-auto">
        <Routes>
          <Route path="/auth" element={authSession ? <Navigate to="/dashboard" replace /> : <Auth />} />
          
          <Route path="/dashboard" element={authSession ? <UserDashboard /> : <Navigate to="/auth" replace />} />
          
          <Route 
            path="/create-session" 
            element={authSession ? <SessionCreator onSessionCreated={handleSessionCreated} userId={authSession.user.id} /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/session/:sessionId/dashboard" 
            element={
              authSession ? (
                <SessionLoaderAndDashboard onBack={handleBackToUserDashboard} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          
          <Route path="/contact/:sessionId" element={<ContactFormWrapper />} />
          <Route path="/" element={<RootRedirector authSession={authSession} />} />
          <Route path="*" element={<Navigate to={authSession ? "/dashboard" : "/"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function RootRedirector({ authSession }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionParam = urlParams.get('session');

    if (sessionParam) {
      navigate(`/contact/${sessionParam}${location.search}`, { replace: true });
    } else if (authSession) {
      navigate('/dashboard', { replace: true });
    }
    
  }, [authSession, location.search, navigate]);
  
  return null;
}


function ContactFormWrapper() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  const handleBackToHome = () => {
    navigate('/');
  };

  return <ContactForm sessionId={sessionId} onBackToHome={handleBackToHome} />;
}

function SessionLoaderAndDashboard({ onBack }) {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { authSession } = supabase.auth;


  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      const { data: userSession } = await supabase.auth.getSession();
      
      if (!userSession?.session?.user) {
        setError("User not authenticated.");
        setIsLoading(false);
        navigate('/auth', {replace: true});
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userSession.session.user.id) 
        .single();

      if (fetchError) {
        console.error("Error fetching session for dashboard:", fetchError);
        setError("Could not load session data or you don't have access.");
      } else if (!data) {
        setError("Session not found or access denied.");
      } else {
        setSessionData(data);
      }
      setIsLoading(false);
    };

    if (sessionId) {
      fetchSession();
    } else {
      setError("No session ID provided.");
      setIsLoading(false);
    }
  }, [sessionId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-400">
        <p>{error}</p>
        <Button onClick={() => navigate('/dashboard', {replace: true})} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }
  
  if (!sessionData) {
     navigate('/dashboard', {replace: true});
     return null;
  }

  return <SessionDashboard session={sessionData} onBack={onBack} />;
}

const useParams = () => {
  const match = useLocation().pathname.match(/\/session\/([^/]+)\/dashboard|\/contact\/([^/]+)/);
  return { sessionId: match ? (match[1] || match[2]) : null };
};


export default App;
