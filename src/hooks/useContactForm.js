import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { isValidPhoneNumber } from 'react-phone-number-input';

const useContactForm = (sessionId) => {
  const [session, setSession] = useState(null);
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
    if (!sessionId) return;
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      console.error("Error fetching session:", error);
      toast({ title: "Error", description: "Session not found or error fetching data.", variant: "destructive" });
      setSession(null);
      return;
    }
    
    setSession(data);
    if (new Date(data.expires_at).getTime() < Date.now()) {
      setIsExpired(true);
    }
    if (data.session_password) {
      setPasswordRequired(true);
      const authCheck = localStorage.getItem(`session_auth_${sessionId}`);
      if (authCheck === data.session_password) {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    if (!session || isExpired) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiryTime = new Date(session.expires_at).getTime();
      const remaining = expiryTime - now;
      
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        localStorage.removeItem(`session_auth_${sessionId}`);
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
  }, [session, isExpired, sessionId]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (session && enteredPassword === session.session_password) {
      setIsAuthenticated(true);
      localStorage.setItem(`session_auth_${sessionId}`, enteredPassword);
      toast({
        title: "Access Granted!",
        description: "You can now submit your contact.",
      });
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again.",
        variant: "destructive"
      });
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

    const finalName = session.contact_name_prefix 
      ? `${session.contact_name_prefix}${formData.name}`
      : formData.name;

    const contactData = {
      session_id: sessionId,
      name: finalName,
      phone: phoneNumber,
      email: formData.email.trim() || null,
      company: formData.company.trim() || null,
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('contacts').insert(contactData);

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
         toast({ title: "Contact Exists", description: "This phone number has already been submitted for this session.", variant: "destructive" });
      } else {
        toast({ title: "Submission Error", description: error.message, variant: "destructive" });
      }
      return;
    }
    
    setIsSubmitted(true);
    setFormData({ name: '', email: '', company: '' });
    setPhoneNumber('');
    toast({ title: "Contact Added! 🎉", description: "Your contact information has been successfully submitted." });
  };

  return {
    session,
    isExpired,
    timeRemaining,
    isSubmitting,
    isSubmitted,
    passwordRequired,
    isAuthenticated,
    enteredPassword,
    setEnteredPassword,
    phoneNumber,
    setPhoneNumber,
    formData,
    handleInputChange,
    handlePasswordSubmit,
    handleSubmit,
    setIsSubmitted,
  };
};

export default useContactForm;