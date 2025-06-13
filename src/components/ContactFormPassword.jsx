import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

const ContactFormPassword = ({ enteredPassword, onPasswordChange, onPasswordSubmit }) => {
  return (
    <form onSubmit={onPasswordSubmit} className="space-y-4">
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
          onChange={onPasswordChange}
          className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-lg"
      >
        Unlock Session
      </Button>
    </form>
  );
};

export default ContactFormPassword;