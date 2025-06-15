import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Share2, Sparkles, Tag, Link as LinkIcon, Lock, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SessionCreator = ({ onSessionCreated, userId }) => {
  const [sessionName, setSessionName] = useState('');
  const [duration, setDuration] = useState('30');
  const [durationUnit, setDurationUnit] = useState('minutes');
  const [contactNamePrefix, setContactNamePrefix] = useState('');
  const [whatsAppLink, setWhatsAppLink] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const getGlobalContacts = () => {
    try {
      const globalContactsJson = import.meta.env.VITE_GLOBAL_CONTACTS_JSON;
      if (globalContactsJson) {
        return JSON.parse(globalContactsJson);
      }
    } catch (error) {
      console.error("Error parsing VITE_GLOBAL_CONTACTS_JSON:", error);
      toast({
        title: "Global Contacts Error",
        description: "There was an issue loading pre-defined global contacts.",
        variant: "destructive",
      });
    }
    return [];
  };


  const handleCreateSession = async () => {
    if (!sessionName.trim() || !duration) {
      toast({
        title: "Missing Information",
        description: "Session Name and Duration are required.",
        variant: "destructive"
      });
      return;
    }
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "User not identified. Please log in again.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsCreating(true);
    
    const durationValue = parseInt(duration);
    const now = new Date();
    const expiresAtDate = add(now, { [durationUnit]: durationValue });
    const durationMs = expiresAtDate.getTime() - now.getTime();

    const newSessionId = uuidv4();
    
    const sessionDataToSave = {
      id: newSessionId,
      user_id: userId,
      name: sessionName.trim(),
      duration_ms: durationMs,
      created_at: now.toISOString(),
      expires_at: expiresAtDate.toISOString(),
      contact_name_prefix: contactNamePrefix.trim() || null,
      whatsapp_link: whatsAppLink.trim() || null,
      session_password: sessionPassword.trim() || null,
    };
    
    const { data: savedSession, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionDataToSave)
      .select()
      .single();

    if (sessionError) {
      setIsCreating(false);
      console.error("Error creating session:", sessionError);
      toast({
        title: "Error Creating Session",
        description: sessionError.message || "Could not save session to database.",
        variant: "destructive"
      });
      return;
    }
    
    const globalContacts = getGlobalContacts();
    if (globalContacts.length > 0) {
      const contactsToInsert = globalContacts.map(contact => ({
        session_id: savedSession.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email || null,
        company: contact.company || null,
        submitted_at: new Date().toISOString(),
      }));

      const { error: contactsError } = await supabase
        .from('contacts')
        .insert(contactsToInsert);

      if (contactsError) {
        console.error("Error adding global contacts:", contactsError);
        toast({
          title: "Global Contacts Issue",
          description: "Could not add all global contacts to the session.",
          variant: "warning"
        });
      }
    }

    setIsCreating(false);
    onSessionCreated(savedSession);
    toast({
      title: "Session Created! 🎉",
      description: "Your contact collection session is ready and saved!"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-lg mx-auto"
    >
      <Button
        onClick={() => navigate('/dashboard')}
        variant="outline"
        className="mb-6 border-purple-400/30 text-purple-300 hover:bg-purple-500/20 flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>
      <Card className="glass-effect neon-glow border-purple-500/30">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Create New Flow
          </CardTitle>
          <CardDescription className="text-gray-300">
            Configure your contact collection session.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sessionName" className="text-purple-300 font-medium">
              Flow Name *
            </Label>
            <Input
              id="sessionName"
              placeholder="e.g., Event Attendees"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-purple-300 font-medium">
                Duration *
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-purple-300 font-medium">Unit</Label>
              <Select value={durationUnit} onValueChange={setDurationUnit}>
                <SelectTrigger className="bg-white/10 border-purple-400/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-purple-400/30 text-white">
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNamePrefix" className="text-purple-300 font-medium flex items-center">
              <Tag className="w-4 h-4 mr-2 text-purple-400" />
              Contact Name Prefix (Optional)
            </Label>
            <Input
              id="contactNamePrefix"
              placeholder="e.g., Conf24_ "
              value={contactNamePrefix}
              onChange={(e) => setContactNamePrefix(e.target.value)}
              className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsAppLink" className="text-purple-300 font-medium flex items-center">
              <LinkIcon className="w-4 h-4 mr-2 text-purple-400" />
              WhatsApp Group Link (Optional)
            </Label>
            <Input
              id="whatsAppLink"
              type="url"
              placeholder="https://chat.whatsapp.com/yourgroup"
              value={whatsAppLink}
              onChange={(e) => setWhatsAppLink(e.target.value)}
              className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionPassword" className="text-purple-300 font-medium flex items-center">
              <Lock className="w-4 h-4 mr-2 text-purple-400" />
              Session Password (Optional)
            </Label>
            <Input
              id="sessionPassword"
              type="password"
              placeholder="Make it private"
              value={sessionPassword}
              onChange={(e) => setSessionPassword(e.target.value)}
              className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
            />
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleCreateSession}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              {isCreating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Launch Flow
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400 w-full">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Auto-expire</span>
            </div>
            <div className="flex items-center space-x-2">
              <Share2 className="w-4 h-4" />
              <span>Shareable link</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Optional Password</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default SessionCreator;