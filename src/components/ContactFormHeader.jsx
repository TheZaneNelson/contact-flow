import React from 'react';
import { motion } from 'framer-motion';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Clock } from 'lucide-react';

const ContactFormHeader = ({ sessionName, isExpired, timeRemaining }) => {
  return (
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
        {sessionName || "Contact Form"}
      </CardTitle>
      <CardDescription className="text-gray-300">
        Share your contact information. Please include your country code with your phone number.
      </CardDescription>
      
      {!isExpired && (
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
  );
};

export default ContactFormHeader;