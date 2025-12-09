/*
  # Make documents bucket public
  
  1. Changes
    - Update documents bucket to be public
    - This allows PDFs to be viewed in iframes and printed
    
  2. Security
    - RLS policies still control who can upload/read/update/delete
    - Making the bucket public just allows the URLs to be accessed directly
*/

UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';
