import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, ListChecks, Clock, Users, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';

const UserDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const navigate = useNavigate();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'Please log in to view your sessions.', variant: 'destructive' });
      setLoading(false);
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching sessions', description: error.message, variant: 'destructive' });
    } else {
      const sortedSessions = data.sort((a, b) => {
        const aExpired = isPast(parseISO(a.expires_at));
        const bExpired = isPast(parseISO(b.expires_at));
        if (aExpired === bExpired) {
          return parseISO(b.created_at) - parseISO(a.created_at);
        }
        return aExpired ? 1 : -1;
      });
      setSessions(sortedSessions);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleViewSession = (sessionId) => {
    navigate(`/session/${sessionId}/dashboard`);
  };

  const handleDeleteSession = async (sessionId) => {
  setDeletingSessionId(sessionId);
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id); // Ensure only the user's session is deleted
    if (error) {
      throw error;
    }

    toast({
      title: 'Session Deleted',
      description: 'The session and its contacts have been successfully deleted.',
    });
    setSessions((prevSessions) => prevSessions.filter((s) => s.id !== sessionId));
  } catch (error) {
    console.error('Error deleting session:', error);
    toast({
      title: 'Error Deleting Session',
      description: error.message || 'Failed to delete session.',
      variant: 'destructive',
    });
  } finally {
    setDeletingSessionId(null);
  }
};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
          My Contact Flows
        </motion.h1>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button 
            onClick={() => navigate('/create-session')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Flow
          </Button>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      ) : sessions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <ListChecks className="w-24 h-24 mx-auto text-purple-400/50 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Contact Flows Yet!</h2>
          <p className="text-gray-400 mb-6">Click "Create New Flow" to get started.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session, index) => {
            const isSessionExpired = isPast(parseISO(session.expires_at));
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`glass-effect neon-glow flex flex-col justify-between h-full ${isSessionExpired ? 'border-gray-600/30 opacity-70' : 'border-purple-500/30'}`}>
                  <div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className={`text-xl font-semibold ${isSessionExpired ? 'text-gray-400' : 'text-purple-300'}`}>{session.name}</CardTitle>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          isSessionExpired 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {isSessionExpired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <CardDescription className="text-xs text-gray-500">
                        Created: {format(parseISO(session.created_at), 'MMM d, yyyy HH:mm')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-2 text-blue-400" />
                        Expires: {format(parseISO(session.expires_at), 'MMM d, yyyy HH:mm')}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="w-4 h-4 mr-2 text-green-400" />
                        Contacts: N/A (View details)
                      </div>
                    </CardContent>
                  </div>
                  <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                     <Button 
                        onClick={() => handleViewSession(session.id)} 
                        variant="outline"
                        className={`w-full ${isSessionExpired ? 'border-gray-500/30 text-gray-400 hover:bg-gray-500/20' : 'border-purple-400/30 text-purple-300 hover:bg-purple-500/20'}`}
                      >
                       <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive"
                            className="w-full bg-red-700/20 hover:bg-red-700/30 text-red-300 border border-red-600/30"
                            disabled={deletingSessionId === session.id}
                          >
                            {deletingSessionId === session.id ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                              />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-effect border-red-500/50">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-300">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              This action cannot be undone. This will permanently delete the session "{session.name}" and all its associated contacts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-gray-300 border-gray-500/50 hover:bg-gray-500/20">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSession(session.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Yes, delete session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
      <div className="mt-8 flex justify-end">
        <Button variant="ghost" onClick={fetchSessions} disabled={loading} className="text-purple-300 hover:text-purple-100">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh List
        </Button>
      </div>
    </motion.div>
  );
};

export default UserDashboard;