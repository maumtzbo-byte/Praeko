-- Praeko — Agente Creativo: tracks the async fal.ai job behind each
-- `generations` row so a later poll can find out whether it's done.
-- generations.storage_path stays null until job_status = 'completed'.

alter table generations
  add column provider_job_id text,
  add column job_status text not null default 'queued'
    check (job_status in ('queued', 'processing', 'completed', 'failed'));
