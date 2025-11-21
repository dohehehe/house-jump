import Phaser from '../lib/phaser.js'

export default class GameOver02 extends Phaser.Scene {
    constructor() {
        super("gameover-02")
    }

    preload() {
        this.load.setBaseURL('assets/')
        this.load.image('gameover-bg', 'Result/fail-01.jpg')
        this.load.image('gameover-title', 'Result/gameover-title.png')
        this.load.image('restart', 'Result/restart.png')
        this.load.image('book-closed', 'Result/book-closed.png')
        this.load.image('book-open', 'Result/book-open-02.png')
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height

        const bg = this.add.image(width * 0.5, height * 0.5, 'gameover-bg')
            .setOrigin(0.5)
            .setDisplaySize(width, height)
            .setAlpha(0)

        this.tweens.add({
            targets: bg,
            alpha: 1,
            duration: 500,
            ease: 'Quad.easeOut'
        })

        const titleTexture = this.textures.get('gameover-title')
        const titleFrame = titleTexture.get()
        const titleOriginalWidth = titleFrame.width
        const titleOriginalHeight = titleFrame.height
        const titleScale = width / titleOriginalWidth
        const titleDisplayHeight = titleOriginalHeight * titleScale

        const title = this.add.image(width * 0.5, 0, 'gameover-title')
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
        const restart = this.add.image(width * 0.5, height * 0.5, 'restart')
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

        const bookClosed = this.add.image(width * 0.5, height * 0.5, 'book-closed')
            .setOrigin(0.5)
            .setDisplaySize(width, height)
            .setAlpha(0)
            .setDepth(5)

        const bookOpen = this.add.image(width * 0.5, height * 0.5, 'book-open')
            .setOrigin(0.5)
            .setDisplaySize(width, height)
            .setAlpha(0)
            .setDepth(6)

        this.tweens.add({
            targets: bookClosed,
            alpha: 1,
            duration: 700,
            ease: 'Quad.easeOut'
        })

        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: bookOpen,
                alpha: 1,
                duration: 600,
                ease: 'Quad.easeOut'
            })
        })

        // 스페이스바 입력 처리
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        spaceKey.once('down', () => {
            this.scene.start('game')
        })
    }
}