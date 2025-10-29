import Phaser from './lib/phaser.js'
import Game from './scenes/game.js'
import GameOver from './scenes/gameover.js'


// 게임 크기 상수 정의
const GAME_WIDTH = 480;
const GAME_HEIGHT = 800;

export default new Phaser.Game(
    {
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        scene: [Game, GameOver],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    y: 400
                },
                debug: false
            }
        }
    });

// 게임 크기를 전역으로 export
export { GAME_WIDTH, GAME_HEIGHT };