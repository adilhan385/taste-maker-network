
-- Chef ranks table
CREATE TABLE public.chef_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id uuid NOT NULL UNIQUE,
  rank text NOT NULL DEFAULT 'bronze',
  assigned_by uuid,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.chef_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ranks" ON public.chef_ranks FOR SELECT USING (true);
CREATE POLICY "Admins manage ranks" ON public.chef_ranks FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Admins can view all messages" ON public.chat_messages FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Admin can update wallets for refunds
CREATE POLICY "Admins can update all wallets" ON public.wallets FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Admin can insert wallet transactions for refunds
CREATE POLICY "Admins can insert wallet transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
