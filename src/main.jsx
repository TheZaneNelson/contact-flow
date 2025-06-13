import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { createClient } from '@supabase/supabase-js';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. The app cannot be mounted.");
}

async function setupGlobalContacts() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const globalContactsRaw = import.meta.env.VITE_GLOBAL_CONTACTS_JSON;

  if (!globalContactsRaw || !supabaseUrl || !supabaseServiceRoleKey) {
    if (!globalContactsRaw) console.log("No VITE_GLOBAL_CONTACTS_JSON found, skipping setup.");
    if (!supabaseUrl || !supabaseServiceRoleKey) console.error("Supabase URL or Service Role Key missing for global contacts setup.");
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const globalContactsToEnsure = JSON.parse(globalContactsRaw);
    if (!Array.isArray(globalContactsToEnsure) || globalContactsToEnsure.length === 0) return;

    for (const contact of globalContactsToEnsure) {
      if (!contact.name || !contact.phone) {
        console.warn("Skipping global contact due to missing name or phone:", contact);
        continue;
      }
      
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('global_contacts')
        .select('id')
        .eq('phone', contact.phone)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') { 
        console.error("Error checking existing global contact:", fetchError);
        continue;
      }
      
      if (!existing) {
        const { error: insertError } = await supabaseAdmin
          .from('global_contacts')
          .insert({
            name: contact.name,
            phone: contact.phone,
            email: contact.email || null,
            company: contact.company || null,
          });
        if (insertError) {
          console.error("Error inserting global contact:", insertError);
        } else {
          console.log("Successfully added global contact:", contact.name);
        }
      } else {
        console.log("Global contact already exists, skipping:", contact.name);
      }
    }
  } catch (e) {
    console.error("Error processing VITE_GLOBAL_CONTACTS_JSON:", e);
  }
}

setupGlobalContacts();