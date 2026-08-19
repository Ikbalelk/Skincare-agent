-- ============================================
-- Schéma Supabase : Skincare & Haircare Agent
-- Usage personnel, mono-utilisateur (pas d'auth multi-user)
-- À exécuter dans Supabase > SQL Editor
-- ============================================

create extension if not exists "pgcrypto";

-- Profil : une seule ligne, mise à jour au fil du temps
create table profile (
  id uuid primary key default gen_random_uuid(),
  skin_type text,               -- ex: "grasse", "sèche", "mixte", "sensible"
  hair_type text,                -- ex: "bouclé", "fin", "coloré"
  allergies text[],              -- ex: {"sulfates", "parfum"}
  goals text[],                  -- ex: {"réduire imperfections", "moins de chute"}
  updated_at timestamptz default now()
);

-- Historique de routine : chaque produit utilisé, avec horodatage
create table routine_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  product_name text not null,
  time_of_day text check (time_of_day in ('matin', 'soir')),
  category text,                 -- ex: "nettoyant", "sérum", "crème", "shampoing"
  notes text
);

-- Photos de suivi (visage / cheveux), stockées via Supabase Storage
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  image_url text not null,
  area text check (area in ('visage', 'cheveux')),
  notes text
);

-- Historique de conversation, pour reconstruire le contexte à chaque appel
-- content stocke le bloc "content" brut envoyé/reçu par l'API Claude (texte ou tool_use)
create table conversation_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  role text check (role in ('user', 'assistant')),
  content jsonb not null
);

-- Ligne de profil vide par défaut, à compléter depuis l'app ou directement en SQL
insert into profile (skin_type, hair_type, allergies, goals)
values (null, null, '{}', '{}');
