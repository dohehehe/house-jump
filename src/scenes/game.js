import Phaser from '../lib/phaser.js';
import Carrot from '../game/carrot.js'
import quizzes from '../game/quizzes.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../main.js'

export default class Game extends Phaser.Scene {
    carrotCollected = 0

    // 게임 크기 기반 상수들
    GAME_WIDTH = GAME_WIDTH
    GAME_HEIGHT = GAME_HEIGHT
    GAME_CENTER_X = GAME_WIDTH / 2
    GAME_CENTER_Y = GAME_HEIGHT / 2

    // 플레이어 관련 상수
    PLAYER_SCALE = 0.5
    PLAYER_JUMP_VELOCITY = -450;
    PLAYER_MOVE_VELOCITY_LEFT = -GAME_WIDTH / 2;
    PLAYER_MOVE_VELOCITY_RIGHT = GAME_WIDTH / 2;
    CORRECT_ANSWER_BOOST = 2 // 정답 시 추가 점프력 배수 (더 높이 뛰기)

    // 플랫폼 관련 상수
    PLATFORM_SCALE = 0.5
    PLATFORM_SPACING_HEIGHT = 170 //플랫폼 높이
    PLATFORM_GAP_TWEAK = 20 // 간격을 조금 더 가깝게 만드는 보정치
    PLATFORM_X_MIN = GAME_WIDTH / 10 //플랫폼 X 최소값
    PLATFORM_X_MAX = GAME_WIDTH * 9 / 10 //플랫폼 X 최대값

    // 바닥 플랫폼 관련 상수
    GROUND_PLATFORM_Y = GAME_HEIGHT + 100 // 바닥 플랫폼 Y 위치 (화면 하단에서 약간 위)
    GROUND_PLATFORM_WIDTH = GAME_WIDTH // 바닥 플랫폼 너비
    GROUND_PLATFORM_SCALE = 1.0 // 바닥 플랫폼 스케일

    // 퀴즈 관련 상수
    QUIZ_PLATFORM_LEFT_X = GAME_WIDTH / 5//퀴즈 플랫폼 좌측 위치(게임 너비의 1/4)
    QUIZ_PLATFORM_RIGHT_X = GAME_WIDTH - (GAME_WIDTH / 5) //퀴즈 플랫폼 우측 위치(게임 너비의 3/4)
    QUIZ_PLATFORM_Y_OFFSET = GAME_HEIGHT / 4 //퀴즈 플랫폼 위치(플레이어 높이의 1/4)
    QUIZ_ZONE_PADDING = this.PLATFORM_SPACING_HEIGHT//퀴즈 구역 패딩(플랫폼 간격과 동일)
    QUIZ_INTERVAL = GAME_HEIGHT * 1.5   //다음 퀴즈까지의 간격(플레이어 높이의 2배)

    // 구름 관련 상수
    CLOUD_COUNT = 5
    CLOUD_Y_SPACING = 250
    CLOUD_RECYCLE_OFFSET = 800
    CLOUD_Y_RANGE_MIN = 20
    CLOUD_Y_RANGE_MAX = 60

    // 카메라 관련 상수
    CAMERA_DEADZONE_MULTIPLIER = 1.3
    CAMERA_FOLLOW_OFFSET_Y = 200 // 카메라 시점

    // UI 관련 상수
    UI_FONT_SIZE = 24
    UI_QUESTION_FONT_SIZE = 35
    UI_LABEL_FONT_SIZE = 18



    /** @type {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    groundPlatform

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    /** @type {Phaser.GameObjects.Group} */
    clouds

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots

    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    /** @type {Phaser.Sound.NoAudioSound} */
    gameMusic

    // 퀴즈 시스템 상태
    /** @type {boolean} */
    isQuizActive = false
    /** @type {number} */
    currentQuizIndex = 0
    /** @type {number} */
    quizzesTriggered = 0
    /** @type {number} */
    quizInterval = 800
    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    quizPlatforms
    /** @type {Phaser.GameObjects.Text} */
    questionText
    /** @type {number|null} */
    quizZoneTop = null
    /** @type {number|null} */
    quizZoneBottom = null
    /** @type {{question:string, a:string, b:string, correct:'A'|'B'}[]} */
    quizzes = quizzes

