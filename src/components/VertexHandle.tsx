import React from 'react';

interface VertexHandleProps {
    x: number;
    y: number;
    id: string;
    size?: number;
    isActive?: boolean;
    onMouseDown: (id: string, e: React.MouseEvent) => void;
    className?: string;
}

const VertexHandle: React.FC<VertexHandleProps> = ({
    x,
    y,
    id,
    size = 8,
    isActive = false,
    onMouseDown,
    className = '',
}) => {
    const halfSize = size / 2;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMouseDown(id, e);
    };

    return (
        <rect
            x={x - halfSize}
            y={y - halfSize}
            width={size}
            height={size}
            fill={isActive ? 'royalblue' : 'white'}
            stroke="royalblue"
            strokeWidth={1.5}
            className={`vertex-handle ${className}`}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'move', transition: 'fill 0.1s ease' }}
        />
    );
};

export default VertexHandle;
