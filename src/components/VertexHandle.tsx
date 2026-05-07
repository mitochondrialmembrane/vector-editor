import React from 'react';

interface VertexHandleProps {
    x: number;
    y: number;
    id: string;
    size?: number;
    isActive?: boolean;
    onMouseDown: (id: string, e: React.MouseEvent) => void;
    onClick?: (id: string) => void;
    className?: string;
}

const VertexHandle: React.FC<VertexHandleProps> = ({
    x,
    y,
    id,
    size = 8,
    isActive = false,
    onMouseDown,
    onClick,
    className = '',
}) => {
    const halfSize = size / 2;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMouseDown(id, e);
    };

    return (
        <g
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(id);
            }}
            className={`vertex-handle-group ${className}`}
            style={{ cursor: 'move' }}
        >
            {/* Invisible large hit area */}
            <rect
                x={x - 15}
                y={y - 15}
                width={30}
                height={30}
                fill="transparent"
                stroke="none"
            />
            {/* Visible small handle */}
            <rect
                x={x - halfSize}
                y={y - halfSize}
                width={size}
                height={size}
                fill={isActive ? 'royalblue' : 'white'}
                stroke="royalblue"
                strokeWidth={1.5}
                style={{ transition: 'fill 0.1s ease' }}
            />
        </g>
    );
};

export default VertexHandle;
