import Phaser from './lib/phaser.js'
import Game from './scenes/game.js'
import GameOver01 from './scenes/gameover-01.js'
import GameOver02 from './scenes/gameover-02.js'
import GameOver03 from './scenes/gameover-03.js'
import GameOver04 from './scenes/gameover-04.js'
import GameOver05 from './scenes/gameover-05.js'
import GameOver06 from './scenes/gameover-06.js'
import GameOver07 from './scenes/gameover-07.js'
import GameOver08 from './scenes/gameover-08.js'
import GameOver09 from './scenes/gameover-09.js'


// 게임 크기 상수 정의
const GAME_WIDTH = 1440;
const GAME_HEIGHT = 2560;

export default new Phaser.Game(
    {
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        scene: [Game, GameOver01, GameOver02, GameOver03, GameOver04, GameOver05, GameOver06, GameOver07, GameOver08, GameOver09],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    y: 1200
                },
                debug: false
            }
        }
    });

// 게임 크기를 전역으로 export
export { GAME_WIDTH, GAME_HEIGHT };