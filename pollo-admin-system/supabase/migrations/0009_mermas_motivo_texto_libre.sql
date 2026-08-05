-- El motivo de una merma ahora se escribe libremente en vez de elegirse de una
-- lista fija: hay demasiados casos particulares y buscar en un catálogo corto
-- de opciones genéricas era un estorbo para quien captura.
alter table mermas drop constraint mermas_motivo_check;
alter table mermas add constraint mermas_motivo_check check (length(trim(motivo)) > 0);
