# ParkOra 🚗

PWA per trovare parcheggio in tempo reale tramite crowdsourcing.

## Setup

### 1. Supabase
1. Crea un progetto su supabase.com
2. Vai su SQL Editor e incolla tutto il contenuto di supabase_schema.sql
3. Vai su Authentication → Providers e abilita Google OAuth
4. Copia Project URL e anon public key dalle impostazioni

### 2. Mapbox
1. Crea un account su mapbox.com
2. Crea un token pubblico (piano gratuito: 50.000 richieste/mese)

### 3. Variabili d'ambiente
Crea un file .env.local nella root:

REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
REACT_APP_MAPBOX_TOKEN=pk.eyJ1...

### 4. Avvia in locale
npm install
npm start

### 5. Deploy su Vercel
npm install -g vercel
vercel

Aggiungi le 3 variabili d'ambiente nel pannello Vercel.

## Badge
Cercatore (0) → Parcheggiatore (5) → Habitué (25) → Esperto (100) → Sentinella (300)

## Roadmap
- [x] Auth email + Google
- [x] Mappa pin realtime
- [x] Segnalazione singolo e zona
- [x] Scadenza automatica pin 10 min
- [x] Sistema badge
- [ ] Notifiche push (settimana 3)
- [ ] Re-engagement (fase 2)
- [ ] Heatmap (fase 2, 500+ utenti)