    constructor() {
        super({ key: 'game' });
    }

    init() {
        this.carrotCollected = 0;
        this.quizInterval = this.QUIZ_INTERVAL;
    }

    preload() {
        this.load.setBaseURL('assets/')
        this.load.image('background', 'Background/bg_layer1.png')

        this.load.image('cloud', 'Enemies/cloud.png')
        // 플랫폼 이미지 로드
        this.load.image('platform', 'Environment/ground_grass.png')
        // 플레이어 이미지 로드
        this.load.image('bunny-stand', 'Players/bunny1_stand.png')
        this.load.image('bunny-jump', 'Players/bunny1_jump.png')

        this.load.image('coin', 'Items/coin.png')

        this.load.audio('jump', 'Audio/phaseJump2.ogg')
        this.load.audio('collect', "Audio/powerUp5.ogg")
        this.load.audio('background-music', 'Audio/back-home.wav')

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    create() {
        var image = this.add.image(this.GAME_CENTER_X, this.GAME_CENTER_Y, 'background').setScrollFactor(1, 0)

        //구름 생성
        this.clouds = this.add.group();
        for (let index = 0; index < this.CLOUD_COUNT; index++) {
            const x = Phaser.Math.Between(0, this.GAME_WIDTH)
            const y = this.CLOUD_Y_SPACING * index;
            this.clouds.add(this.add.image(x, y, 'cloud'))
        }

        //바닥 플랫폼 생성 (고정된 시작점)
        this.groundPlatform = this.physics.add.staticGroup()
        const groundPlatform = this.groundPlatform.create(this.GAME_CENTER_X, this.GROUND_PLATFORM_Y, 'platform')
        groundPlatform.setScale(this.GROUND_PLATFORM_SCALE)
        groundPlatform.setData('isGround', true) // 바닥 플랫폼임을 표시
        groundPlatform.setDepth(0) // 캐릭터보다 뒤에 배치
        groundPlatform.body.updateFromGameObject()

        //일반 플랫폼 생성
        this.platforms = this.physics.add.staticGroup()
        // 코인 그룹은 플랫폼 위 스폰에 사용되므로 루프 전에 생성
        this.carrots = this.physics.add.group({
            classType: Carrot
        })
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(this.PLATFORM_X_MIN, this.PLATFORM_X_MAX)
            const y = this.PLATFORM_SPACING_HEIGHT * i;

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform')
            platform.setScale(this.PLATFORM_SCALE)
            platform.setDepth(0) // 캐릭터보다 뒤에 배치

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()

            // 초기 생성 시 일정 확률로 코인 생성
            if (Phaser.Math.FloatBetween(0, 1) < 0.35) {
                this.addCarrotAbove(platform)
            }
        }

        // 캐릭터 생성 (바닥 플랫폼 위에서 시작)
        this.player = this.physics.add.sprite(this.GAME_CENTER_X, this.GROUND_PLATFORM_Y - 100, 'bunny-stand').setScale(this.PLAYER_SCALE)
        this.player.setDepth(1) // 플랫폼보다 앞에 배치
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        this.physics.add.collider(this.platforms, this.player)
        this.physics.add.collider(this.groundPlatform, this.player)

        this.cameras.main.startFollow(this.player)
        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width * this.CAMERA_DEADZONE_MULTIPLIER)
        this.cameras.main.setFollowOffset(0, this.CAMERA_FOLLOW_OFFSET_Y)

        this.physics.add.collider(this.platforms, this.carrots)

        this.physics.add.overlap(this.player, this.carrots, this.handleCollectCarrot, undefined, this)

        const style = { color: '#000', fontSize: this.UI_FONT_SIZE, fontStyle: 'bold', backgroundColor: '#f5a040', }
        this.carrotsCollectedText = this.add.text(this.GAME_CENTER_X, 10, 'Coin: 0', style).setScrollFactor(0).setOrigin(0.5, 0).setDepth(1)

        this.gameMusic = this.sound.add('background-music', { loop: true })
        // this.gameMusic.play()

        // 퀴즈용 플랫폼(A/B) 그룹
        this.quizPlatforms = this.physics.add.staticGroup()
        this.physics.add.collider(this.quizPlatforms, this.player)
        // overlap은 제거하고 collider만 사용

