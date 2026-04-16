import { COLORS } from '../constants';
import type { ConnectionStatus } from '../hooks/useWebSocket';

interface ToolbarProps {
  activeColor: string;
  onColorChange: (color: string) => void;
  connectionStatus: ConnectionStatus;
}

export function Toolbar({ activeColor, onColorChange, connectionStatus }: ToolbarProps) {
  return (
    <div data-testid="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
      {COLORS.map((color) => (
        <button
          key={color}
          data-testid={`color-${color}`}
          onClick={() => onColorChange(color)}
          aria-label={`Select color ${color}`}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: color,
            border: activeColor === color ? '3px solid #333' : '3px solid transparent',
            cursor: 'pointer',
            outline: activeColor === color ? '2px solid #666' : 'none',
          }}
        />
      ))}
      <span
        data-testid="connection-status"
        style={{
          marginLeft: 'auto',
          fontSize: '14px',
          color:
            connectionStatus === 'connected'
              ? '#2ECC71'
              : connectionStatus === 'connecting'
                ? '#F39C12'
                : '#E74C3C',
        }}
      >
        {connectionStatus === 'connected'
          ? 'Connected'
          : connectionStatus === 'connecting'
            ? 'Connecting...'
            : 'Disconnected'}
      </span>
    </div>
  );
}
