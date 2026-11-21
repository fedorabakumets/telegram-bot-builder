/** @fileoverview Управление только собственными dev-процессами со штатным закрытием брокера. */
import { spawn, execFile } from 'node:child_process';

/**
 * Запускает группу процессов; зависимости заменяются в тестах без реальных сервисов.
 * @param options - План, окружение и системные функции.
 * @returns Действие остановки группы.
 */
export function startDevProcessGroup({ services, root, env = process.env, platform = process.platform,
  spawnProcess = spawn, killWindows = execFile, killGroup = process.kill,
  setTimer = setTimeout, clearTimer = clearTimeout, onExitCode = code => { process.exitCode = code; },
  forceExit = code => process.exit(code), report = message => console.error(message),
  forwardOutput = chunk => process.stdout.write(chunk) }) {
  const children = new Map();
  let stopping = false;
  let deadline;
  let startupDeadline;
  let brokerReady = false;
  /** Общий runtime сам управляет вложенным брокером и закрывает его после своих потребителей. */
  const broker = services.find(service => service.name === 'broker' || service.ownsBroker);
  const readyMarker = broker?.ownsBroker ? 'TELETHON_RUNTIME_READY' : 'TELETHON_BROKER_READY';
  /** Завершает дерево конкретного процесса, не затрагивая соседние запуски. */
  function kill(child, signal = 'SIGTERM') {
    if (!child.pid) return;
    if (platform === 'win32') killWindows('taskkill', ['/pid', String(child.pid), '/T', '/F'], () => {});
    else { try { killGroup(-child.pid, signal); } catch {} }
  }
  /** Сначала останавливает производителей запросов, затем штатно закрывает брокер. */
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    if (startupDeadline) clearTimer(startupDeadline);
    onExitCode(code);
    for (const [child, name] of children) if (name !== broker?.name) kill(child);
    for (const [child, name] of children) if (name === broker?.name) {
      if (broker.ownsBroker) {
        /** IPC сохраняет штатное завершение runtime на Windows, где SIGTERM принудителен. */
        if (child.connected) child.send({ type: 'shutdown' }, error => {
          if (error) report('Не удалось передать запрос остановки общему runtime; ожидаем подтверждения выхода.');
        });
      } else child.stdin?.end('shutdown\n');
    }
    /** Даём завершиться HTTP-операции до 55 секунд и отключению клиента до 10 секунд. */
    deadline = setTimer(() => {
      if (!children.size) return;
      report('Превышено время остановки. При принудительном выходе брокера владение остаётся заблокировано; нужна проверка и ручное восстановление.');
      for (const child of children.keys()) kill(child, 'SIGKILL');
      forceExit(code || 1);
    }, broker?.ownsBroker ? 120000 : 75000);
    deadline.unref?.();
  }
  /** Создаёт процесс и наблюдает его завершение, не запуская соседей при ошибке. */
  function launch(service) {
    const child = spawnProcess(service.command, service.args, {
      cwd: root, windowsHide: true, detached: platform !== 'win32',
      stdio: service.ownsBroker ? ['pipe', 'pipe', 'inherit', 'ipc']
        : service.name === 'broker' ? ['pipe', 'pipe', 'inherit'] : 'inherit',
      env: { ...env, ...service.env, ...(service.name === 'broker' ? { TELETHON_BROKER_STDIN_CONTROL: '1' } : {}) },
    });
    children.set(child, service.name);
    /** Закрытый stdin означает уже завершившийся брокер; событие exit определит результат. */
    child.stdin?.on('error', () => {});
    child.on('error', error => {
      children.delete(child);
      report(`Не удалось запустить ${service.name}: ${error.message}`);
      stop(1);
      if (!children.size && deadline) clearTimer(deadline);
    });
    child.on('exit', code => {
      children.delete(child);
      if (!stopping) { report(`Сервис ${service.name} завершился (${code ?? 'сигнал'})`); stop(code || 1); }
      if (!children.size && deadline) clearTimer(deadline);
    });
    if (service === broker) {
      let pendingLine = '';
      /** Маркер выводится Python только после ownership acquire и успешного bind/listen. */
      child.stdout.on('data', chunk => {
        forwardOutput(chunk);
        pendingLine += chunk.toString();
        const lines = pendingLine.split('\n');
        pendingLine = lines.pop().slice(-256);
        if (!stopping && !brokerReady && lines.some(line => line.trim() === readyMarker)) {
          brokerReady = true;
          clearTimer(startupDeadline);
          startupDeadline = undefined;
          for (const consumer of services) if (consumer !== broker) launch(consumer);
        }
      });
    }
  }
  if (broker) {
    startupDeadline = setTimer(() => {
      report('Брокер не подтвердил готовность за 30 секунд; зависимые сервисы не запущены.');
      stop(1);
    }, 30000);
    launch(broker);
  } else {
    for (const service of services) launch(service);
  }
  return { stop };
}
