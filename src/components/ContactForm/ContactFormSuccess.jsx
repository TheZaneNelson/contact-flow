import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const ContactFormSuccess = ({ sessionName, onAddAnother }) => {
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
            <p className="text-gray-300">Your contact has been added to {sessionName || "the session"}.</p>
            <Button onClick={onAddAnother} className="mt-6 gradient-bg text-white">
              Add Another Contact
            </Button>
            <Button 
                variant="outline" 
                className="text-green-400 border-green-400 hover:bg-green-400/10"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ContactFormSuccess;
