import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Board from './components/Board';
import './components/Game.css';

// Helper Functions
const toMatrix = grid => grid.reduce((acc, _, i) => {
    if (i % 4) {
        acc[acc.length - 1].push(grid[i]);
    } else {
        acc.push([grid[i]]);
    }
    return acc;
}, []);
const toGrid = matrix => matrix.flat();
const getRandomEmptyCell = (currentBoard) => {
    const emptyCells = currentBoard.map((val, i) => val === 0 ? i : -1).filter(i => i !== -1);
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};
const placeRandomTile = (currentBoard) => {
    const newBoard = [...currentBoard];
    const cellIndex = getRandomEmptyCell(newBoard);
    let newValue = 0;
    if (cellIndex !== null) {
        newValue = Math.random() < 0.9 ? 2 : 4;
        newBoard[cellIndex] = newValue;
    }
    return { board: newBoard, newValue, newIndex: cellIndex };
};
const slide = row => {
    const arr = row.filter(val => val);
    return arr.concat(Array(4 - arr.length).fill(0));
};
const combine = (row) => {
    let scoreGained = 0;
    let merges = [];
    for (let i = 0; i < 3; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            const mergedValue = row[i] * 2;
            merges.push(`${row[i]}와 ${row[i]}가 합쳐져 ${mergedValue}가 됨`);
            row[i] = mergedValue;
            scoreGained += mergedValue;
            row[i + 1] = 0;
        }
    }
    return { newRow: row, scoreGained, merges };
};
const operate = (row) => {
    const slidedRow = slide(row);
    const { newRow, scoreGained, merges } = combine(slidedRow);
    return { finalRow: slide(newRow), scoreGained, merges };
};
const rotate = matrix => matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]).reverse());
const isGameOver = (currentBoard) => {
    for (let i = 0; i < 16; i++) {
        if (currentBoard[i] === 0) return false;
        const col = i % 4;
        const row = Math.floor(i / 4);
        if (col < 3 && currentBoard[i] === currentBoard[i + 1]) return false;
        if (row < 3 && currentBoard[i] === currentBoard[i + 4]) return false;
    }
    return true;
};

