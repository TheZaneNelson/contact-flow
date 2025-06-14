import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Phone } from 'lucide-react';
import PhoneInputWithCountrySelect, { isValidPhoneNumber } from 'react-phone-number-input';
import { toast } from '@/components/ui/use-toast';

const ContactFormFields = ({ onSubmit, isExpired, isSubmitting }) => {
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Name and Phone Number are required.",
        variant: "destructive"
      });
      return;
    }
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code.",
        variant: "destructive"
      });
      return;
    }
    if (isExpired) {
      toast({
        title: "Session Expired",
        description: "This contact collection session has ended.",
        variant: "destructive"
      });
      return;
    }
    onSubmit(formData, phoneNumber).then(() => {
      setFormData({ name: '', email: '', company: '' });
      setPhoneNumber('');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-purple-300 font-medium">Full Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleInputChange}
          disabled={isExpired || isSubmitting}
          className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-purple-300 font-medium flex items-center">
          <Phone className="w-4 h-4 mr-2 text-purple-400" /> Phone Number *
        </Label>
        <PhoneInputWithCountrySelect
          id="phone"
          name="phone"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          disabled={isExpired || isSubmitting}
          defaultCountry="US"
          className="PhoneInputInput bg-white/10 border border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400 rounded-md p-2 w-full"
          inputClassName="bg-transparent outline-none w-full text-white"
          countrySelectProps={{ className: "PhoneInputCountrySelect" }}
        />
        <p className="text-xs text-gray-400 mt-1">Please select your country and enter your number.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-purple-300 font-medium">Email Address (Optional)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={handleInputChange}
          disabled={isExpired || isSubmitting}
          className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company" className="text-purple-300 font-medium">Company (Optional)</Label>
        <Input
          id="company"
          name="company"
          placeholder="Acme Corp"
          value={formData.company}
          onChange={handleInputChange}
          disabled={isExpired || isSubmitting}
          className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 focus:border-purple-400"
        />
      </div>
      <motion.div
        whileHover={{ scale: (isExpired || isSubmitting) ? 1 : 1.02 }}
        whileTap={{ scale: (isExpired || isSubmitting) ? 1 : 0.98 }}
      >
        <Button
          type="submit"
          disabled={isSubmitting || isExpired}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              {isExpired ? 'Session Expired' : 'Add My Contact'}
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
};

export default ContactFormFields;