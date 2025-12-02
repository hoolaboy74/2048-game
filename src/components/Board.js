import React from 'react';
import Tile from './Tile';

const Board = ({ board }) => {
    return (
        <div className="game-board" role="grid">
            {board.map((value, index) => (
                <Tile key={index} value={value} />
            ))}
        </div>
    );
};

export default Board;