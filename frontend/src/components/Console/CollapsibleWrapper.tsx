import React, { useState } from 'react';

interface CollapsibleWrapperProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleWrapper: React.FC<CollapsibleWrapperProps & { keepMounted?: boolean }> = ({ title, children, defaultOpen = false, keepMounted = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ 
      borderBottom: '1px solid var(--border-color)',
      flexShrink: 0
    }}>
      {/* Header — click target */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          cursor: 'pointer', 
          fontSize: '11px', 
          textTransform: 'uppercase' as const, 
          letterSpacing: '0.15em', 
          color: isOpen ? 'var(--accent-cyan)' : 'var(--text-bright)', 
          fontWeight: 600,
          padding: '14px 16px',
          background: isOpen ? 'rgba(14, 165, 233, 0.06)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          userSelect: 'none' as const,
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.04)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span className="collapsible-arrow" style={{ 
          fontSize: '8px',
          color: isOpen ? 'var(--accent-cyan)' : 'var(--text-muted)',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease, color 0.2s ease',
          display: 'inline-block',
          lineHeight: 1,
        }}>
          ▶
        </span>
        <span>{title}</span>
      </div>
      
      {/* Content — only rendered when open to avoid mounting expensive children, unless keepMounted is true */}
      {(isOpen || keepMounted) && (
        <div style={{ 
          padding: '12px 16px 16px 16px',
          display: isOpen ? 'block' : 'none'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};
