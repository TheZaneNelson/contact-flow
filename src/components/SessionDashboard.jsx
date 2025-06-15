import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Users, Clock, Share2, FileText, Database, Tag, Link as LinkIcon, Lock, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNowStrict, parseISO, isPast } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const SessionDashboard = ({ session, onBack }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [contacts, setContacts] = useState([]);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const navigate = useNavigate();

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
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  const fetchContacts = useCallback(async () => {
    if (!session?.id) return;
    setIsLoadingContacts(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('session_id', session.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error Loading Contacts",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setContacts(data || []);
    }
    setIsLoadingContacts(false);
  }, [session?.id]);

  useEffect(() => {
    if (session?.id) {
      fetchContacts();
    } else {
       toast({ title: "Session Error", description: "Session data is not available.", variant: "destructive" });
       if (onBack) onBack(); else navigate('/dashboard');
    }
  }, [fetchContacts, session, onBack, navigate]);

  const copySessionLink = () => {
    if (!session?.id) {
      toast({ title: "Error", description: "Session ID not found.", variant: "destructive" });
      return;
    }
    const link = `${window.location.origin}/contact/${session.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied! 📋",
      description: "Session link has been copied to clipboard"
    });
  };

  const downloadVCF = () => {
    if (contacts.length === 0) {
      toast({
        title: "No Contacts",
        description: "No contacts available to download",
        variant: "destructive"
      });
      return;
    }

    let vcfContent = '';
    contacts.forEach(contact => {
      vcfContent += 'BEGIN:VCARD\n';
      vcfContent += 'VERSION:3.0\n';
      vcfContent += `FN:${contact.name}\n`;
      vcfContent += `TEL:${contact.phone}\n`;
      if (contact.email) vcfContent += `EMAIL:${contact.email}\n`;
      if (contact.company) vcfContent += `ORG:${contact.company}\n`;
      vcfContent += 'END:VCARD\n\n';
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name}_contacts.vcf`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "VCF Downloaded! 📱",
      description: "Contact file has been downloaded"
    });
  };

  const downloadCSV = () => {
    if (contacts.length === 0) {
      toast({
        title: "No Contacts",
        description: "No contacts available to download",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Company', 'Submitted At'];
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        contact.name,
        contact.phone,
        contact.email || '',
        contact.company || '',
        contact.submitted_at ? parseISO(contact.submitted_at).toLocaleString() : ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name}_contacts.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Downloaded! 📊",
      description: "Contact spreadsheet has been downloaded"
    });
  };
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Session data not available. Redirecting...</p>
      </div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-purple-400/30 text-purple-300 hover:bg-purple-500/20 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Flows
        </Button>
        
        <motion.div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            isExpired 
              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
              : 'bg-green-500/20 text-green-300 border border-green-500/30'
          }`}
          animate={{ scale: isExpired ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isExpired ? Infinity : 0 }}
        >
          {isExpired ? 'Session Expired' : 'Active Session'}
        </motion.div>
      </div>

      <Card className="glass-effect neon-glow border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {session.name}
          </CardTitle>
          <CardDescription className="text-gray-300">
            Manage your contact collection flow. Session ID: {session.id}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mx-auto mb-2">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400">Time Remaining</p>
              <p className={`text-lg font-semibold ${isExpired ? 'text-red-400' : 'text-blue-400'}`}>
                {timeRemaining}
              </p>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mx-auto mb-2">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">Contacts Collected</p>
              <p className="text-lg font-semibold text-green-400">{contacts.length}</p>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-full mx-auto mb-2">
                <Share2 className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">Session Link</p>
              <Button
                onClick={copySessionLink}
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Link
              </Button>
            </div>
          </div>
          
          {(session.contact_name_prefix || session.whatsapp_link || session.session_password) && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-md font-semibold text-purple-300 mb-3">Session Settings:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                {session.contact_name_prefix && (
                  <li className="flex items-center"><Tag className="w-4 h-4 mr-2 text-purple-400" />Name Prefix: <span className="ml-1 font-mono bg-white/10 px-1 rounded">{session.contact_name_prefix}</span></li>
                )}
                {session.whatsapp_link && (
                  <li className="flex items-center"><LinkIcon className="w-4 h-4 mr-2 text-purple-400" />WhatsApp Link: <a href={session.whatsapp_link} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-400 hover:underline truncate max-w-xs inline-block">{session.whatsapp_link}</a></li>
                )}
                {session.session_password && (
                  <li className="flex items-center"><Lock className="w-4 h-4 mr-2 text-purple-400" />Password Protected: <span className="ml-1 font-bold text-green-400">Yes</span></li>
                )}
              </ul>
            </div>
          )}

        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-effect border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-purple-300">Download Options</CardTitle>
            <CardDescription className="text-gray-400">Export collected contacts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={downloadVCF}
              disabled={contacts.length === 0}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 disabled:opacity-60"
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download VCF
            </Button>
            <Button
              onClick={downloadCSV}
              disabled={contacts.length === 0}
              className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 disabled:opacity-60"
              variant="outline"
            >
              <Database className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <p className="text-xs text-gray-500 text-center">Downloads available if contacts are present.</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-purple-300">Recent Contacts</CardTitle>
              <CardDescription className="text-gray-400">A quick view of the latest submissions.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchContacts} disabled={isLoadingContacts} className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10">
              <RefreshCw className={`w-4 h-4 ${isLoadingContacts ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingContacts && contacts.length === 0 ? (
               <div className="flex justify-center items-center h-32">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
                />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No contacts submitted yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {contacts.slice(0,5).map((contact, index) => (
                  <motion.div
                    key={contact.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-white/5 rounded-md border border-white/10"
                  >
                    <p className="font-medium text-white">{contact.name}</p>
                    <p className="text-sm text-gray-400">{contact.email || 'No email'}</p>
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default SessionDashboard;