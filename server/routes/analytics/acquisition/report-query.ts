/** @fileoverview SQL рекламного отчёта: единая аудитория, точные деньги и возвраты без пересечения старого и нового писателей. */
export const ACQUISITION_REPORT_SQL = `
WITH audience AS (
  SELECT DISTINCT ON(a.user_id) a.*, a.first_known AND NOT EXISTS(SELECT 1 FROM analytics_legacy_people_v2 l
    WHERE l.project_id=$1 AND ($2::integer IS NULL OR l.token_id=$2) AND l.user_id=a.user_id) AS known
  FROM analytics_audience_v2 a WHERE a.project_id=$1 AND ($2::integer IS NULL OR a.token_id=$2)
  ORDER BY a.user_id,a.first_interaction_at,a.first_known,a.first_event_id,a.token_id
), selected AS (
  SELECT p.*,s.name AS source_name,r.coverage_from,
    ($4::timestamptz > (date_trunc('day',$6::timestamptz AT TIME ZONE p.timezone) AT TIME ZONE p.timezone)) AS current_day,
    ($3::timestamptz = (date_trunc('day',$3::timestamptz AT TIME ZONE p.timezone) AT TIME ZONE p.timezone)
     AND ($4::timestamptz = (date_trunc('day',$4::timestamptz AT TIME ZONE p.timezone) AT TIME ZONE p.timezone)
       OR abs(extract(epoch FROM ($4::timestamptz-$6::timestamptz))) < 60)) AS whole_days
  FROM analytics_placements p JOIN analytics_sources s ON s.id=p.source_id AND s.project_id=p.project_id
  LEFT JOIN analytics_runtime_v2 r ON r.project_id=p.project_id AND r.token_id=p.token_id
  WHERE p.project_id=$1 AND ($2::integer IS NULL OR p.token_id=$2)
    AND ($7::integer IS NULL OR p.id=$7)
), arrivals AS (
  SELECT placement_id,count(*) FILTER(WHERE known)::integer AS new_users,
    count(*) FILTER(WHERE NOT known)::integer AS unknown_users
  FROM audience a JOIN selected p ON p.id=a.placement_id
  WHERE first_interaction_at >= $3 AND first_interaction_at < $4
    AND (p.starts_on IS NULL OR first_interaction_at >= (p.starts_on::timestamp AT TIME ZONE p.timezone)) GROUP BY placement_id
), historical AS (
  SELECT p.id placement_id,bool_or(h.is_demo) is_demo,
    count(DISTINCT o.user_id) FILTER(WHERE o.event_key=first_event.event_key AND NOT a.known AND a.placement_id IS NULL)::integer historical_users,
    count(DISTINCT o.user_id) FILTER(WHERE a.first_interaction_at<$3::timestamptz AND o.event_key IS DISTINCT FROM first_event.event_key AND o.observed_at>=a.first_interaction_at
      AND NOT EXISTS(SELECT 1 FROM analytics_events_v2 modern WHERE modern.project_id=p.project_id AND modern.token_id=p.token_id
        AND modern.placement_id=p.id AND modern.user_id=o.user_id AND modern.directed AND modern.metadata->>'entry'='true'
        AND modern.occurred_at >= $3 AND modern.occurred_at < $4 AND modern.id IS DISTINCT FROM a.first_event_id
        AND (p.starts_on IS NULL OR modern.occurred_at >= (p.starts_on::timestamp AT TIME ZONE p.timezone))))::integer historical_returning,
    count(*) FILTER(WHERE o.event_key IS DISTINCT FROM first_event.event_key AND o.observed_at>=a.first_interaction_at
      AND NOT EXISTS(SELECT 1 FROM analytics_events_v2 modern WHERE modern.project_id=p.project_id AND modern.token_id=p.token_id
        AND modern.placement_id=p.id AND modern.event_key=o.event_key AND modern.directed AND modern.metadata->>'entry'='true'
        AND modern.occurred_at >= $3 AND modern.occurred_at < $4 AND modern.id IS DISTINCT FROM a.first_event_id
        AND (p.starts_on IS NULL OR modern.occurred_at >= (p.starts_on::timestamp AT TIME ZONE p.timezone))))::integer historical_starts
  FROM selected p JOIN analytics_placement_history_v2 h ON h.project_id=p.project_id AND h.placement_id=p.id AND h.token_id=p.token_id
  JOIN analytics_start_observations_v2 o ON o.project_id=h.project_id AND o.token_id=h.token_id AND o.marker=h.marker AND o.category='marker'
  JOIN audience a ON a.user_id=o.user_id
  LEFT JOIN analytics_events_v2 first_event ON first_event.id=a.first_event_id AND first_event.token_id=o.token_id
  WHERE o.observed_at >= $3 AND o.observed_at < $4
    AND (h.is_demo OR p.starts_on IS NULL OR o.observed_at >= (p.starts_on::timestamp AT TIME ZONE p.timezone)) GROUP BY p.id
), returning_entries AS (
  SELECT e.placement_id,count(DISTINCT e.user_id) FILTER(WHERE a.first_interaction_at<$3::timestamptz)::integer AS returning_users,count(*)::integer AS repeat_starts
  FROM analytics_events_v2 e JOIN audience a ON a.user_id=e.user_id JOIN selected p ON p.id=e.placement_id
  WHERE e.project_id=$1 AND ($2::integer IS NULL OR e.token_id=$2) AND e.directed
    AND e.occurred_at >= $3 AND e.occurred_at < $4 AND e.metadata->>'entry'='true'
    AND e.id IS DISTINCT FROM a.first_event_id AND e.occurred_at >= a.first_interaction_at
    AND (p.starts_on IS NULL OR e.occurred_at >= (p.starts_on::timestamp AT TIME ZONE p.timezone)) GROUP BY e.placement_id
), costs AS (
  SELECT e.placement_id,count(*)::integer AS expense_count,bool_or(e.estimated) AS estimated,
    sum(e.amount) FILTER(WHERE e.currency='RUB') AS rub,
    sum(e.amount) FILTER(WHERE e.currency='USD') AS usd,
    count(*) FILTER(WHERE e.currency <> $5 AND e.exchange_rate_rub_per_usd IS NULL)::integer AS missing_rates,
    sum(CASE WHEN e.currency=$5 THEN e.amount WHEN $5='RUB' THEN e.amount*e.exchange_rate_rub_per_usd
      ELSE e.amount/e.exchange_rate_rub_per_usd END) AS converted
  FROM analytics_expenses e JOIN selected p ON p.id=e.placement_id
  WHERE e.project_id=$1 AND e.archived_at IS NULL
    AND (e.day::timestamp AT TIME ZONE p.timezone) < $4
    AND ((e.day+1)::timestamp AT TIME ZONE p.timezone) > $3 GROUP BY e.placement_id
)
SELECT p.id AS placement_id,p.name,p.token_id,p.source_id,p.source_name,p.archived_at,p.current_day,coalesce(c.estimated,false) AS estimated,
  coalesce(a.new_users,0) AS new_users,coalesce(a.unknown_users,0) AS unknown_users,
  coalesce(r.returning_users,0)+coalesce(h.historical_returning,0) AS returning_users,
  coalesce(r.repeat_starts,0)+coalesce(h.historical_starts,0) AS repeat_starts,
  coalesce(h.historical_users,0) AS historical_users,coalesce(h.is_demo,false) AS is_demo,
  CASE WHEN h.is_demo AND h.historical_users>0 AND c.missing_rates=0 AND (p.whole_days OR $3::timestamptz='1900-01-01T00:00:00Z'::timestamptz) THEN round(c.converted/h.historical_users,2)::text END AS demo_cost_per_contact,
  p.whole_days,p.coverage_from IS NOT NULL AND p.coverage_from <= greatest($3::timestamptz,p.created_at)
    AND NOT EXISTS(SELECT 1 FROM bot_tokens t LEFT JOIN analytics_runtime_v2 rt ON rt.project_id=t.project_id AND rt.token_id=t.id
      WHERE t.project_id=$1 AND ($2::integer IS NULL OR t.id=$2)
        AND (rt.coverage_from IS NULL OR rt.coverage_from > greatest($3::timestamptz,p.created_at))) AS covered,
  coalesce(c.expense_count,0) AS expense_count,coalesce(c.missing_rates,0) AS missing_rates,
  round(c.rub,2)::text AS rub,round(c.usd,2)::text AS usd,round(c.converted,2)::text AS converted,
  CASE WHEN a.new_users > 0 THEN round(c.rub/a.new_users,2)::text END AS cpa_rub,
  CASE WHEN a.new_users > 0 THEN round(c.usd/a.new_users,2)::text END AS cpa_usd,
  CASE WHEN a.new_users > 0 THEN round(c.converted/a.new_users,2)::text END AS cpa
FROM selected p LEFT JOIN arrivals a ON a.placement_id=p.id LEFT JOIN returning_entries r ON r.placement_id=p.id
LEFT JOIN costs c ON c.placement_id=p.id LEFT JOIN historical h ON h.placement_id=p.id ORDER BY p.archived_at NULLS FIRST,p.id DESC`;
