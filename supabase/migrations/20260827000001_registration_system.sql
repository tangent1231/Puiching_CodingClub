-- 學生資料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  nickname TEXT,
  student_id TEXT,
  school TEXT,
  grade TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS '學生個人資料';

-- 比賽/活動報名設定表
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  registration_open_date DATE,
  registration_close_date DATE,
  event_date DATE,
  required_fields JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.competitions IS '比賽與活動報名設定';

-- 報名記錄表
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  form_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, competition_id)
);

COMMENT ON TABLE public.registrations IS '學生報名記錄';

-- 啟用 Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 用戶角色表
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_roles IS '用戶角色：admin 或 student';
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用戶可讀取自己的角色" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- profiles 權限
CREATE POLICY "學生可讀取自己的資料" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "學生可更新自己的資料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "新用戶可插入自己的資料" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- competitions 權限
CREATE POLICY "任何人可讀取開放比賽" ON public.competitions
  FOR SELECT USING (status = 'open');

CREATE POLICY "管理員可管理比賽" ON public.competitions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- registrations 權限
CREATE POLICY "學生可讀取自己的報名" ON public.registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "學生可插入自己的報名" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "學生可更新自己的報名" ON public.registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "管理員可讀取所有報名" ON public.registrations
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
