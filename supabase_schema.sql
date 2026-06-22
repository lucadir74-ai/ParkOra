-- ============================================
-- PARKORA - Schema Supabase
-- Esegui questo nell'SQL Editor di Supabase
-- ============================================

-- Tabella profili utente
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  segnalazioni_totali INTEGER DEFAULT 0,
  segnalazioni_settimana INTEGER DEFAULT 0,
  ultima_segnalazione TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella segnalazioni parcheggio
CREATE TABLE IF NOT EXISTS segnalazioni (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitudine DOUBLE PRECISION NOT NULL,
  longitudine DOUBLE PRECISION NOT NULL,
  tipo TEXT CHECK (tipo IN ('singolo', 'zona')) DEFAULT 'singolo',
  attiva BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_segnalazioni_attiva ON segnalazioni(attiva);
CREATE INDEX IF NOT EXISTS idx_segnalazioni_created ON segnalazioni(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_segnalazioni_user ON segnalazioni(user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE segnalazioni ENABLE ROW LEVEL SECURITY;

-- Profiles: ogni utente vede solo il proprio profilo
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Segnalazioni: tutti vedono quelle attive, ognuno inserisce le proprie
CREATE POLICY "segnalazioni_select_all" ON segnalazioni FOR SELECT USING (true);
CREATE POLICY "segnalazioni_insert_own" ON segnalazioni FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "segnalazioni_update_own" ON segnalazioni FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Funzione: crea profilo automaticamente alla registrazione
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Funzione: incrementa contatore segnalazioni
-- ============================================

CREATE OR REPLACE FUNCTION increment_segnalazioni(uid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    segnalazioni_totali = segnalazioni_totali + 1,
    segnalazioni_settimana = segnalazioni_settimana + 1,
    ultima_segnalazione = NOW()
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Funzione: reset settimanale (eseguire ogni lunedì con cron)
-- ============================================

CREATE OR REPLACE FUNCTION reset_segnalazioni_settimana()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET segnalazioni_settimana = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Realtime: abilita per le segnalazioni
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE segnalazioni;
