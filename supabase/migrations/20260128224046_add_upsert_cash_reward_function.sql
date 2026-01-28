-- Add the missing upsert_cash_reward RPC function
-- This function is called when a word is mastered to update the cash_rewards table

CREATE OR REPLACE FUNCTION upsert_cash_reward(
  p_child_id UUID,
  p_week_start_date DATE,
  p_cash_earned DECIMAL,
  p_words_mastered INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cash_rewards (child_id, week_start_date, words_mastered_this_week, cash_earned)
  VALUES (p_child_id, p_week_start_date, p_words_mastered, p_cash_earned)
  ON CONFLICT (child_id, week_start_date)
  DO UPDATE SET
    words_mastered_this_week = cash_rewards.words_mastered_this_week + p_words_mastered,
    cash_earned = cash_rewards.cash_earned + p_cash_earned,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
