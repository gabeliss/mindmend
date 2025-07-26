/**
 * Debug Logger Utility for Mobile Development
 * 
 * This utility helps with debugging authentication issues on mobile devices
 * where console.log output might not be easily accessible.
 */

interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  category: string;
  message: string;
  data?: any;
}

class MobileDebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep only the last 100 logs
  
  private addLog(level: LogEntry['level'], category: string, message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };
    
    this.logs.push(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Also log to console for development
    const consoleMessage = `[${category}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, data || '');
        break;
      case 'warn':
        console.warn(consoleMessage, data || '');
        break;
      case 'info':
        console.info(consoleMessage, data || '');
        break;
      default:
        console.log(consoleMessage, data || '');
    }
  }
  
  log(category: string, message: string, data?: any) {
    this.addLog('log', category, message, data);
  }
  
  error(category: string, message: string, data?: any) {
    this.addLog('error', category, message, data);
  }
  
  warn(category: string, message: string, data?: any) {
    this.addLog('warn', category, message, data);
  }
  
  info(category: string, message: string, data?: any) {
    this.addLog('info', category, message, data);
  }
  
  /**
   * Get all logs as a formatted string for easy viewing/sharing
   */
  getLogsAsString(): string {
    return this.logs
      .map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const dataStr = log.data ? `\nData: ${log.data}` : '';
        return `[${timestamp}] ${log.level.toUpperCase()} [${log.category}] ${log.message}${dataStr}`;
      })
      .join('\n\n');
  }
  
  /**
   * Get logs filtered by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }
  
  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
  
  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }
  
  /**
   * Get the most recent logs (useful for debugging)
   */
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }
  
  /**
   * Export logs for sharing with developers
   */
  exportLogs(): {
    deviceInfo: any;
    timestamp: string;
    logs: LogEntry[];
  } {
    return {
      deviceInfo: {
        platform: 'React Native',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      logs: this.logs
    };
  }
}

// Create singleton instance
export const debugLogger = new MobileDebugLogger();

// Convenience functions for common categories
export const authLogger = {
  log: (message: string, data?: any) => debugLogger.log('AUTH', message, data),
  error: (message: string, data?: any) => debugLogger.error('AUTH', message, data),
  warn: (message: string, data?: any) => debugLogger.warn('AUTH', message, data),
  info: (message: string, data?: any) => debugLogger.info('AUTH', message, data),
};

export const apiLogger = {
  log: (message: string, data?: any) => debugLogger.log('API', message, data),
  error: (message: string, data?: any) => debugLogger.error('API', message, data),
  warn: (message: string, data?: any) => debugLogger.warn('API', message, data),
  info: (message: string, data?: any) => debugLogger.info('API', message, data),
};

export const uiLogger = {
  log: (message: string, data?: any) => debugLogger.log('UI', message, data),
  error: (message: string, data?: any) => debugLogger.error('UI', message, data),
  warn: (message: string, data?: any) => debugLogger.warn('UI', message, data),
  info: (message: string, data?: any) => debugLogger.info('UI', message, data),
};

/**
 * Hook for React components to easily access debug logs
 */
import React from 'react';

export const useDebugLogs = () => {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  
  React.useEffect(() => {
    // Update logs every second (you might want to optimize this)
    const interval = setInterval(() => {
      setLogs(debugLogger.getRecentLogs(20));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    logs,
    getLogsAsString: debugLogger.getLogsAsString.bind(debugLogger),
    clearLogs: debugLogger.clearLogs.bind(debugLogger),
    exportLogs: debugLogger.exportLogs.bind(debugLogger),
  };
};