type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ClientLogger {
  private logLevel: LogLevel = 'info';

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug('');
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info('');
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn('');
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      console.error('');
    }
  }
}

export const logger = new ClientLogger();
