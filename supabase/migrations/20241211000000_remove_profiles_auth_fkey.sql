-- Remove foreign key constraint on profiles.id that references auth.users
-- We're using Azure AD, not Supabase Auth, so this constraint is invalid

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Also need to drop and recreate azure_sessions foreign key
-- since it references profiles(id)
ALTER TABLE azure_sessions 
DROP CONSTRAINT IF EXISTS azure_sessions_user_id_fkey;

ALTER TABLE azure_sessions
ADD CONSTRAINT azure_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
