-- El contexto que la IA sí necesita para que la muestra no salga genérica.
--
-- La versión anterior del formulario pedía cuatro datos (nombre, negocio,
-- giro, WhatsApp), y con eso el agente de estrategia no tiene de dónde
-- agarrarse: puede escribir "contenido para un gimnasio" y nada más. La
-- muestra es lo único que vende, así que una muestra genérica no sirve.
--
-- Pero un formulario largo en una página detrás de anuncios pagados
-- espanta prospectos. La solución es pedirlo en DOS pasos: el primero
-- guarda el prospecto (esas cuatro columnas siguen siendo las
-- obligatorias), y el segundo, ya con el prospecto a salvo en la base,
-- pide esto como opcional. Quien se vaya en el paso dos igual quedó
-- registrado.
--
-- Todas van nulables por lo mismo: el prospecto ya existe sin ellas.
alter table leads
  -- Qué vende, en sus palabras. Es el campo de más valor de todo el
  -- formulario: sin él el agente de estrategia no sabe de qué escribir.
  add column vende text,
  -- Para qué sirve: el agente de Tendencias busca en internet qué está
  -- funcionando "en tu giro, en tu ciudad", y sin ciudad esa búsqueda
  -- pierde justo la mitad que la hace útil.
  add column ciudad text,
  -- Lo que más le preguntan sus clientes. Es la mina de oro del contenido
  -- —cada pregunta repetida es una pieza— y además es la pregunta más
  -- fácil de contestar de todo el formulario.
  add column preguntan text;
