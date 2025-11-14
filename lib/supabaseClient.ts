
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// In a real Vite app, these would be in a .env.local file and accessed via import.meta.env.VITE_...
// For this environment, we are hardcoding them as requested.
const supabaseUrl = "https://bjrhiusayalaywmyrmsh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqcmhpdXNheWFsYXl3bXlybXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzA1MDMsImV4cCI6MjA3ODY0NjUwM30.z65zfwpI0qXQJdiuSMixnAnPUiyOFsLTzjWe1fb6RyY";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