        // 질문 텍스트 UI(초기에는 숨김)
        const qStyle = { color: '#fff', fontSize: this.UI_QUESTION_FONT_SIZE, textAlign: 'center', fontStyle: 'bold', backgroundColor: '#00000088', padding: { x: 8, y: 6 } }
        this.questionText = this.add.text(this.GAME_CENTER_X, 48, '', qStyle).setScrollFactor(0).setOrigin(0.5, 0.5).setDepth(2)
        this.questionText.setVisible(false)
    }

    update() {
        // 플레이어가 오른 높이에 따라 일정 간격으로 퀴즈 트리거
        const heightClimbed = -this.cameras.main.scrollY
        if (!this.isQuizActive && this.quizzesTriggered < this.quizzes.length) {
            const shouldTrigger = Math.floor(heightClimbed / this.quizInterval) > this.quizzesTriggered
            if (shouldTrigger) {
                this.quizzesTriggered++
                this.startQuiz()
                return
            }
        }

        // 퀴즈 중에도 기존 점프/이동 로직 유지(조기 종료 없음)
        // 일반 플랫폼 반복 (바닥 플랫폼 제외)
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child

            const scrollY = this.cameras.main.scrollY
            const recycleThreshold = scrollY + this.scale.height
            if (platform.y >= recycleThreshold) {
                const topMost = this.findTopMostPlatform()
                const spacing = this.PLATFORM_SPACING_HEIGHT
                const platformHalfHeight = (platform.body && (platform.body.halfHeight || platform.body.height / 2)) || (platform.displayHeight / 2)
                const topMostHalfHeight = (topMost.body && (topMost.body.halfHeight || topMost.body.height / 2)) || (topMost.displayHeight / 2)
                let nextY = topMost.y - topMostHalfHeight - spacing - platformHalfHeight + this.PLATFORM_GAP_TWEAK
                // 간단한 중첩 방지: 기존 플랫폼들과의 최소 간격 확보
                const others = this.platforms.getChildren()
                for (let tries = 0; tries < 6; tries++) {
                    let overlapped = false
                    for (let i = 0; i < others.length; i++) {
                        const other = others[i]
                        if (other === platform) continue
                        const otherHalf = (other.body && (other.body.halfHeight || other.body.height / 2)) || (other.displayHeight / 2)
                        const minGap = platformHalfHeight + otherHalf - this.PLATFORM_GAP_TWEAK * 0.5
                        if (Math.abs(nextY - other.y) < minGap) {
                            nextY = Math.min(nextY, other.y) - (minGap - Math.abs(nextY - other.y) + 1)
                            overlapped = true
                            break
                        }
                    }
                    if (!overlapped) break
                }
                // Avoid spawning inside quiz zone if active (use edge-based spacing to keep consistency)
                if (this.isQuizActive && this.quizZoneTop !== null && this.quizZoneBottom !== null) {
                    if (nextY <= this.quizZoneBottom && nextY >= this.quizZoneTop) {
                        const quizCenterY = this.quizCenterY ?? ((this.quizZoneTop + this.quizZoneBottom) / 2)
                        const quizHalfHeight = this.quizPlatformHalfHeight ?? 0
                        const quizTopEdgeY = quizCenterY - quizHalfHeight
                        nextY = quizTopEdgeY - spacing - platformHalfHeight + this.PLATFORM_GAP_TWEAK
                        // 퀴즈 근처에서도 중첩 방지
                        const othersInQuiz = this.platforms.getChildren()
                        for (let tries = 0; tries < 6; tries++) {
                            let overlapped = false
                            for (let i = 0; i < othersInQuiz.length; i++) {
                                const other = othersInQuiz[i]
                                if (other === platform) continue
                                const otherHalf = (other.body && (other.body.halfHeight || other.body.height / 2)) || (other.displayHeight / 2)
                                const minGap = platformHalfHeight + otherHalf - this.PLATFORM_GAP_TWEAK * 0.5
                                if (Math.abs(nextY - other.y) < minGap) {
                                    nextY = Math.min(nextY, other.y) - (minGap - Math.abs(nextY - other.y) + 1)
                                    overlapped = true
                                    break
                                }
                            }
                            if (!overlapped) break
                        }
                    }
                }
                platform.y = nextY
                platform.x = Phaser.Math.Between(this.PLATFORM_X_MIN, this.PLATFORM_X_MAX)
                platform.body.updateFromGameObject()

                // 재활용 시에도 일정 확률로 코인 생성
                if (Phaser.Math.FloatBetween(0, 1) < 0.4) {
                    this.addCarrotAbove(platform)
                }
            }
        })


        // 구름 재활용
        this.clouds.children.iterate(child => {
            /** @type {Phaser.GameObjects.Image} */
            const cloud = child

            const scrollY = this.cameras.main.scrollY
            if (cloud.y >= scrollY + this.CLOUD_RECYCLE_OFFSET) {
                cloud.y = scrollY - Phaser.Math.Between(this.CLOUD_Y_RANGE_MIN, this.CLOUD_Y_RANGE_MAX)
            }
        })

        const touchingDown = this.player.body.touching.down;

        if (touchingDown) {
            // 퀴즈 플랫폼 착지 확인
            if (this.isQuizActive) {
                this.checkQuizPlatformLanding()
            }

            this.player.setVelocityY(this.PLAYER_JUMP_VELOCITY)

            this.player.setTexture('bunny-jump')

            // this.sound.play('jump')
        }


        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny-stand') {
            // 떨어질 때 대기 이미지로 변경
            this.player.setTexture('bunny-stand')
        }


        if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(this.PLAYER_MOVE_VELOCITY_LEFT)
        }
        else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(this.PLAYER_MOVE_VELOCITY_RIGHT)
        }
        else {
            this.player.setVelocityX(0)
        }

        this.horizontalWrap(this.player)

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 600) {
            // 최종 점수 등록
            this.registry.set('final-score', this.carrotsCollectedText.text)
            this.gameMusic.stop()

            this.scene.start('game-over')
        }
    }

    startQuiz() {
        this.isQuizActive = true
        // 중력 유지(플랫폼에 착지 가능), 기존 점프 동작 유지
        this.player.body.allowGravity = true

        // 선택: 퀴즈 중 플랫폼 충돌 영향 축소
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        // 질문 표시 (선택지 텍스트는 각 플랫폼 위에 렌더링함)
        const quiz = this.quizzes[this.currentQuizIndex]
        this.questionText.setText(`[${this.currentQuizIndex + 1}/10] \n ${quiz.question}`)
        this.questionText.setVisible(true)

        // 카메라 뷰 근처에 O/X 퀴즈 플랫폼 생성
        this.spawnQuizPlatforms()

        // 퀴즈 구역 예약: 해당 영역의 기존 플랫폼은 위로 밀어냄
        if (this.quizZoneTop !== null && this.quizZoneBottom !== null) {
            // 퀴즈 존에 걸친 기존 플랫폼들을 제거하고, 퀴즈 상단 모서리부터 위로 재생성
            const toRemove = []
            this.platforms.children.iterate(child => {
                /** @type {Phaser.Physics.Arcade.Sprite} */
                const platform = child
                if (platform.y <= this.quizZoneBottom && platform.y >= this.quizZoneTop) {
                    toRemove.push(platform)
                }
            })

            const count = toRemove.length
            if (count > 0) {
                // 먼저 제거
                for (const platform of toRemove) {
                    this.platforms.remove(platform, true, true)
                }

                // 퀴즈 플랫폼 상단 모서리 기준 계산값
                const quizCenterY = this.quizCenterY ?? ((this.quizZoneTop + this.quizZoneBottom) / 2)
                const quizHalfHeight = this.quizPlatformHalfHeight ?? 0
                let currentTopEdgeY = quizCenterY - quizHalfHeight

                // 같은 개수만큼 재생성(겹치지 않게 위로 스택)
                for (let i = 0; i < count; i++) {
                    const x = Phaser.Math.Between(this.PLATFORM_X_MIN, this.PLATFORM_X_MAX)
                    /** @type {Phaser.Physics.Arcade.Sprite} */
                    const platform = this.platforms.create(x, 0, 'platform')
                    platform.setScale(this.PLATFORM_SCALE)
                    platform.setDepth(0)
                    platform.body.updateFromGameObject()

                    const platformHalfHeight = (platform.body && (platform.body.halfHeight || platform.body.height / 2)) || (platform.displayHeight / 2)
                    let targetY = currentTopEdgeY - this.PLATFORM_SPACING_HEIGHT - platformHalfHeight + this.PLATFORM_GAP_TWEAK
                    // 주변 플랫폼과의 중첩 방지(재생성 시에도)
                    const others = this.platforms.getChildren()
                    for (let tries = 0; tries < 6; tries++) {
                        let overlapped = false
                        for (let k = 0; k < others.length; k++) {
                            const other = others[k]
                            if (other === platform) continue
                            const otherHalf = (other.body && (other.body.halfHeight || other.body.height / 2)) || (other.displayHeight / 2)
                            const minGap = platformHalfHeight + otherHalf - this.PLATFORM_GAP_TWEAK * 0.5
                            if (Math.abs(targetY - other.y) < minGap) {
                                targetY = Math.min(targetY, other.y) - (minGap - Math.abs(targetY - other.y) + 1)
                                overlapped = true
                                break
                            }
                        }
                        if (!overlapped) break
                    }

                    platform.y = targetY
                    platform.body.updateFromGameObject()

                    // 다음 기준: 방금 배치한 플랫폼의 상단 모서리
                    currentTopEdgeY = targetY - platformHalfHeight
                }
            }
        }
    }

    endQuiz(success) {
        // 퀴즈 플랫폼과 라벨 정리
        this.quizPlatforms.getChildren().forEach(p => {
            const lbl = p.getData('label')
            if (lbl) lbl.destroy()
            // 그룹에서 플랫폼 제거
            this.quizPlatforms.remove(p, true, true)
        })
        this.questionText.setVisible(false)

        // 퀴즈 구역 예약 해제
        this.quizZoneTop = null
        this.quizZoneBottom = null

        if (!success) {
            // 오답 선택 → 게임오버
            this.registry.set('final-score', 'Wrong Answer!')
            this.gameMusic.stop()
            this.scene.start('game-over')
            return
        }

        // 다음 퀴즈로 진행 또는 승리 처리
        this.currentQuizIndex++
        if (this.currentQuizIndex >= this.quizzes.length) {
            this.registry.set('final-score', 'You Win!')
            this.gameMusic.stop()
            this.scene.start('game-over')
            return
        }

        // 게임 진행 재개
        this.isQuizActive = false
        this.player.body.allowGravity = true
    }

    spawnQuizPlatforms() {
        const cam = this.cameras.main
        const y = cam.scrollY + this.QUIZ_PLATFORM_Y_OFFSET
        const leftX = this.QUIZ_PLATFORM_LEFT_X
        const rightX = this.QUIZ_PLATFORM_RIGHT_X

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const aPlatform = this.quizPlatforms.create(leftX, y, 'platform')
        aPlatform.setScale(this.PLATFORM_SCALE)
        aPlatform.setData('choice', 'A')
        aPlatform.setDepth(0) // 캐릭터보다 뒤에 배치
        aPlatform.body.updateFromGameObject()

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const bPlatform = this.quizPlatforms.create(rightX, y, 'platform')
        bPlatform.setScale(this.PLATFORM_SCALE)
        bPlatform.setData('choice', 'B')
        bPlatform.setDepth(0) // 캐릭터보다 뒤에 배치
        bPlatform.body.updateFromGameObject()

        // 퀴즈 플랫폼의 중심과 반높이 저장 (양쪽 플랫폼은 동일 스케일/텍스처 가정)
        this.quizCenterY = y
        this.quizPlatformHalfHeight = (aPlatform.body && (aPlatform.body.halfHeight || aPlatform.body.height / 2)) || (aPlatform.displayHeight / 2)

        const labelStyle = { color: '#000', fontSize: this.UI_LABEL_FONT_SIZE, fontStyle: 'bold', textAlign: 'center', backgroundColor: '#ffffffbb', padding: { x: 6, y: 4 } }
        // 현재 퀴즈의 선택지 텍스트를 각 플랫폼 위에 표시
        const currentQuiz = this.quizzes[this.currentQuizIndex]
        const aLabel = this.add.text(aPlatform.x, aPlatform.y - 40, 'A: \n' + currentQuiz.a, labelStyle).setOrigin(0.5).setDepth(2)
        const bLabel = this.add.text(bPlatform.x, bPlatform.y - 40, 'B: \n' + currentQuiz.b, labelStyle).setOrigin(0.5).setDepth(2)
        aPlatform.setData('label', aLabel)
        bPlatform.setData('label', bLabel)

        // // 퀴즈 구역 범위 정의(일반 플랫폼 스폰 금지)
        const padding = this.QUIZ_ZONE_PADDING
        this.quizZoneTop = y - padding
        this.quizZoneBottom = y + padding // include neutral area
    }

    /**
     * 퀴즈 플랫폼 착지 확인
     */
    checkQuizPlatformLanding() {
        if (!this.isQuizActive) return

        this.quizPlatforms.children.entries.forEach(platform => {
            if (!platform.body) return

            const playerBottom = this.player.body.bottom
            const platformTop = platform.body.top
            const playerCenterX = this.player.body.center.x
            const platformLeft = platform.body.left
            const platformRight = platform.body.right

            // 플레이어가 플랫폼 위에 있고, 좌우 범위 내에 있는지 확인
            const isOnTop = playerBottom >= platformTop - 3 && playerBottom <= platformTop + 8
            const isInRange = playerCenterX >= platformLeft && playerCenterX <= platformRight

            if (isOnTop && isInRange) {
                const choice = platform.getData('choice')
                if (choice) {
                    console.log('Quiz platform landed:', choice)

                    const quiz = this.quizzes[this.currentQuizIndex]
                    const correct = quiz.correct === choice
                    console.log('Quiz answer check:', { choice, correct: quiz.correct, isCorrect: correct })

                    // 정답인 경우 추가 점프력 적용 (더 높이 뛰기)
                    if (correct) {
                        const additionalJumpForce = this.PLAYER_JUMP_VELOCITY * (this.CORRECT_ANSWER_BOOST - 1)
                        this.player.setVelocityY(this.player.body.velocity.y + additionalJumpForce)
                        console.log('Correct answer! Additional jump force applied:', additionalJumpForce)
                    }

                    this.endQuiz(correct)
                }
            }
        })
    }



    /**
     * @param {Phaser.GameObjects.Sprite} sprit 
     */
    horizontalWrap(sprit) {
        const halfWidth = sprit.displayWidth * 0.5
        const gameWidth = this.GAME_WIDTH
        if (sprit.x < -halfWidth) {
            sprit.x = gameWidth + halfWidth
        }
        else if (sprit.x > gameWidth + halfWidth) {
            sprit.x = -halfWidth
        }
    }

    /**
     * @param {Phaser.GameObjects.Sprite} sprite 
     */
    addCarrotAbove(sprite) {
        const y = sprite.y - sprite.displayHeight;

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'coin')

        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        // update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        this.physics.world.enable(carrot)

        return carrot
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player 
     * @param {Carrot} carrot 
     */
    handleCollectCarrot(player, carrot) {
        //hide from display
        this.carrots.killAndHide(carrot)

        //disable from physics world
        this.physics.world.disableBody(carrot.body)

        this.carrotCollected++

        // this.sound.play('collect')

        this.carrotsCollectedText.text = `Coins: ${this.carrotCollected}`
    }

    findBottomMostPlatform() {
        const platforms = this.platforms.getChildren()
        const groundPlatforms = this.groundPlatform.getChildren()

        // 바닥 플랫폼이 있으면 그것을 기준으로 함
        if (groundPlatforms.length > 0) {
            return groundPlatforms[0]
        }

        // 바닥 플랫폼이 없으면 일반 플랫폼 중 가장 아래 것을 찾음
        if (platforms.length === 0) return null

        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; i++) {
            const platform = platforms[i]

            if (platform.y < bottomPlatform.y) {
                continue;
            }

            bottomPlatform = platform;
        }

        return bottomPlatform;
    }

    findTopMostPlatform() {
        const platforms = this.platforms.getChildren()
        let topPlatform = platforms[0]

        for (let i = 1; i < platforms.length; i++) {
            const platform = platforms[i]
            if (platform.y > topPlatform.y) {
                continue;
            }
            topPlatform = platform
        }

        return topPlatform
    }
}
