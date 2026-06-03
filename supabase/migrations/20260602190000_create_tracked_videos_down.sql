-- Rollback de 20260602190000_create_tracked_videos.sql. Idempotente.
-- NÃO toca a tabela "Client" — leads permanecem intactos (apenas viram órfãos
-- quanto ao join com tracked_videos). Ver F-020 rollback plan.

drop trigger if exists tracked_videos_updated_at on public.tracked_videos;
drop function if exists public.tracked_videos_set_updated_at();

-- policies e índices caem junto com a tabela.
drop table if exists public.tracked_videos cascade;
