-- El borrado de gastos era admin-only, así que un encargado no podía
-- corregir una línea mal capturada en "Gastos del día" (RLS lo bloqueaba
-- en silencio: no marcaba error, simplemente no borraba nada). Los gastos
-- fijos (renta, sueldos) se quedan protegidos solo para el admin; los
-- gastos normales del día los puede borrar quien esté en esa sucursal.
drop policy gastos_delete on gastos;
create policy gastos_delete on gastos for delete
  using (is_admin() or (tipo = 'normal' and sucursal_id = current_usuario_sucursal()));
