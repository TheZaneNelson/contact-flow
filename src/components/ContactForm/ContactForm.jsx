import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Clock, CheckCircle, Lock, ExternalLink, XCircle, MessageSquare, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { parseISO, isPast, formatDistanceToNowStrict } from 'date-fns';
import ContactFormFields from './ContactFormFields';
import ContactFormPassword from './ContactFormPassword';
import ContactFormHeader from './ContactFormHeader';
import ContactFormSuccess from './ContactFormSuccess';
import ContactFormInvalidSession from './ContactFormInvalidSession';

const ContactForm = ({ sessionId, onBackToHome }) => {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const fetchSessionDetails = useCallback(async () => {
    if (!sessionId) {
      setIsLoadingSession(false);
      setSession(null);
      return;
    }
    setIsLoadingSession(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      console.error('Error fetching session or session not found:', error);
      setSession(null);
      toast({
        title: "Session Not Found",
        description: "The requested session does not exist or is invalid.",
        variant: "destructive",
      });
    } else {
      setSession(data);
      if (data.session_password && data.session_password.length > 0) {
        setPasswordRequired(true);
      } else {
        setIsAuthenticated(true);
      }
    }
    setIsLoadingSession(false);
  }, [sessionId]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const calculateTimeRemaining = useCallback(() => {
    if (!session?.expires_at) return;
    const expiresAtDate = parseISO(session.expires_at);
    if (isPast(expiresAtDate)) {
      setIsExpired(true);
      setTimeRemaining('Expired');
      return;
    }
    setIsExpired(false);
    setTimeRemaining(formatDistanceToNowStrict(expiresAtDate, { addSuffix: true }));
  }, [session?.expires_at]);

  useEffect(() => {
    if (!session || isLoadingSession) return;
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [session, isLoadingSession, calculateTimeRemaining]);


  const handlePasswordAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleContactSubmit = async (formData, phoneNumber) => {
    setIsSubmitting(true);
    
    const finalName = session.contact_name_prefix 
      ? `${session.contact_name_prefix}${formData.name}`
      : formData.name;

    const contactToSave = {
      session_id: session.id,
      name: finalName,
      phone: phoneNumber,
      email: formData.email || null,
      company: formData.company || null,
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('contacts').insert(contactToSave);

    if (error) {
      setIsSubmitting(false);
      console.error("Error saving contact:", error);
      if (error.code === '23505') { // Unique constraint violation
         toast({
          title: "Contact Exists",
          description: "This phone number has already been submitted for this session.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error Saving Contact",
          description: error.message || "Could not save contact to database.",
          variant: "destructive"
        });
      }
      return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "Contact Added! 🎉",
      description: "Your contact information has been successfully submitted."
    });
  };
  
  if (isLoadingSession) {
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
  
  if (!session && !isLoadingSession) {
    return <ContactFormInvalidSession onBackToHome={onBackToHome}/>;
  }

  if (isSubmitted) {
    return <ContactFormSuccess sessionName={session?.name} onAddAnother={() => setIsSubmitted(false)} />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <Card className="glass-effect neon-glow border-purple-500/30">
          <ContactFormHeader 
            sessionName={session?.name} 
            isExpired={isExpired} 
            timeRemaining={timeRemaining}
          />
          
          <CardContent>
            {session?.whatsapp_link && (
              <motion.a
                href={session.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-6 p-3 text-center rounded-lg gradient-bg text-white font-semibold neon-glow pulse-animation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageSquare className="inline-block w-5 h-5 mr-2" />
                Join our WhatsApp Group!
                <ExternalLink className="inline-block w-4 h-4 ml-2 opacity-70" />
              </motion.a>
            )}

            {passwordRequired && !isAuthenticated ? (
              <ContactFormPassword 
                sessionPassword={session.session_password} 
                onAuthenticated={handlePasswordAuthenticated} 
              />
            ) : (
              <ContactFormFields 
                onSubmit={handleContactSubmit}
                isExpired={isExpired}
                isSubmitting={isSubmitting}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ContactForm;