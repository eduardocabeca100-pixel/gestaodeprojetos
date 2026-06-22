-- Remove placeholders de alunos novos do projeto Reféns.
-- Os alunos serão cadastrados manualmente quando forem selecionados.

delete from public.viva_project_team_costs
where project_team_id in (
  select pt.id
  from public.viva_project_team pt
  join public.viva_team_members tm on tm.id = pt.team_member_id
  where tm.external_key like 'refens-aluno-%'
);

delete from public.viva_project_payments
where project_team_id in (
  select pt.id
  from public.viva_project_team pt
  join public.viva_team_members tm on tm.id = pt.team_member_id
  where tm.external_key like 'refens-aluno-%'
);

delete from public.viva_project_team
where team_member_id in (
  select id from public.viva_team_members
  where external_key like 'refens-aluno-%'
);

delete from public.viva_team_members
where external_key like 'refens-aluno-%';
