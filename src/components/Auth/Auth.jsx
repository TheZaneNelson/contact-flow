import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Mail, Key, LogIn, UserPlus, CheckCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMagicLinkSent(false);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({ title: 'Sign Up Error', description: error.message, variant: 'destructive' });
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast({ title: 'Confirmation Email Sent!', description: 'Please check your email to verify your account. The user will be created once you verify your email.', variant: 'default' });
      setMagicLinkSent(true);
    } else if (data.session) {
       toast({ title: 'Sign Up Successful!', description: 'Welcome! Your account is created and you are logged in.' });
       navigate('/dashboard');
    } else {
       toast({ title: 'Confirmation Email Sent!', description: 'Please check your email to verify your account.' });
       setMagicLinkSent(true);
    }
    setLoading(false);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMagicLinkSent(false);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
         toast({ title: 'Email Not Confirmed', description: 'Please check your email to confirm your account before signing in.', variant: 'destructive' });
         
         const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
         });
         if (!resendError) {
            toast({ title: 'Verification Email Resent', description: 'A new verification email has been sent. Please check your inbox.' });
         }

      } else {
        toast({ title: 'Sign In Error', description: error.message, variant: 'destructive' });
      }
    } else if (data.session) {
      toast({ title: 'Sign In Successful!', description: 'Welcome back!' });
      navigate('/dashboard');
    } else {
       const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (magicLinkError) {
        toast({ title: 'Sign In Error', description: magicLinkError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Magic Link Sent!', description: 'Check your email for a magic link to sign in.' });
        setMagicLinkSent(true);
      }
    }
    setLoading(false);
  };
  
  const toggleAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setEmail('');
    setPassword('');
    setName('');
    setMagicLinkSent(false);
  };

  if (magicLinkSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-md glass-effect neon-glow border-purple-500/30">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Check Your Email!
            </CardTitle>
            <CardDescription className="text-gray-300">
              We've sent a magic link to <span className="font-semibold text-purple-300">{email}</span>. Click the link in the email to complete your {authMode === 'signup' ? 'sign up' : 'sign in'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button variant="link" onClick={() => setMagicLinkSent(false)} className="text-purple-300 hover:text-purple-100 w-full">
                Back to {authMode === 'signup' ? 'Sign Up' : 'Sign In'}
              </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md glass-effect neon-glow border-purple-500/30">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center"
          >
            {authMode === 'signin' ? <LogIn className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </motion.div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {authMode === 'signin' ? 'Welcome Back!' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {authMode === 'signin' ? 'Sign in to manage your Contact Flows.' : 'Join Contact Flow to start collecting contacts.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-6">
            {authMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-purple-300 font-medium flex items-center">
                  <User className="w-4 h-4 mr-2 text-purple-400" /> Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-300 font-medium flex items-center">
                <Mail className="w-4 h-4 mr-2 text-purple-400" /> Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-300 font-medium flex items-center">
                <Key className="w-4 h-4 mr-2 text-purple-400" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  authMode === 'signin' ? 'Sign In' : 'Sign Up'
                )}
              </Button>
            </motion.div>
          </form>
          <div className="mt-6 text-center">
            <Button variant="link" onClick={toggleAuthMode} className="text-purple-300 hover:text-purple-100">
              {authMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Auth;