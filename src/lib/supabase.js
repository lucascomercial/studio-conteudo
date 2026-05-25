import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://krvrljlwzjmixniibjaw.supabase.co'
const supabaseAnonKey = 'sb_publishable_o44TLlA8lHdrWH3taisjoA_sIDqCwB6'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
