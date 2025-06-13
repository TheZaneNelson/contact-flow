import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SessionCreator from '@/components/SessionCreator';
import SessionDashboard from '@/components/SessionDashboard';
import ContactForm from '@/components/ContactForm';
import GlobalContactsManager from '@/components/GlobalContactsManager';
import AuthForm from '@/components/AuthForm';
import { Toaster } from '@/components/ui/toaster';
import { Users, Settings, LogOut, UserCircle } from 'lucide-react';
import 'react-phone-number-input/style.css'
import { supabase } from '@/lib/supabaseClient'; 
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

function App() {
  const [currentView, setCurrentView] = useState('creator');
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionIdFromUrl, setSessionIdFromUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (!session?.user) {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session');
        if (!sessionParam) { 
          setShowAuthForm(true);
        }
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user && showAuthForm) {
          setShowAuthForm(false);
        }
        if (!session?.user && currentView !== 'contact-form') {
           setShowAuthForm(true);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [showAuthForm, currentView]);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    
    if (sessionParam) {
      setSessionIdFromUrl(sessionParam);
      setCurrentView('contact-form');
      setShowAuthForm(false); 
    } else if (user) {
      setCurrentSession(null); 
      setCurrentView('creator');
    } else {
      setShowAuthForm(true);
    }
  }, [user]);

  const handleSessionCreated = (session) => {
    setCurrentSession(session);
    setCurrentView('dashboard');
  };

  const handleBackToCreator = () => {
    setCurrentSession(null);
    setCurrentView('creator');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleManageGlobalContacts = () => {
    setCurrentView('global-contacts');
  };
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Logout Error", description: error.message, variant: "destructive" });
    } else {
      setUser(null);
      setCurrentView('creator'); 
      setShowAuthForm(true);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    }
  };


  const renderView = () => {
    if (showAuthForm && currentView !== 'contact-form') {
      return <AuthForm onAuthSuccess={() => { setShowAuthForm(false); setCurrentView('creator'); }} />;
    }

    switch (currentView) {
      case 'dashboard':
        if (!currentSession) { 
          handleBackToCreator(); 
          return null;
        }
        return (
          <SessionDashboard 
            session={currentSession} 
            onBack={handleBackToCreator}
            user={user}
          />
        );
      case 'contact-form':
        if (!sessionIdFromUrl) { 
          setCurrentView('creator'); 
          window.history.pushState({}, '', window.location.pathname);
          if (!user) setShowAuthForm(true);
          return null;
        }
        return <ContactForm sessionId={sessionIdFromUrl} />;
      case 'global-contacts':
        return <GlobalContactsManager onBack={handleBackToCreator} />;
      default: 
        if (!user) {
          return <AuthForm onAuthSuccess={() => { setShowAuthForm(false); setCurrentView('creator'); }} />;
        }
        return <SessionCreator onSessionCreated={handleSessionCreated} user={user} onManageGlobalContacts={handleManageGlobalContacts} />;
    }
  };

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      {user && currentView !== 'contact-form' && !showAuthForm && (
        <div className="absolute top-4 right-4 flex items-center space-x-2">
           <span className="text-sm text-gray-300 hidden md:inline">{user.email}</span>
           <UserCircle className="w-6 h-6 text-purple-400 md:hidden" />
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-purple-400/30 text-purple-300 hover:bg-purple-500/20">
            <LogOut className="w-4 h-4 mr-0 md:mr-2" /> <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      )}

      {(currentView === 'creator' && !showAuthForm) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 pt-10"
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
            className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Create time-limited, secure sessions for collecting contacts. Share a link, gather information, 
            and automatically download VCF or CSV files. Powered by Supabase.
          </motion.p>
        </motion.div>
      )}

      <main className="container mx-auto">
        {renderView()}
      </main>

      <Toaster />
    </div>
  );
}

export default App;