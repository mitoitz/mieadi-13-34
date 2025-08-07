-- Create member_indications table
CREATE TABLE IF NOT EXISTS member_indications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  indicated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  justification TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('alta', 'normal', 'baixa')) DEFAULT 'normal',
  status TEXT NOT NULL CHECK (status IN ('pendente', 'aprovada', 'rejeitada')) DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_indications_member_id ON member_indications(member_id);
CREATE INDEX IF NOT EXISTS idx_member_indications_course_id ON member_indications(course_id);
CREATE INDEX IF NOT EXISTS idx_member_indications_indicated_by ON member_indications(indicated_by);
CREATE INDEX IF NOT EXISTS idx_member_indications_status ON member_indications(status);
CREATE INDEX IF NOT EXISTS idx_member_indications_priority ON member_indications(priority);

-- Enable RLS
ALTER TABLE member_indications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Pastors can create indications for their congregation members" ON member_indications
  FOR INSERT 
  WITH CHECK (
    auth.uid() = indicated_by AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'pastor'
    )
  );

CREATE POLICY "Pastors can view their own indications" ON member_indications
  FOR SELECT 
  USING (
    auth.uid() = indicated_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'secretario', 'coordenador')
    )
  );

CREATE POLICY "Pastors can update their own indications" ON member_indications
  FOR UPDATE 
  USING (
    auth.uid() = indicated_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'secretario', 'coordenador')
    )
  );

CREATE POLICY "Admins and coordinators can manage all indications" ON member_indications
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'secretario', 'coordenador')
    )
  );

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_member_indications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_member_indications_updated_at
  BEFORE UPDATE ON member_indications
  FOR EACH ROW
  EXECUTE FUNCTION update_member_indications_updated_at();