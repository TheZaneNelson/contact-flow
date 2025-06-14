import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SessionCreator from '@/components/SessionCreator';
import SessionDashboard from '@/components/SessionDashboard';
import ContactForm from '@/components/ContactForm/ContactForm';
import { Toaster } from '@/components/ui/toaster';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import 'react-phone-number-input/style.css'

function App() {
  const [currentView, setCurrentView] = useState('creator');
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionIdFromUrl, setSessionIdFromUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUrlAndLoadSession = async () => {
      setIsLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const sessionParam = urlParams.get('session');
      
      if (sessionParam) {
        setSessionIdFromUrl(sessionParam);
        
        const { data: sessionData, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionParam)
          .single();

        if (error || !sessionData) {
          console.error('Error fetching session from URL or session not found:', error);
          setCurrentView('creator'); 
          window.history.pushState({}, '', window.location.pathname);
        } else {
          setCurrentView('contact-form');
        }
      } else {
        setCurrentSession(null); 
        setCurrentView('creator');
      }
      setIsLoading(false);
    };

    checkUrlAndLoadSession();
  }, []);

  const handleSessionCreated = (session) => {
    setCurrentSession(session);
    setCurrentView('dashboard');
  };

  const handleBackToCreator = () => {
    setCurrentSession(null);
    setCurrentView('creator');
    setSessionIdFromUrl(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const renderView = () => {
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
          />
        );
      case 'contact-form':
        if (!sessionIdFromUrl) { 
          handleBackToCreator();
          return null;
        }
        return <ContactForm sessionId={sessionIdFromUrl} onBackToHome={handleBackToCreator}/>;
      default: 
        return <SessionCreator onSessionCreated={handleSessionCreated} />;
    }
  };

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      {currentView === 'creator' && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
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
            and automatically download VCF or CSV files. All data securely stored and managed.
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