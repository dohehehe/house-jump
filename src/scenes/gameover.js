import Phaser from '../lib/phaser.js'

export default class GameOver extends Phaser.Scene {
    constructor() {
        super("game-over")
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height

        this.add.text(width * 0.5, height * 0.5, 'Game Over', { fontSize: 48 }).setOrigin(0.5)

        const finalScore = this.registry.get("final-score")
        this.add.text(width * 0.5, height * 0.25, finalScore, { fontSize: 48 }).setOrigin(0.5)

        // 스페이스바로 재시작 안내 텍스트
        this.add.text(width * 0.5, height * 0.7, 'Press SPACEBAR to Restart', {
            fontSize: 32,
            color: '#ffff00'
        }).setOrigin(0.5)

        // 스페이스바 입력 처리
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        spaceKey.once('down', () => {
            this.scene.start('game')
        })
    }
}