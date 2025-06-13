import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, User, Phone, Briefcase, Mail, ArrowLeft, Users2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import PhoneInputWithCountrySelect, { isValidPhoneNumber } from 'react-phone-number-input';

const GlobalContactsManager = ({ onBack }) => {
  const [globalContacts, setGlobalContacts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', company: '' });
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchGlobalContacts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('global_contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load global contacts. " + error.message, variant: "destructive" });
    } else {
      setGlobalContacts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGlobalContacts();
  }, [fetchGlobalContacts]);

  const handleInputChange = (e) => {
    setNewContact({ ...newContact, [e.target.name]: e.target.value });
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newPhoneNumber) {
      toast({ title: "Missing Information", description: "Name and Phone Number are required.", variant: "destructive" });
      return;
    }
    if (!isValidPhoneNumber(newPhoneNumber)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    const { error } = await supabase
      .from('global_contacts')
      .insert([{ 
        name: newContact.name.trim(), 
        phone: newPhoneNumber,
        email: newContact.email.trim() || null,
        company: newContact.company.trim() || null,
      }]);

    setIsAdding(false);
    if (error) {
      if (error.code === '23505') { // unique constraint violation
        toast({ title: "Duplicate Contact", description: "This phone number already exists in global contacts.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to add contact. " + error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Contact Added", description: `${newContact.name} added to global contacts.` });
      setNewContact({ name: '', email: '', company: '' });
      setNewPhoneNumber('');
      fetchGlobalContacts(); 
    }
  };

  const handleDeleteContact = async (id) => {
    const { error } = await supabase
      .from('global_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete contact. " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact Deleted", description: "Contact removed from global list." });
      fetchGlobalContacts();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <Button
        onClick={onBack}
        variant="outline"
        className="border-purple-400/30 text-purple-300 hover:bg-purple-500/20 flex items-center mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Creator
      </Button>

      <Card className="glass-effect neon-glow border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users2 className="w-8 h-8 text-cyan-400 mr-3" />
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Global Contacts
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Manage contacts that are automatically added to every new session.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddContact} className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="globalName" className="text-cyan-300 flex items-center mb-1">
                  <User className="w-4 h-4 mr-2"/> Name *
                </Label>
                <Input
                  id="globalName"
                  name="name"
                  placeholder="Global Contact Name"
                  value={newContact.name}
                  onChange={handleInputChange}
                  className="bg-white/10 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="globalPhone" className="text-cyan-300 flex items-center mb-1">
                  <Phone className="w-4 h-4 mr-2"/> Phone Number *
                </Label>
                 <PhoneInputWithCountrySelect
                    id="globalPhone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={newPhoneNumber}
                    onChange={setNewPhoneNumber}
                    defaultCountry="US"
                    className="PhoneInputInput bg-white/10 border border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400 rounded-md p-2 w-full"
                    inputClassName="bg-transparent outline-none w-full text-white"
                     countrySelectProps={{ className: "PhoneInputCountrySelect" }}
                  />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="globalEmail" className="text-cyan-300 flex items-center mb-1">
                  <Mail className="w-4 h-4 mr-2"/> Email (Optional)
                </Label>
                <Input
                  id="globalEmail"
                  name="email"
                  type="email"
                  placeholder="global.contact@example.com"
                  value={newContact.email}
                  onChange={handleInputChange}
                  className="bg-white/10 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="globalCompany" className="text-cyan-300 flex items-center mb-1">
                  <Briefcase className="w-4 h-4 mr-2"/> Company (Optional)
                </Label>
                <Input
                  id="globalCompany"
                  name="company"
                  placeholder="Global Corp"
                  value={newContact.company}
                  onChange={handleInputChange}
                  className="bg-white/10 border-cyan-400/30 text-white placeholder:text-gray-400 focus:border-cyan-400"
                />
              </div>
            </div>
            <Button type="submit" disabled={isAdding} className="w-full gradient-bg hover:opacity-90 text-white font-semibold">
              <PlusCircle className="w-5 h-5 mr-2" />
              {isAdding ? 'Adding...' : 'Add Global Contact'}
            </Button>
          </form>

          {isLoading ? (
             <p className="text-center text-gray-400 py-4">Loading global contacts...</p>
          ) : globalContacts.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No global contacts yet. Add one above!</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {globalContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <p className="font-semibold text-white">{contact.name}</p>
                    <p className="text-sm text-cyan-300">{contact.phone}</p>
                    {contact.email && <p className="text-xs text-gray-400">{contact.email}</p>}
                    {contact.company && <p className="text-xs text-gray-400">{contact.company}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GlobalContactsManager;