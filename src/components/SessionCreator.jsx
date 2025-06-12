import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Share2, Sparkles, Tag, Link as LinkIcon, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SessionCreator = ({ onSessionCreated }) => {
  const [sessionName, setSessionName] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('minutes');
  const [contactNamePrefix, setContactNamePrefix] = useState('');
  const [whatsAppLink, setWhatsAppLink] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = () => {
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
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    const sessionData = {
      id: sessionId,
      name: sessionName,
      duration: durationMs,
      createdAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      contactNamePrefix: contactNamePrefix.trim(),
      whatsAppLink: whatsAppLink.trim(),
      sessionPassword: sessionPassword.trim(),
      contacts: []
    };

    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));

    setTimeout(() => {
      setIsCreating(false);
      onSessionCreated(sessionData);
      toast({
        title: "Session Created! 🎉",
        description: "Your contact collection session is ready to share!"
      });
    }, 1500);
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