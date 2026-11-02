/** @fileoverview Безопасное разрешение start-меток без хранения одноразовых кодов входа. */
BEGIN;
SELECT pg_advisory_xact_lock(270028);
CREATE OR REPLACE FUNCTION public.analytics_resolve_link_v2(p_project integer,p_token integer,p_payload text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE found_link public.analytics_links%ROWTYPE;
BEGIN
  PERFORM public.analytics_assert_scope_v2(p_project,p_token);
  IF session_user = 'bot_runtime' OR current_setting('role',true) = 'bot_runtime' THEN
    IF p_project IS DISTINCT FROM NULLIF(current_setting('app.project_id',true),'')::integer
       OR p_token IS DISTINCT FROM NULLIF(current_setting('app.token_id',true),'')::integer THEN
      RAISE EXCEPTION 'Область ссылки не соответствует боту' USING ERRCODE='42501';
    END IF;
  END IF;
  IF p_payload LIKE 'link\_%' ESCAPE '\' THEN
    RETURN jsonb_build_object('attribution_status','auth_candidate','purpose','auth');
  END IF;
  IF p_payload IS NULL OR p_payload = '' THEN
    RETURN jsonb_build_object('attribution_status','no_marker','purpose','start');
  END IF;
  SELECT * INTO found_link FROM public.analytics_links
    WHERE project_id=p_project AND token_id=p_token AND code=p_payload;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('attribution_status',CASE WHEN p_payload='ref' OR p_payload LIKE 'ref\_%' ESCAPE '\'
      THEN 'referral_unknown' ELSE 'unknown' END,'purpose','start');
  END IF;
  RETURN jsonb_build_object('source_id',found_link.source_id,'placement_id',found_link.placement_id,
    'link_id',found_link.id,'referrer_id',found_link.referrer_id,'purpose',found_link.purpose,
    'attribution_status','resolved');
END;
$function$;
REVOKE ALL ON FUNCTION public.analytics_resolve_link_v2(integer,integer,text) FROM PUBLIC;
DO $grant$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='bot_runtime') THEN
    GRANT EXECUTE ON FUNCTION public.analytics_resolve_link_v2(integer,integer,text) TO bot_runtime;
  END IF;
END $grant$;
COMMIT;
