import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Clock, CheckCircle, Lock, ExternalLink, XCircle, MessageSquare, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import PhoneInputWithCountrySelect, { isValidPhoneNumber } from 'react-phone-number-input';
import { supabase } from '@/lib/supabaseClient';
import ContactFormFields from '@/components/ContactFormFields';
import ContactFormPassword from '@/components/ContactFormPassword';
import ContactFormSuccess from '@/components/ContactFormSuccess';
import ContactFormHeader from '@/components/ContactFormHeader';

const ContactForm = ({ sessionId }) => {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  });

  const fetchSessionData = useCallback(async () => {
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
      toast({ title: "Session Error", description: "Invalid session ID or session not found.", variant: "destructive" });
      setSession(null);
    } else {
      setSession(data);
      if (new Date(data.expires_at).getTime() < Date.now()) {
        setIsExpired(true);
      }
      if (data.session_password && data.session_password.length > 0) {
        setPasswordRequired(true);
      } else {
        setIsAuthenticated(true);
      }
    }
    setIsLoadingSession(false);
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    if (!session || isExpired || isLoadingSession) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiresAtTime = new Date(session.expires_at).getTime();
      const remaining = expiresAtTime - now;
      
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session, isExpired, isLoadingSession]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (session && enteredPassword === session.session_password) {
      setIsAuthenticated(true);
      toast({ title: "Access Granted!", description: "You can now submit your contact." });
    } else {
      toast({ title: "Incorrect Password", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !phoneNumber) {
      toast({ title: "Missing Information", description: "Name and Phone Number are required.", variant: "destructive" });
      return;
    }
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number with country code.", variant: "destructive" });
      return;
    }
    if (isExpired) {
      toast({ title: "Session Expired", description: "This contact collection session has ended.", variant: "destructive" });
      return;
    }
    if (passwordRequired && !isAuthenticated) {
      toast({ title: "Password Required", description: "Please enter the session password first.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('phone')
      .eq('session_id', sessionId)
      .eq('phone', phoneNumber);

    if (fetchError) {
      setIsSubmitting(false);
      toast({ title: "Submission Error", description: "Could not verify contact. Please try again.", variant: "destructive" });
      return;
    }

    if (existingContacts && existingContacts.length > 0) {
      setIsSubmitting(false);
      toast({ title: "Contact Exists", description: "This phone number has already been submitted for this session.", variant: "destructive" });
      return;
    }

    const finalName = session.contact_name_prefix ? `${session.contact_name_prefix}${formData.name}` : formData.name;
    const contactData = {
      session_id: sessionId,
      name: finalName,
      phone: phoneNumber,
      email: formData.email || null,
      company: formData.company || null,
      submitted_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase.from('contacts').insert([contactData]);

    if (insertError) {
      setIsSubmitting(false);
      toast({ title: "Submission Failed", description: insertError.message, variant: "destructive" });
      return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', company: '' });
    setPhoneNumber('');
    toast({ title: "Contact Added! 🎉", description: "Your contact information has been successfully submitted." });
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!session && !isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass-effect border-red-500/30 max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-red-400">Session Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-300">Invalid session ID or session not found.</p>
            <Button onClick={() => window.location.href = '/'} className="mt-4 gradient-bg text-white">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
                enteredPassword={enteredPassword}
                onPasswordChange={(e) => setEnteredPassword(e.target.value)}
                onPasswordSubmit={handlePasswordSubmit}
              />
            ) : (
              <ContactFormFields
                formData={formData}
                phoneNumber={phoneNumber}
                onInputChange={handleInputChange}
                onPhoneNumberChange={setPhoneNumber}
                onSubmit={handleSubmit}
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