-- Add DELETE policy for notifications table
-- Users should be able to delete their own notifications

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

