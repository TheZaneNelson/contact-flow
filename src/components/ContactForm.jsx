import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Clock, CheckCircle, Lock, ExternalLink, XCircle, MessageSquare, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import PhoneInputWithCountrySelect, { isValidPhoneNumber } from 'react-phone-number-input';

const ContactForm = ({ sessionId }) => {
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

  useEffect(() => {
    const sessionData = localStorage.getItem(`session_${sessionId}`);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setSession(parsed);
      
      if (Date.now() > parsed.expiresAt) {
        setIsExpired(true);
      }
      if (parsed.sessionPassword && parsed.sessionPassword.length > 0) {
        setPasswordRequired(true);
      } else {
        setIsAuthenticated(true); 
      }
    } else {
      setSession(null);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!session || isExpired) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = session.expiresAt - now;
      
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
  }, [session, isExpired]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (session && enteredPassword === session.sessionPassword) {
      setIsAuthenticated(true);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Name and Phone Number are required.",
        variant: "destructive"
      });
      return;
    }

    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
        toast({
            title: "Invalid Phone Number",
            description: "Please enter a valid phone number with country code.",
            variant: "destructive"
        });
        return;
    }

    if (isExpired) {
      toast({
        title: "Session Expired",
        description: "This contact collection session has ended.",
        variant: "destructive"
      });
      return;
    }

    if (passwordRequired && !isAuthenticated) {
      toast({
        title: "Password Required",
        description: "Please enter the session password first.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const sessionData = localStorage.getItem(`session_${sessionId}`);
    if (sessionData) {
      const parsedSession = JSON.parse(sessionData);
      const existingContacts = parsedSession.contacts || [];
      
      const normalizedPhoneNumber = phoneNumber;
      const isDuplicate = existingContacts.some(contact => contact.phone === normalizedPhoneNumber);

      if (isDuplicate) {
        setIsSubmitting(false);
        toast({
          title: "Contact Exists",
          description: "This phone number has already been submitted.",
          variant: "destructive"
        });
        return;
      }

      const finalName = session.contactNamePrefix 
        ? `${session.contactNamePrefix}${formData.name}`
        : formData.name;

      parsedSession.contacts.push({
        ...formData,
        name: finalName,
        phone: normalizedPhoneNumber,
        submittedAt: Date.now()
      });
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(parsedSession));
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', company: '' });
      setPhoneNumber('');
      toast({
        title: "Contact Added! 🎉",
        description: "Your contact information has been successfully submitted."
      });
    }, 1500);
  };

  if (!session && sessionId) {
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
  
  if (!session && !sessionId) {
     return null;
  }


  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Card className="glass-effect neon-glow border-green-500/30 max-w-md w-full">
            <CardContent className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Success!</h2>
              <p className="text-gray-300">Your contact has been added to {session?.name}.</p>
              <Button onClick={() => setIsSubmitted(false)} className="mt-6 gradient-bg text-white">
                Add Another Contact
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
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
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {session?.name || "Contact Form"}
            </CardTitle>
            <CardDescription className="text-gray-300">
              Share your contact information. Please include your country code with your phone number.
            </CardDescription>
            
            {!isExpired && session && (
              <div className="flex items-center justify-center space-x-2 mt-4 p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">
                  Time remaining: {timeRemaining}
                </span>
              </div>
            )}
            
            {isExpired && (
              <div className="mt-4 p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                <span className="text-red-400 text-sm font-medium">
                  This session has expired
                </span>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {session?.whatsAppLink && (
              <motion.a
                href={session.whatsAppLink}
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
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionPasswordEntry" className="text-purple-300 font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-purple-400" />
                    Session Password Required
                  </Label>
                  <Input
                    id="sessionPasswordEntry"
                    name="sessionPasswordEntry"
                    type="password"
                    placeholder="Enter password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-lg"
                >
                  Unlock Session
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-purple-300 font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isExpired || isSubmitting}
                    className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-purple-300 font-medium flex items-center">
                     <Phone className="w-4 h-4 mr-2 text-purple-400" /> Phone Number *
                  </Label>
                  <PhoneInputWithCountrySelect
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    disabled={isExpired || isSubmitting}
                    defaultCountry="US"
                    className="PhoneInputInput bg-white/10 border border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400 rounded-md p-2 w-full"
                    inputClassName="bg-transparent outline-none w-full text-white"
                    countrySelectProps={{
                      className: "PhoneInputCountrySelect"
                    }}
                  />
                   <p className="text-xs text-gray-400 mt-1">Please select your country and enter your number.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-purple-300 font-medium">
                    Email Address (Optional)
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isExpired || isSubmitting}
                    className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                  />
                </div>


                <div className="space-y-2">
                  <Label htmlFor="company" className="text-purple-300 font-medium">
                    Company (Optional)
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={handleInputChange}
                    disabled={isExpired || isSubmitting}
                    className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                  />
                </div>

                <motion.div
                  whileHover={{ scale: (isExpired || isSubmitting) ? 1 : 1.02 }}
                  whileTap={{ scale: (isExpired || isSubmitting) ? 1 : 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting || isExpired}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        {isExpired ? 'Session Expired' : 'Add My Contact'}
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ContactForm;