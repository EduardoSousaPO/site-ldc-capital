-- F-020 — Admin Video Tracking.
-- Cria a tabela public.tracked_videos: vídeos do YouTube rastreados pelo admin,
-- com cache de métricas da YouTube Data API v3. NÃO altera a tabela "Client"
-- (o join de leads é Client.utm_content = tracked_videos.youtube_video_id).
-- Idempotente (IF NOT EXISTS). Ver docs/plans/feature-contracts/F-admin-video-tracking.md.

create table if not exists public.tracked_videos (
  id                 uuid primary key default gen_random_uuid(),
  youtube_video_id   text not null unique,
  utm_campaign       text not null,
  utm_term           text,
  -- cache YouTube Data API
  title              text,
  channel_title      text,
  published_at       timestamptz,
  thumbnail_url      text,
  duration_seconds   int,
  view_count         bigint,
  like_count         bigint,
  comment_count      bigint,
  youtube_synced_at  timestamptz,
  -- auditoria
  created_by_user_id text references public."User"(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists tracked_videos_utm_campaign_idx
  on public.tracked_videos (utm_campaign);

create index if not exists tracked_videos_created_at_idx
  on public.tracked_videos (created_at desc);

comment on table public.tracked_videos is
  'F-020 — vídeos YouTube rastreados pelo admin (gerador de link UTM + dashboard). Cache de métricas da Data API v3. Join de leads via Client.utm_content = youtube_video_id.';
comment on column public.tracked_videos.youtube_video_id is
  'videoId do YouTube (11 chars). Casa com Client.utm_content quando utm_source=youtube.';
comment on column public.tracked_videos.youtube_synced_at is
  'Última sincronização com a YouTube Data API. Guard de rate-limit 1/min por vídeo.';

-- RLS: defesa em profundidade. O gate operacional é app-layer (checkAdminAuth +
-- service role), igual às demais rotas /api/admin/*. As policies abaixo protegem
-- a tabela caso seja acessada por cliente authenticated/anon (SPEC D-2).
alter table public.tracked_videos enable row level security;

drop policy if exists "tracked_videos_admin_editor_all" on public.tracked_videos;
create policy "tracked_videos_admin_editor_all"
  on public.tracked_videos
  for all
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

drop policy if exists "tracked_videos_service_role_all" on public.tracked_videos;
create policy "tracked_videos_service_role_all"
  on public.tracked_videos
  for all
  to service_role
  using (true)
  with check (true);

-- Trigger para manter updated_at coerente em UPDATE.
create or replace function public.tracked_videos_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tracked_videos_updated_at on public.tracked_videos;
create trigger tracked_videos_updated_at
  before update on public.tracked_videos
  for each row execute function public.tracked_videos_set_updated_at();
