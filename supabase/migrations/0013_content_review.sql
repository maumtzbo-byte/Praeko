-- Praeko — Agente Revisor de Marca: brand/tone QA on generated scripts
-- before they're queued for media generation. Reuses the quality_review_result
-- enum already defined in 0001_init.sql for the (still unbuilt) media-generation
-- QA step — a script review is the same kind of verdict, just earlier in the
-- pipeline, so no new enum is introduced.

alter table content_calendar
  add column review_result quality_review_result,
  add column review_feedback text;
