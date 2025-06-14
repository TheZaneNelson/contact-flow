import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Share2, Sparkles, Tag, Link as LinkIcon, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const SessionCreator = ({ onSessionCreated, user }) => {
  const [sessionName, setSessionName] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('minutes');
  const [contactNamePrefix, setContactNamePrefix] = useState('');
  const [whatsAppLink, setWhatsAppLink] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a session.",
        variant: "destructive"
      });
      return;
    }

    if (!sessionName.trim() || !duration) {
      toast({
        title: "Missing Information",
        description: "Session Name and Duration are required.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    const durationMs = parseInt(duration) * (durationUnit === 'minutes' ? 60000 : 3600000);
    const sessionId = uuidv4();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    
    let globalContactsToAdd = [];
    const { data: fetchedGlobalContacts, error: fetchGlobalError } = await supabase
      .from('global_contacts')
      .select('*');

    if (fetchGlobalError) {
      console.warn("Could not fetch global contacts:", fetchGlobalError.message);
      toast({ title: "Global Contacts Warning", description: "Could not fetch global contacts to add to session.", variant: "default" });
    } else {
      globalContactsToAdd = fetchedGlobalContacts || [];
    }


    const sessionData = {
      id: sessionId,
      name: sessionName,
      duration_ms: durationMs,
      created_at: createdAt,
      expires_at: expiresAt,
      contact_name_prefix: contactNamePrefix.trim() || null,
      whatsapp_link: whatsAppLink.trim() || null,
      session_password: sessionPassword.trim() || null,
      user_id: user.id
    };

    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single();

    if (sessionError) {
      setIsCreating(false);
      toast({
        title: "Session Creation Failed",
        description: sessionError.message,
        variant: "destructive"
      });
      return;
    }
    
    if (globalContactsToAdd.length > 0) {
        const contactsToInsert = globalContactsToAdd.map(gc => ({
            session_id: newSession.id,
            name: gc.name,
            phone: gc.phone,
            email: gc.email || null,
            company: gc.company || null,
            submitted_at: new Date().toISOString()
        }));

        const { error: contactsError } = await supabase
            .from('contacts')
            .insert(contactsToInsert);

        if (contactsError) {
            console.warn("Error adding global contacts to session:", contactsError.message);
            toast({ title: "Global Contacts Warning", description: "Could not add all global contacts to this session.", variant: "default" });
        }
    }


    setIsCreating(false);
    onSessionCreated(newSession);
    toast({
      title: "Session Created! 🎉",
      description: "Your contact collection session is ready to share!"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-lg mx-auto"
    >
      <Card className="glass-effect neon-glow border-purple-500/30">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mt-4 mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center"
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
            whileHover={{ scale: user ? 1.02 : 1 }}
            whileTap={{ scale: user ? 0.98 : 1 }}
          >
            <Button
              onClick={handleCreateSession}
              disabled={isCreating || !user}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
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
                  {user ? 'Launch Flow' : 'Login to Launch Flow'}
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