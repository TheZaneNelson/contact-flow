import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

const ContactFormInvalidSession = ({ onBackToHome }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-effect border-red-500/30 max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-red-400">Session Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-300">Invalid session ID or session not found.</p>
          <Button onClick={onBackToHome || (() => window.location.href = '/')} className="mt-4 gradient-bg text-white">
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactFormInvalidSession;