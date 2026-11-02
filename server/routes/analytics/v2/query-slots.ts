/** @fileoverview Единая календарная сетка точек аудитории и источников с фактическим концом каждого интервала. */
/**
 * Создаёт интервалы по календарю выбранного пояса; при DST день может занимать 23 или 25 часов.
 * @returns CTE с параметрами from $3, to $4, шаг $5 и пояс $6; короткий шаг остаётся фиксированным UTC.
 */
export function v2SlotsSql(): string {
  return `slot_bounds AS (
    SELECT $5::bigint*INTERVAL '1 millisecond' stride,
      CASE WHEN $5::bigint>=86400000 THEN $6::text ELSE 'UTC' END zone
  ), slot_grid AS (
    SELECT generate_series(date_bin(stride,$3::timestamptz AT TIME ZONE zone,TIMESTAMP '1970-01-01'),
      $4::timestamptz AT TIME ZONE zone,stride) local_date,stride,zone FROM slot_bounds
  ), slots AS (
    SELECT local_date AT TIME ZONE zone date,(local_date+stride) AT TIME ZONE zone end_date FROM slot_grid
    WHERE (local_date AT TIME ZONE zone)<$4::timestamptz AND ((local_date+stride) AT TIME ZONE zone)>$3::timestamptz
      AND (local_date AT TIME ZONE zone)<((local_date+stride) AT TIME ZONE zone)
  )`;
}
/**
 * Находит начало интервала одного факта без перебора всех точек графика.
 * @param timestamp - Доверенное выражение даты из серверного SQL, без пользовательского текста.
 * @returns Выражение с теми же календарём и origin, что использует общая сетка.
 */
export function v2BucketDateSql(timestamp: string): string {
  const zone = "CASE WHEN $5::bigint>=86400000 THEN $6::text ELSE 'UTC' END";
  return `(date_bin($5::bigint*INTERVAL '1 millisecond',(${timestamp}) AT TIME ZONE (${zone}),TIMESTAMP '1970-01-01') AT TIME ZONE (${zone}))`;
}
