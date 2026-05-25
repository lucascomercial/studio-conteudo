-- ============================================
-- STUDIO DE CONTEÚDO — Schema Supabase
-- Cole no SQL Editor do Supabase e clique Run
-- ============================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================
-- ROTEIROS
-- ============================================
create table if not exists roteiros (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  titulo text not null,
  gancho text,
  corpo text,
  cta text,
  pilar text check (pilar in ('precificacao','captacao','atendimento','marketing','posvenda','mentalidade')),
  publico text check (publico in ('corretor','proprietario','ambos')),
  tom text check (tom in ('provocativo','educativo','bastidor','alerta')),
  duracao text default '~40 seg',
  tags text[] default '{}',
  potencial_viral int default 3 check (potencial_viral between 1 and 5),
  status text default 'backlog' check (status in ('backlog','roteirizado','gravado','editado','agendado','postado')),
  origem text default 'manual' check (origem in ('manual','ia_gerado','transcricao','importado')),
  performance_score int,
  notas text,
  is_favorito boolean default false,
  variacao_de uuid references roteiros(id),
  transcricao_id uuid
);

-- Índices para performance
create index if not exists idx_roteiros_pilar on roteiros(pilar);
create index if not exists idx_roteiros_status on roteiros(status);
create index if not exists idx_roteiros_tom on roteiros(tom);
create index if not exists idx_roteiros_publico on roteiros(publico);
create index if not exists idx_roteiros_is_favorito on roteiros(is_favorito);
create index if not exists idx_roteiros_created_at on roteiros(created_at desc);

-- Full text search
alter table roteiros add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('portuguese', coalesce(titulo,'') || ' ' || coalesce(gancho,'') || ' ' || coalesce(corpo,'') || ' ' || coalesce(cta,''))
  ) stored;
create index if not exists idx_roteiros_search on roteiros using gin(search_vector);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger roteiros_updated_at
  before update on roteiros
  for each row execute function update_updated_at();

-- ============================================
-- TRANSCRIÇÕES
-- ============================================
create table if not exists transcricoes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  titulo text,
  tipo text check (tipo in ('podcast','aula','entrevista','video','palestra','livro','outro')),
  conteudo_original text not null,
  resumo text,
  insights text[] default '{}',
  hooks_gerados text[] default '{}',
  status text default 'pendente' check (status in ('pendente','processando','processado','erro')),
  roteiros_gerados int default 0,
  tokens_usados int default 0
);

-- ============================================
-- HOOKS
-- ============================================
create table if not exists hooks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  texto text not null,
  tipo text check (tipo in ('provocativo','curiosidade','autoridade','erro','alerta','emocional')),
  pilar text,
  performance_score int,
  is_favorito boolean default false,
  origem_roteiro_id uuid references roteiros(id) on delete set null,
  vezes_usado int default 0
);

-- ============================================
-- PRODUTIVIDADE
-- ============================================
create table if not exists produtividade (
  id uuid default gen_random_uuid() primary key,
  data date default current_date unique,
  gravados int default 0,
  postados int default 0,
  roteirizados int default 0,
  notas text
);

-- ============================================
-- REFERÊNCIAS
-- ============================================
create table if not exists referencias (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  titulo text not null,
  url text,
  tipo text check (tipo in ('video','podcast','frase','pessoa','ideia','link','insight')),
  categoria text check (categoria in ('brasil','eua','imoveis','luxo','branding','lideranca','vendas','marketing','outro')),
  notas text,
  tags text[] default '{}',
  is_favorito boolean default false
);

-- ============================================
-- ROW LEVEL SECURITY (importante para produção)
-- ============================================
alter table roteiros enable row level security;
alter table transcricoes enable row level security;
alter table hooks enable row level security;
alter table produtividade enable row level security;
alter table referencias enable row level security;

-- Para MVP de uso pessoal (single user), permitir tudo autenticado
create policy "Acesso total autenticado" on roteiros for all using (true);
create policy "Acesso total autenticado" on transcricoes for all using (true);
create policy "Acesso total autenticado" on hooks for all using (true);
create policy "Acesso total autenticado" on produtividade for all using (true);
create policy "Acesso total autenticado" on referencias for all using (true);
