
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://blnjgaizfqdojvqemjwm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbmpnYWl6ZnFkb2p2cWVtandtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MTYwNTgsImV4cCI6MjA2MjI5MjA1OH0.BO6iZ_8lG_ILXTt908BxDCUq6dlq3oTRyKKpmdV4SL8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
