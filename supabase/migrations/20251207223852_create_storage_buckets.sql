/*
  # Create storage buckets for documents and templates

  1. New Buckets
    - `Templates` - For storing PDF templates (public access)
    - `documents` - For storing generated documents (private, user-specific access)
  
  2. Security
    - Templates bucket is public for reading
    - Documents bucket allows anon users to upload and read their own files
*/

-- Create Templates bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('Templates', 'Templates', true)
ON CONFLICT (id) DO NOTHING;

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Templates bucket policies (public read)
CREATE POLICY "Public can read templates"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'Templates');

-- Documents bucket policies for anonymous users
CREATE POLICY "Anon users can upload documents"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anon users can read documents"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'documents');

CREATE POLICY "Anon users can update documents"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anon users can delete documents"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'documents');

-- Documents bucket policies for authenticated users
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');