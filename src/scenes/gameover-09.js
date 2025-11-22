import Phaser from '../lib/phaser.js'

export default class GameOver09 extends Phaser.Scene {
    constructor() {
        super("gameover-09")
    }

    preload() {
        this.load.setBaseURL('assets/')
        this.load.image('gameover-bg-09', 'Result/win.png')
        this.load.image('gameover-title-09', 'Result/win-title.png')
        this.load.image('restart', 'Result/restart.png')
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height

        const bg = this.add.image(width * 0.5, height * 0.5, 'gameover-bg-09')
            .setOrigin(0.5)
            .setDisplaySize(width, height)
            .setAlpha(0)

        this.tweens.add({
            targets: bg,
            alpha: 1,
            duration: 500,
            ease: 'Quad.easeOut'
        })

        const titleTexture = this.textures.get('gameover-title-09')
        const titleFrame = titleTexture.get()
        const titleOriginalWidth = titleFrame.width
        const titleOriginalHeight = titleFrame.height
        const titleScale = width / titleOriginalWidth
        const titleDisplayHeight = titleOriginalHeight * titleScale

        const title = this.add.image(width * 0.5, 0, 'gameover-title-09')
            .setOrigin(0.5, 0)
            .setDisplaySize(width, titleDisplayHeight)
            .setAlpha(0)

        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 500,
            ease: 'Quad.easeOut',
            yoyo: true,
            repeat: -1,
            repeatDelay: 150
        })

        const restartTexture = this.textures.get('restart')
        const restart = this.add.image(width * 0.5, height * 0.7, 'restart')
            .setOrigin(0.5)
            .setDisplaySize(width, height)
            .setAlpha(0)
            .setDepth(5)

        this.tweens.add({
            targets: restart,
            alpha: 1,
            duration: 1400,
            ease: 'Quad.easeOut',
        })

        // 스페이스바 입력 처리
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        spaceKey.once('down', () => {
            this.scene.start('game')
        })
    }
}