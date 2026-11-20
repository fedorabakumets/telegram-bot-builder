"""@fileoverview Настройка ограниченной операции очистки и cron-сервиса Railway."""
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import shlex
import shutil
import subprocess
import tempfile

PROJECT = '21c0b471-1a5d-4670-a913-1171752cb7bb'
ENVIRONMENT = 'ea4610c5-7c0c-4c5b-9daf-02f45459ac95'
POSTGRES = '7d0971e1-7f17-4d5e-937a-b11ace8e1899'
CLI = shutil.which('railway')
os.environ['RAILWAY_CALLER'] = 'skill:use-railway@1.7.0'


def run(args):
    """Выполняет команду, исключая вывод параметров и секретов при ошибке."""
    result = subprocess.run([CLI, *args], capture_output=True, text=True, encoding='utf-8')
    if result.returncode:
        raise RuntimeError(result.stderr[-1500:] or result.stdout[-1500:])
    return result.stdout


def api(query, variables):
    """Передаёт параметры API через временный файл, удаляемый после запроса."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as handle:
        json.dump(variables, handle)
        name = handle.name
    try:
        result = json.loads(run(['api', query, '--variables', '@' + name]))
        if result.get('errors'):
            raise RuntimeError('Railway API rejected operation')
        return result.get('data', result)
    finally:
        os.unlink(name)


def sql(statement):
    """Исполняет фиксированный SQL через SSH без вывода текста запроса."""
    encoded = base64.b64encode(statement.encode()).decode()
    command = "printf %s " + shlex.quote(encoded) + " | base64 -d | psql -X -v ON_ERROR_STOP=1 -At"
    return run(['ssh', '-p', PROJECT, '-e', ENVIRONMENT, '-s', POSTGRES, '--', 'sh', '-c', command])


def main():
    """Создаёт роль с доступом только к одной операции и отдельный cron-сервис."""
    password = secrets.token_urlsafe(40)
    salt = secrets.token_bytes(16)
    salted = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 4096)
    stored = hashlib.sha256(hmac.digest(salted, b'Client Key', 'sha256')).digest()
    server = hmac.digest(salted, b'Server Key', 'sha256')
    verifier = 'SCRAM-SHA-256$4096:' + base64.b64encode(salt).decode() + '$' + base64.b64encode(stored).decode() + ':' + base64.b64encode(server).decode()
    source = Path(__file__).with_name('release-cache.pl').read_text()
    encoded = base64.b64encode(source.encode()).decode()
    command = "perl -MMIME::Base64 -e " + shlex.quote('eval decode_base64("' + encoded + '"); die $@ if $@;')
    literal = command.replace("'", "''")
    statement = f"""
BEGIN;
CREATE SCHEMA tbb_cache_maintenance AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA tbb_cache_maintenance FROM PUBLIC;
CREATE ROLE tbb_cache_cleaner LOGIN PASSWORD '{verifier}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
CREATE FUNCTION tbb_cache_maintenance.release_os_file_cache() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $body$
DECLARE before_bytes bigint; after_bytes bigint;
BEGIN
 IF NOT pg_try_advisory_xact_lock(729104, 10) THEN RETURN jsonb_build_object('skipped', true); END IF;
 before_bytes := pg_read_file('/sys/fs/cgroup/memory.current')::bigint;
 COPY (SELECT 1) TO PROGRAM '{literal}';
 after_bytes := pg_read_file('/sys/fs/cgroup/memory.current')::bigint;
 RETURN jsonb_build_object('before_bytes', before_bytes, 'after_bytes', after_bytes);
END $body$;
REVOKE ALL ON FUNCTION tbb_cache_maintenance.release_os_file_cache() FROM PUBLIC;
GRANT CONNECT ON DATABASE postgres TO tbb_cache_cleaner;
GRANT USAGE ON SCHEMA tbb_cache_maintenance TO tbb_cache_cleaner;
GRANT EXECUTE ON FUNCTION tbb_cache_maintenance.release_os_file_cache() TO tbb_cache_cleaner;
COMMIT;
SET ROLE tbb_cache_cleaner;
SELECT tbb_cache_maintenance.release_os_file_cache();
"""
    print(sql(statement), flush=True)
    created = api('mutation($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }', {'input': {
        'projectId': PROJECT, 'environmentId': ENVIRONMENT, 'name': 'postgres-cache-cleaner',
        'variables': {'PGHOST': 'postgres-qruo.railway.internal', 'PGPORT': '5432', 'PGDATABASE': 'postgres',
                      'PGUSER': 'tbb_cache_cleaner', 'PGPASSWORD': password, 'PGCONNECT_TIMEOUT': '15',
                      'PGOPTIONS': '-c statement_timeout=45000 -c lock_timeout=5000',
                      'PGAPPNAME': 'postgres-cache-cleaner'}}})['serviceCreate']
    service = created['id']
    print(json.dumps(created), flush=True)
    api('mutation($service: String!, $environment: String!, $input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(serviceId: $service, environmentId: $environment, input: $input) }', {
        'service': service, 'environment': ENVIRONMENT, 'input': {
            'cronSchedule': '*/10 * * * *', 'restartPolicyType': 'NEVER',
            'startCommand': 'psql -X -v ON_ERROR_STOP=1 -At -c "SELECT tbb_cache_maintenance.release_os_file_cache();"',
            'multiRegionConfig': {'europe-west4-drams3a': {'numReplicas': 1}}, 'numReplicas': 1}})
    api('mutation($i:ServiceInstanceLimitsUpdateInput!){serviceInstanceLimitsUpdate(input:$i)}', {
        'i': {'serviceId': service, 'environmentId': ENVIRONMENT, 'memoryGB': 0.1, 'vCPUs': 0.1}})
    print(run(['service', 'source', 'connect', '-p', PROJECT, '-e', ENVIRONMENT,
               '-s', service, '--image', 'postgres:18-alpine', '--json']), flush=True)


if __name__ == '__main__':
    main()
