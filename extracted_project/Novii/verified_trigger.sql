-- Trigger to automatically set verified_at when is_verified is updated
-- This trigger runs BEFORE UPDATE to set the verified_at timestamp

CREATE OR REPLACE FUNCTION set_verified_at()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تحديث is_verified إلى TRUE، حط التاريخ الحالي
  IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
    NEW.verified_at = NOW();
  END IF;
  
  -- إذا تم تحديث is_verified إلى FALSE، امسح التاريخ
  IF NEW.is_verified = FALSE AND OLD.is_verified = TRUE THEN
    NEW.verified_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_set_verified_at ON profiles;

-- Create the trigger - runs BEFORE UPDATE for each row
CREATE TRIGGER trigger_set_verified_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_verified_at();
