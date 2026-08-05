-- Frames — Google Business Profile connection: reviews as real-time-ish
-- data, reusing the exact same connections/interactions pattern already
-- used for Instagram/Facebook/TikTok and the Agente de Respuestas, rather
-- than inventing a parallel table shape. Google Business Profile isn't a
-- publishing channel (Frames doesn't post content there) — it's a data
-- source: reviews come in, Frames can read and, once opted in, reply to
-- them, same as it already replies to comments.
--
-- Real-time caveat: Google's actual push mechanism for new reviews is
-- Cloud Pub/Sub (a separate GCP topic + push subscription setup), not a
-- simple webhook URL like Meta's — and this project has no background job
-- infrastructure yet to run a poller either. This migration only adds the
-- storage; reviews get fetched fresh on demand (page load / manual
-- refresh) for now, not on a live push. See src/lib/social/google-business.ts
-- for the fuller explanation and what true push support would need.

alter type social_platform add value 'google_business';
alter type interaction_type add value 'reseña';

-- Only meaningful for 'reseña' interactions; null for comentario/mensaje_directo.
alter table social_interactions add column rating smallint check (rating between 1 and 5);
