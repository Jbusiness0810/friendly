-- ============================================================
-- Migration: Circles (persistent communities), Photo Verification,
--            Push Notification token storage
-- ============================================================

-- Push notification token on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_token text;

-- ============================================================
-- CIRCLES (Persistent Communities)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.circles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'General',
    avatar_url text,
    creator_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.circle_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member', -- 'admin' or 'member'
    joined_at timestamptz DEFAULT now(),
    UNIQUE(circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.circle_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_posts_circle ON public.circle_posts(circle_id, created_at DESC);

-- RLS for circles
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view circles"
    ON public.circles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create circles"
    ON public.circles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Circle creators can update their circles"
    ON public.circles FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id);

CREATE POLICY "Circle creators can delete their circles"
    ON public.circles FOR DELETE
    TO authenticated
    USING (auth.uid() = creator_id);

-- RLS for circle_members
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view circle members"
    ON public.circle_members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can join circles"
    ON public.circle_members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles"
    ON public.circle_members FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS for circle_posts
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view posts"
    ON public.circle_posts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.circle_members
            WHERE circle_members.circle_id = circle_posts.circle_id
            AND circle_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Circle members can create posts"
    ON public.circle_posts FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.circle_members
            WHERE circle_members.circle_id = circle_posts.circle_id
            AND circle_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own posts"
    ON public.circle_posts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ============================================================
-- PHOTO VERIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.verification_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    selfie_url text NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_user ON public.verification_requests(user_id);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests"
    ON public.verification_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
    ON public.verification_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