const App = () => {
    // State and Ref
    const [board, setBoard] = useState(Array(16).fill(0));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState('');
    const [isGameActive, setIsGameActive] = useState(true); // New state for toggling game controls
    const gameContainerRef = useRef(null);
    const alternatorRef = useRef(false);

    // Constants
    const keyMap = useMemo(() => ({
        '1': 0, '2': 1, '3': 2, '4': 3,
        'q': 4, 'w': 5, 'e': 6, 'r': 7,
        'a': 8, 's': 9, 'd': 10, 'f': 11,
        'z': 12, 'x': 13, 'c': 14, 'v': 15,
    }), []);
    const indexMap = useMemo(() => (
        Object.fromEntries(Object.entries(keyMap).map(([key, index]) => [index, key]))
    ), [keyMap]);

    // Helper Functions - moved outside App component
    const checkGameOver = useCallback((currentBoard) => {
        if (isGameOver(currentBoard)) {
            setGameOver(true);
            setMessage("게임 종료! '다시 시작' 버튼을 눌러 새 게임을 시작하세요.");
        }
    }, [setGameOver, setMessage]);

    // Main Logic
    const announceTile = useCallback((index) => {
        const value = board[index];
        const valueText = value === 0 ? '빈 칸' : String(value);
        if (alternatorRef.current) {
            setMessage(`${valueText}\u00A0`);
        } else {
            setMessage(valueText);
        }
        alternatorRef.current = !alternatorRef.current;
    }, [board]);

    const move = useCallback((direction, directionText) => {
        let currentBoard = [...board];
        let tempBoard = toMatrix(currentBoard);
        let totalScoreGained = 0;
        let allMerges = [];

        if (direction === 'right') tempBoard = tempBoard.map(row => row.reverse());
        if (direction === 'up') tempBoard = rotate(rotate(rotate(tempBoard)));
        if (direction === 'down') tempBoard = rotate(tempBoard);

        for (let i = 0; i < 4; i++) {
            const { finalRow, scoreGained, merges } = operate(tempBoard[i]);
            totalScoreGained += scoreGained;
            allMerges.push(...merges);
            tempBoard[i] = finalRow;
        }

        if (direction === 'right') tempBoard = tempBoard.map(row => row.reverse());
        if (direction === 'up') tempBoard = rotate(tempBoard);
        if (direction === 'down') tempBoard = rotate(rotate(rotate(tempBoard)));

        const finalBoard = toGrid(tempBoard);
        const moved = JSON.stringify(currentBoard) !== JSON.stringify(finalBoard);

        if (moved) {
            const { board: boardWithNewTile, newValue, newIndex } = placeRandomTile(finalBoard);
            setBoard(boardWithNewTile);
            setScore(score + totalScoreGained);

            let messageParts = [directionText];
            if (allMerges.length > 0) messageParts.push(...allMerges);
            if (totalScoreGained > 0) messageParts.push(`${totalScoreGained}점 획득`);
            if (newValue > 0) {
                const locationKey = indexMap[newIndex];
                messageParts.push(`새로운 ${locationKey}`);
            }
            
            setMessage(messageParts.join('. '));
            checkGameOver(boardWithNewTile);
        } else {
            const messageText = `${directionText}. 이동할 수 없음`;
            if (alternatorRef.current) {
                setMessage(`${messageText}\u00A0`);
            } else {
                setMessage(messageText);
            }
            alternatorRef.current = !alternatorRef.current;
        }
    }, [board, score, indexMap, checkGameOver]);

    const startGame = useCallback(() => {
        let { board: board1 } = placeRandomTile(Array(16).fill(0));
        let { board: board2 } = placeRandomTile(board1);
        setBoard(board2);
        setScore(0);
        setGameOver(false);
        setIsGameActive(true); // Ensure game is active on start
        setMessage('게임 시작. 아래 게임 방법을 참고하세요.');
        if(gameContainerRef.current) gameContainerRef.current.focus();
    }, []);

    // Effect for global key listener
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                const newActiveState = !isGameActive;
                setIsGameActive(newActiveState);
                setMessage(newActiveState ? '게임 조작 활성화.' : '게임 조작 비활성화. 화살표 키로 페이지 탐색이 가능합니다.');
                return;
            }

            if (!isGameActive || gameOver) {
                return;
            }
            
            const inspectionKey = event.key.toLowerCase();
            if (keyMap[inspectionKey] !== undefined) {
                announceTile(keyMap[inspectionKey]);
                event.preventDefault();
                return;
            }
    
            switch (event.key) {
                case 'ArrowUp': move('up', '위로'); event.preventDefault(); break;
                case 'ArrowDown': move('down', '아래로'); event.preventDefault(); break;
                case 'ArrowLeft': move('left', '왼쪽으로'); event.preventDefault(); break;
                case 'ArrowRight': move('right', '오른쪽으로'); event.preventDefault(); break;
                default: break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isGameActive, gameOver, move, announceTile, keyMap]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    // JSX
    return (
        <div 
            ref={gameContainerRef}
            className="game-container" 
            tabIndex="-1" // No longer needs to be tabbable, as listener is global
            aria-label="2048 게임 보드"
        >
            <header>
                <h1>2048</h1>
                <div className="score-container">
                    점수: <span id="score">{score}</span>
                </div>
            </header>
            <Board board={board} />
            <button onClick={startGame} className="reset-button">다시 시작</button>
            {gameOver && (
                <div className="game-over-message" role="alert">
                    <p>게임 종료!</p>
                    <button onClick={startGame}>새 게임</button>
                </div>
            )}
            <div aria-live="polite" className="sr-only">
                {message}
            </div>

            <section className="instructions" aria-label="게임 방법">
                <h2>2048 게임 완벽 가이드</h2>
                <p>이 게임은 소리를 통해 즐기는 숫자 퍼즐 게임입니다. 4x4 크기의 보드 위에서 타일을 움직이고 합쳐 2048 타일을 만드는 것이 목표입니다.</p>
                
                <h3>1. 키보드 조작법</h3>
                <p>이 게임은 두 종류의 키와 하나의 토글 키를 사용합니다.</p>
                <ul>
                    <li><strong>게임 활성/비활성 (Escape 키):</strong> `Escape` 키를 눌러 게임 조작 모드를 켜고 끌 수 있습니다. 모드가 꺼지면, 화살표 키로 페이지의 다른 부분을 자유롭게 탐색할 수 있습니다.</li>
                    <li><strong>타일 이동 (화살표 키):</strong> 게임이 활성화된 상태에서, 화살표 키(↑, ↓, ←, →)로 모든 타일을 움직입니다.</li>
                    <li><strong>타일 확인 (키보드 격자):</strong> 게임이 활성화된 상태에서, 아래 키를 눌러 해당 칸의 숫자 값을 즉시 들을 수 있습니다.
                        <ul>
                            <li><strong>1행:</strong> `1, 2, 3, 4`</li>
                            <li><strong>2행:</strong> `Q, W, E, R`</li>
                            <li><strong>3행:</strong> `A, S, D, F`</li>
                            <li><strong>4행:</strong> `Z, X, C, V`</li>
                        </ul>
                    </li>
                </ul>

                <h3>2. 게임 진행 규칙</h3>
                <ul>
                    <li><strong>미끄러짐과 가로막힘:</strong> 화살표 키를 누르면, 모든 타일은 벽에 부딪히거나, <strong>다른 숫자를 가진 타일에 가로막히기 전까지</strong> 그 방향으로 끝까지 미끄러집니다.</li>
                    <li><strong>합치기와 점수:</strong> 미끄러지는 도중, <strong>같은 숫자의 타일 두 개가 만나면</strong> 하나로 합쳐집니다. 합쳐진 타일은 숫자가 두 배가 되며, 그 숫자만큼 점수를 얻습니다.</li>
                    <li><strong>새로운 타일 등장:</strong> 타일이 하나라도 움직여서 이동이 성공하면, 비어있는 칸 중 한 곳에 새로운 타일(주로 2, 가끔 4)이 <strong>무작위로</strong> 생겨납니다. 스크린리더가 "<strong>F 위치에 새로운 타일 2 등장</strong>"과 같이 위치와 숫자를 정확히 알려줍니다.</li>
                </ul>

                <h3>3. 최종 목표</h3>
                <p>이 게임의 최종 목표는 점수와 상관없이, <strong>숫자 2048이 적힌 타일 한 개</strong>를 만드는 것입니다.</p>
            </section>
        </div>
    );
};

export default App;