
-- ====== ENUM ROLE ======
CREATE TYPE public.app_role AS ENUM ('administrator', 'staff');

-- ====== PROFILES ======
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ====== USER ROLES ======
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ====== has_role ======
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- ====== POLICIES profiles ======
CREATE POLICY "Profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'));

-- ====== POLICIES user_roles ======
CREATE POLICY "User roles readable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'));

-- ====== BARANG ======
CREATE TABLE public.barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  satuan TEXT NOT NULL,
  minimal_stok INTEGER NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barang TO authenticated;
GRANT ALL ON public.barang TO service_role;
ALTER TABLE public.barang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barang readable by auth" ON public.barang
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Barang writable by auth" ON public.barang
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Barang updatable by auth" ON public.barang
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Barang deletable by auth" ON public.barang
  FOR DELETE TO authenticated USING (true);

-- ====== BARANG MASUK ======
CREATE TABLE public.barang_masuk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id UUID NOT NULL REFERENCES public.barang(id) ON DELETE RESTRICT,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_kadaluarsa DATE,
  keterangan TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barang_masuk TO authenticated;
GRANT ALL ON public.barang_masuk TO service_role;
ALTER TABLE public.barang_masuk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BM readable" ON public.barang_masuk FOR SELECT TO authenticated USING (true);
CREATE POLICY "BM insert" ON public.barang_masuk FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "BM update" ON public.barang_masuk FOR UPDATE TO authenticated USING (true);
CREATE POLICY "BM delete" ON public.barang_masuk FOR DELETE TO authenticated USING (true);

-- ====== BARANG KELUAR ======
CREATE TABLE public.barang_keluar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id UUID NOT NULL REFERENCES public.barang(id) ON DELETE RESTRICT,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal_keluar DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barang_keluar TO authenticated;
GRANT ALL ON public.barang_keluar TO service_role;
ALTER TABLE public.barang_keluar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BK readable" ON public.barang_keluar FOR SELECT TO authenticated USING (true);
CREATE POLICY "BK insert" ON public.barang_keluar FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "BK update" ON public.barang_keluar FOR UPDATE TO authenticated USING (true);
CREATE POLICY "BK delete" ON public.barang_keluar FOR DELETE TO authenticated USING (true);

-- ====== TRIGGER updated_at ======
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_barang_touch BEFORE UPDATE ON public.barang
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ====== TRIGGER stok masuk ======
CREATE OR REPLACE FUNCTION public.apply_barang_masuk()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.barang SET stok = stok + NEW.jumlah WHERE id = NEW.barang_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.barang SET stok = stok - OLD.jumlah WHERE id = OLD.barang_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_bm_apply AFTER INSERT OR DELETE ON public.barang_masuk
  FOR EACH ROW EXECUTE FUNCTION public.apply_barang_masuk();

-- ====== TRIGGER stok keluar + validasi ======
CREATE OR REPLACE FUNCTION public.apply_barang_keluar()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE current_stok INTEGER;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT stok INTO current_stok FROM public.barang WHERE id = NEW.barang_id FOR UPDATE;
    IF current_stok IS NULL THEN RAISE EXCEPTION 'Barang tidak ditemukan'; END IF;
    IF current_stok < NEW.jumlah THEN
      RAISE EXCEPTION 'Stok tidak mencukupi. Stok saat ini: %, diminta: %', current_stok, NEW.jumlah;
    END IF;
    UPDATE public.barang SET stok = stok - NEW.jumlah WHERE id = NEW.barang_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.barang SET stok = stok + OLD.jumlah WHERE id = OLD.barang_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_bk_apply AFTER INSERT OR DELETE ON public.barang_keluar
  FOR EACH ROW EXECUTE FUNCTION public.apply_barang_keluar();

-- ====== TRIGGER auto-create profile on signup ======
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
