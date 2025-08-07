-- Add absence control fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_attendance_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS away_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS away_reason TEXT,
ADD COLUMN IF NOT EXISTS away_start_date DATE,
ADD COLUMN IF NOT EXISTS away_end_date DATE,
ADD COLUMN IF NOT EXISTS absence_alerts_enabled BOOLEAN DEFAULT TRUE;

-- Create absence_notifications table
CREATE TABLE IF NOT EXISTS public.absence_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  days_absent INTEGER NOT NULL,
  notification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_absence_notifications_profile_id ON absence_notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_absence_notifications_date ON absence_notifications(notification_date);
CREATE INDEX IF NOT EXISTS idx_profiles_last_attendance ON profiles(last_attendance_date);
CREATE INDEX IF NOT EXISTS idx_profiles_away_mode ON profiles(away_mode);

-- Enable RLS on absence_notifications table
ALTER TABLE absence_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for absence_notifications
CREATE POLICY "Users can view their own absence notifications" 
ON absence_notifications FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all absence notifications" 
ON absence_notifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'coordenador', 'pastor')
  )
);

CREATE POLICY "System can insert absence notifications" 
ON absence_notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their notifications as read" 
ON absence_notifications FOR UPDATE 
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Create function to check for absences and send notifications
CREATE OR REPLACE FUNCTION check_and_notify_absences()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  person_record RECORD;
  days_absent INTEGER;
  notification_message TEXT;
BEGIN
  -- Loop through active members who are not in away mode
  FOR person_record IN 
    SELECT id, full_name, last_attendance_date, email
    FROM profiles 
    WHERE status = 'ativo' 
    AND away_mode = FALSE 
    AND absence_alerts_enabled = TRUE
    AND last_attendance_date IS NOT NULL
  LOOP
    -- Calculate days absent
    days_absent := CURRENT_DATE - person_record.last_attendance_date;
    
    -- Check if notification is needed (30, 60, or 90 days)
    IF days_absent IN (30, 60, 90) THEN
      -- Check if notification already sent for this period
      IF NOT EXISTS (
        SELECT 1 FROM absence_notifications 
        WHERE profile_id = person_record.id 
        AND days_absent = days_absent
        AND notification_date = CURRENT_DATE
      ) THEN
        -- Create notification message
        notification_message := format(
          '%s está ausente há %s dias. Última presença registrada em %s.',
          person_record.full_name,
          days_absent,
          to_char(person_record.last_attendance_date, 'DD/MM/YYYY')
        );
        
        -- Insert absence notification
        INSERT INTO absence_notifications (
          profile_id,
          days_absent,
          message,
          notification_date
        ) VALUES (
          person_record.id,
          days_absent,
          notification_message,
          CURRENT_DATE
        );
        
        -- Also create a general notification for admins
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          read
        ) 
        SELECT 
          p.id,
          format('Ausência de %s dias', days_absent),
          notification_message,
          'warning',
          FALSE
        FROM profiles p
        WHERE p.role IN ('admin', 'coordenador', 'pastor', 'secretario')
        AND p.status = 'ativo';
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Create function to update attendance date
CREATE OR REPLACE FUNCTION update_attendance_date(person_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET last_attendance_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = person_id;
END;
$$;

-- Create function to set away mode
CREATE OR REPLACE FUNCTION set_away_mode(
  person_id UUID,
  is_away BOOLEAN,
  reason TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    away_mode = is_away,
    away_reason = CASE WHEN is_away THEN reason ELSE NULL END,
    away_start_date = CASE WHEN is_away THEN start_date ELSE NULL END,
    away_end_date = CASE WHEN is_away THEN end_date ELSE NULL END,
    updated_at = NOW()
  WHERE id = person_id;
END;
$$;

-- Grant permissions to functions
GRANT EXECUTE ON FUNCTION check_and_notify_absences() TO authenticated;
GRANT EXECUTE ON FUNCTION update_attendance_date(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_away_mode(UUID, BOOLEAN, TEXT, DATE, DATE) TO authenticated;