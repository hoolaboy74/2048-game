import React from 'react';

const Tile = ({ value }) => {
    const className = `tile tile-${value}`;
    return (
        <div
            className={className}
            role="gridcell"
            aria-label={value > 0 ? `${value}` : '빈 칸'}
        >
            {value > 0 ? value : ''}
        </div>
    );
};

export default Tile;