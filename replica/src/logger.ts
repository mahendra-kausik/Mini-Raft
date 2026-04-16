let replicaId = 'unknown';

export function setReplicaId(id: string): void {
  replicaId = id;
}

export function log(level: 'info' | 'warn' | 'error', event: string, data: Record<string, unknown> = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    replicaId,
    event,
    ...data,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
