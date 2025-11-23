import Phaser from '../lib/phaser.js'

export default class GameOver06 extends Phaser.Scene {
    constructor() {
        super("gameover-06")
    }

    preload() {
        this.load.setBaseURL('assets/')
        this.load.image('gameover-bg-06', 'Result/fail-02.jpg')
        this.load.image('gameover-title', 'Result/gameover-title.png')
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height

        // 배경 이미지의 원본 비율 유지하면서 너비를 화면에 맞춤
        const bgTexture = this.textures.get('gameover-bg-06')
        const bgFrame = bgTexture.get()
        const bgOriginalWidth = bgFrame.width
        const bgOriginalHeight = bgFrame.height
        const bgAspectRatio = bgOriginalHeight / bgOriginalWidth
        const bgDisplayHeight = width * bgAspectRatio

        const bg = this.add.image(width * 0.5, height, 'gameover-bg-06')
            .setOrigin(0.5, 1)
            .setDisplaySize(width, bgDisplayHeight)
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

        // 스페이스바 입력 처리
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        spaceKey.once('down', () => {
            this.scene.start('game')
        })
    }
}