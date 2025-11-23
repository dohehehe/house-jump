import Phaser from '../lib/phaser.js';
import quizzes from '../game/quizzes.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../main.js'
import GameOver01 from './gameover-01.js'
import GameOver02 from './gameover-02.js'
import GameOver03 from './gameover-03.js'
import GameOver04 from './gameover-04.js'
import GameOver05 from './gameover-05.js'
import GameOver06 from './gameover-06.js'
import GameOver07 from './gameover-07.js'
import GameOver08 from './gameover-08.js'
import GameOver09 from './gameover-09.js'

export default class Game extends Phaser.Scene {
    // 게임 크기 기반 상수들
    GAME_WIDTH = GAME_WIDTH
    GAME_HEIGHT = GAME_HEIGHT
    GAME_CENTER_X = GAME_WIDTH / 2
    GAME_CENTER_Y = GAME_HEIGHT / 2

    // 플레이어 관련 상수
    PLAYER_SCALE = 0.5
    PLAYER_JUMP_VELOCITY = -1250;
    PLAYER_MOVE_VELOCITY_LEFT = -GAME_WIDTH / 2;
    PLAYER_MOVE_VELOCITY_RIGHT = GAME_WIDTH / 2;
    CORRECT_ANSWER_BOOST = 8 // 정답 시 추가 점프력 배수 (더 높이 뛰기)
    playerStandTextureKey = 'player-stand'
    playerJumpLeftTextureKey = 'player-jump-left'
    playerJumpRightTextureKey = 'player-jump-right'
    playerFallTextureKey = 'player-fall'

    // 플랫폼 관련 상수
    PLATFORM_SCALE = 1.3
    PLATFORM_SPACING_HEIGHT = 320 //플랫폼 높이
    PLATFORM_GAP_TWEAK = 40 // 간격을 조금 더 가깝게 만드는 보정치
    PLATFORM_X_MIN = GAME_WIDTH / 10 //플랫폼 X 최소값
    PLATFORM_X_MAX = GAME_WIDTH * 9 / 10 //플랫폼 X 최대값

    // 바닥 플랫폼 관련 상수
    GROUND_PLATFORM_Y = GAME_HEIGHT // 바닥 플랫폼 Y 위치 (화면 하단에서 더 아래로)
    GROUND_PLATFORM_WIDTH = GAME_WIDTH // 바닥 플랫폼 너비
    GROUND_PLATFORM_OFFSET = 100 // 바닥 플랫폼을 추가로 내릴 오프셋 (간격 확보용)

    // 퀴즈 관련 상수
    QUIZ_PLATFORM_LEFT_X = GAME_WIDTH / 5//퀴즈 플랫폼 좌측 위치(게임 너비의 1/4)
    QUIZ_PLATFORM_RIGHT_X = GAME_WIDTH - (GAME_WIDTH / 5) //퀴즈 플랫폼 우측 위치(게임 너비의 3/4)
    QUIZ_PLATFORM_Y_OFFSET = GAME_HEIGHT / 7 //퀴즈 플랫폼 위치 (더 위로 올림)
    QUIZ_ZONE_PADDING = this.PLATFORM_SPACING_HEIGHT //퀴즈 구역 패딩(플랫폼 간격과 동일)
    QUIZ_INTERVAL = GAME_HEIGHT * 1   //다음 퀴즈까지의 간격(플레이어 높이의 2배)

    // 구름 관련 상수
    CLOUD_COUNT = 5
    CLOUD_Y_SPACING = 250
    CLOUD_RECYCLE_OFFSET = 800
    CLOUD_Y_RANGE_MIN = 20
    CLOUD_Y_RANGE_MAX = 60

    // 카메라 관련 상수
    CAMERA_DEADZONE_MULTIPLIER = 1.3
    CAMERA_FOLLOW_OFFSET_Y_INITIAL = 1000 // 게임 시작 시 카메라 시점 (바닥이 보이도록)
    CAMERA_FOLLOW_OFFSET_Y_NORMAL = 600 // 일반 게임 플레이 시 카메라 시점

    // UI 관련 상수
    UI_FONT_SIZE = 70
    UI_QUESTION_FONT_SIZE = 70
    UI_LABEL_FONT_SIZE = 60

    // 점수 및 결과 관련
    quizScore = 0
    GAME_OVER_SCENES = [
        'gameover-01',
        'gameover-02',
        'gameover-03',
        'gameover-04',
        'gameover-05',
        'gameover-06',
        'gameover-07',
        'gameover-08',
        'gameover-09'
    ]



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
    /** @type {Phaser.GameObjects.Text} */
    questionNumberText
    /** @type {number|null} */
    quizZoneTop = null
    /** @type {number|null} */
    quizZoneBottom = null
    /** @type {{question:string, a:string, b:string, correct:'A'|'B'}[]} */
    quizzes = quizzes
    /** @type {boolean} */
    hasStartedFirstJump = false // 첫 점프 시작 여부 (카메라 오프셋 전환용)
    /** @type {boolean} */
    wasTouchingGround = false // 이전 프레임에서 바닥에 닿았는지 추적

    constructor() {
        super({ key: 'game' });
    }

    init() {
        this.quizInterval = this.QUIZ_INTERVAL;
        this.hasStartedFirstJump = false; // 첫 점프 상태 초기화
        this.wasTouchingGround = false; // 바닥 접촉 상태 초기화
        this.currentQuizIndex = 0
        this.quizzesTriggered = 0
        this.quizScore = 0
        this.isQuizActive = false
        this.playerStandTextureKey = 'player-stand'
        this.playerJumpLeftTextureKey = 'player-jump-left'
        this.playerJumpRightTextureKey = 'player-jump-right'
    }

    preload() {
        this.load.setBaseURL('assets/')
        this.load.image('background', 'Background/bg_01.png')

        this.load.image('ground-start', 'Environment/ground_start.png')

        this.load.image('platform-01', 'Environment/cloud-01.png')
        this.load.image('platform-02', 'Environment/cloud-02.png')

        this.load.image('building-01', 'Background/building-01.png')
        this.load.image('building-02', 'Background/building-02.png')
        this.load.image('building-03', 'Background/building-03.png')
        this.load.image('building-04', 'Background/building-04.png')



        // 플레이어 이미지 로드
        this.load.image('player-stand', 'Players/player-stand.png')
        this.load.image('player-jump-left', 'Players/player-jump-left.png')
        this.load.image('player-jump-right', 'Players/player-jump-right.png')
        this.load.image('player-fall', 'Players/player-falling.png')


        this.load.audio('jump', 'Audio/phaseJump2.ogg')
        this.load.audio('background-music', 'Audio/back-home.wav')

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    create() {
        // create()가 호출될 때도 확실히 초기화 (scene.restart()나 재시작 시를 대비)
        // scene.start()가 init()을 호출하지 않을 수 있으므로 여기서도 초기화 보장
        this.quizInterval = this.QUIZ_INTERVAL;
        this.hasStartedFirstJump = false;
        this.wasTouchingGround = false;
        this.currentQuizIndex = 0;
        this.quizzesTriggered = 0;
        this.quizScore = 0; // 항상 0으로 리셋
        this.isQuizActive = false;

        // background 이미지의 너비를 GAME_WIDTH에 맞춤
        const backgroundTexture = this.textures.get('background')
        const backgroundWidth = backgroundTexture.source[0].width
        const backgroundScaleX = this.GAME_WIDTH / backgroundWidth

        var image = this.add.image(this.GAME_CENTER_X, this.GAME_CENTER_Y, 'background').setScrollFactor(1, 0)
        image.setScale(backgroundScaleX, 1)

        var image2 = this.add.image(this.GAME_CENTER_X, this.GAME_CENTER_Y, 'background').setScrollFactor(1, 0).setDepth(5).setAlpha(0.3);
        image2.setScale(backgroundScaleX, 1)

        //바닥 플랫폼 생성 (고정된 시작점)
        this.groundPlatform = this.physics.add.staticGroup()
        // 플랫폼 높이를 텍스처에서 직접 계산 (화면에 보이지 않게)
        const platformTexture = this.textures.get('ground-start')
        const platformHeight = platformTexture.source[0].height
        const platformWidth = platformTexture.source[0].width

        // ground_platform의 너비를 GAME_WIDTH에 맞춤
        const targetWidth = this.GAME_WIDTH // 1640

        // 플랫폼의 하단이 화면 하단에 맞도록 Y 위치 계산 (플랫폼 중심 = 화면 하단 - 플랫폼 높이/2 - 추가 오프셋)
        const groundPlatformY = this.GAME_HEIGHT - (platformHeight / 2) - this.GROUND_PLATFORM_OFFSET
        const groundPlatform = this.groundPlatform.create(this.GAME_CENTER_X, groundPlatformY, 'ground-start')

        // GAME_WIDTH에 맞춰서 플랫폼 너비 조정 (비율 유지)
        const scaleX = targetWidth / platformWidth
        groundPlatform.setScale(scaleX, 1)

        groundPlatform.setData('isGround', true) // 바닥 플랫폼임을 표시
        groundPlatform.setDepth(0) // 캐릭터보다 뒤에 배치
        groundPlatform.body.updateFromGameObject()

        // 실제 바닥 플랫폼 Y 위치를 저장 (플레이어 시작 위치 등에서 사용)
        this.actualGroundPlatformY = groundPlatformY
        // 플랫폼 상단 Y 위치 저장 (플레이어 위치 계산용)
        const platformTopY = groundPlatformY - (platformHeight / 2)

        // 추가 배경 이미지 (카메라와 함께 스크롤됨) - 바닥 플랫폼 상단에 맞춤
        // 배경 이미지 높이를 텍스처에서 직접 계산 (화면에 보이지 않게)
        const buildingTexture = this.textures.get('building-01')
        const buildingHeight = buildingTexture.source[0].height
        // 배경 이미지의 하단이 플랫폼 상단에 맞도록 Y 위치 계산
        // 이미지 중심 = 플랫폼 상단 - (이미지 높이 / 2) -> 이미지 하단이 플랫폼 상단에 맞춰짐
        const buildingImageY = platformTopY - (buildingHeight / 3)
        const buildingImage = this.add.image(this.GAME_CENTER_X, buildingImageY, 'building-01').setScrollFactor(1, 0.25)
        buildingImage.setDepth(3) // 기존 배경 위, 플랫폼 아래에 표시
        // buildingImage.setAlpha(0.9) // 투명도 조정

        const building2Texture = this.textures.get('building-02')
        const building2Height = building2Texture.source[0].height
        const building2ImageY = platformTopY - (building2Height / 3)
        const building2Image = this.add.image(this.GAME_CENTER_X, building2ImageY, 'building-02').setScrollFactor(1, 0.19)
        building2Image.setDepth(2)
        // building2Image.setAlpha(1) // 투명도 조정

        const building3Texture = this.textures.get('building-03')
        const building3Height = building3Texture.source[0].height
        const building3ImageY = platformTopY - (building3Height / 3)
        const building3Image = this.add.image(this.GAME_CENTER_X, building3ImageY, 'building-03').setScrollFactor(1, 0.12)
        building3Image.setDepth(1)
        // building2Image.setAlpha(1) // 투명도 조정

        const building4Texture = this.textures.get('building-04')
        const building4Height = building4Texture.source[0].height
        const building4ImageY = platformTopY - (building4Height / 3)
        const building4Image = this.add.image(this.GAME_CENTER_X, building4ImageY, 'building-04').setScrollFactor(1, 0.07)
        building4Image.setDepth(0)
        // building2Image.setAlpha(1) // 투명도 조정


        //일반 플랫폼 생성
        this.platforms = this.physics.add.staticGroup()
        // 바닥 플랫폼 상단보다 위에서 일반 플랫폼 시작 (간격 확보)
        const firstPlatformY = platformTopY - this.PLATFORM_SPACING_HEIGHT

        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(this.PLATFORM_X_MIN, this.PLATFORM_X_MAX)
            const y = firstPlatformY - (this.PLATFORM_SPACING_HEIGHT * i);

            // 플랫폼 이미지를 랜덤으로 선택
            const platformType = Phaser.Math.Between(0, 1) === 0 ? 'platform-01' : 'platform-02'

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, platformType)
            platform.setScale(this.PLATFORM_SCALE)
            platform.setDepth(7) // 캐릭터보다 뒤에 배치

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()
        }


        const playerTexture = this.textures.get(this.playerStandTextureKey)
        const playerHeight = playerTexture.source[0].height * this.PLAYER_SCALE

        // 플레이어를 플랫폼 위에 바로 서있게 배치 (플레이어의 발이 플랫폼 상단에 닿도록)
        // 플레이어 중심 = 플랫폼 상단 - (플레이어 높이 / 2)
        const playerStartY = platformTopY - (playerHeight / 2)

        // 플레이어를 먼저 보이지 않게 생성 (모든 설정 완료 후 표시)
        this.player = this.physics.add.sprite(this.GAME_CENTER_X, playerStartY, this.playerStandTextureKey).setScale(this.PLAYER_SCALE)
        this.player.setVisible(false) // 모든 설정이 완료될 때까지 숨김
        this.player.setDepth(10) // 플랫폼보다 앞에 배치
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        // 물리 바디를 즉시 업데이트하여 플레이어가 플랫폼 위에 정확히 위치하도록
        this.player.body.updateFromGameObject()

        this.physics.add.collider(this.platforms, this.player)
        this.physics.add.collider(this.groundPlatform, this.player)

        // 초기 카메라 오프셋 설정 (바닥이 보이도록)
        this.cameras.main.setFollowOffset(0, this.CAMERA_FOLLOW_OFFSET_Y_INITIAL)
        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width * this.CAMERA_DEADZONE_MULTIPLIER)
        // 초기 카메라 스크롤 위치 설정 (바닥 플랫폼이 화면 하단에 보이도록)
        this.cameras.main.scrollY = playerStartY - this.CAMERA_FOLLOW_OFFSET_Y_INITIAL
        this.cameras.main.startFollow(this.player)

        // 모든 설정이 완료되었으므로 플레이어를 표시
        // 다음 프레임에 표시하여 깜빡임 방지
        this.time.delayedCall(0, () => {
            this.player.setVisible(true)
        })

        this.gameMusic = this.sound.add('background-music', { loop: true })
        // this.gameMusic.play()

        // 퀴즈용 플랫폼(A/B) 그룹
        this.quizPlatforms = this.physics.add.staticGroup()
        this.physics.add.collider(this.quizPlatforms, this.player)
        // overlap은 제거하고 collider만 사용

        // 질문 텍스트 UI(초기에는 숨김)
        const qNumberStyle = { color: '#fff', fontSize: this.UI_QUESTION_FONT_SIZE * 0.8, align: 'center', fontStyle: 'bold', fontFamily: 'NanumSquareNeoOTF-Hv', backgroundColor: '#00000088', padding: { x: 10, y: 20 } }
        this.questionNumberText = this.add.text(this.GAME_CENTER_X, 80, '', qNumberStyle).setScrollFactor(0).setOrigin(0.5, 0.5).setDepth(11)
        this.questionNumberText.setVisible(false)

        const qStyle = { color: '#fff', fontSize: this.UI_QUESTION_FONT_SIZE, align: 'center', fontStyle: 'bold', fontFamily: 'NanumSquareNeoOTF-Bd', backgroundColor: '#00000088', padding: { x: 10, y: 20 } }
        this.questionText = this.add.text(this.GAME_CENTER_X, 150, '', qStyle).setScrollFactor(0).setOrigin(0.5, 0).setDepth(11).setLineSpacing(25)
        this.questionText.setVisible(false)

        this.input.keyboard.once('keyup-SPACE', () => {
            this.scene.restart()
        })
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
                // 플랫폼 이미지를 랜덤으로 변경
                const platformType = Phaser.Math.Between(0, 1) === 0 ? 'platform-01' : 'platform-02'
                platform.setTexture(platformType)
                platform.body.updateFromGameObject()

            }
        })


        const touchingDown = this.player.body.touching.down;

        // 바닥 플랫폼과의 직접 충돌 확인 (더 정확한 감지)
        let isOnGroundPlatform = false
        this.groundPlatform.children.entries.forEach(platform => {
            if (!platform.body || !this.player.body) return
            const playerBottom = this.player.body.bottom
            const platformTop = platform.body.top - 1050
            const playerCenterX = this.player.body.center.x
            const platformLeft = platform.body.left
            const platformRight = platform.body.right

            // 플레이어가 바닥 플랫폼 위에 있고, 좌우 범위 내에 있는지 확인 (더 넓은 범위로 감지)
            const isOnTop = playerBottom >= platformTop - 10 && playerBottom <= platformTop
            const isInRange = playerCenterX >= platformLeft - 10 && playerCenterX <= platformRight + 10

            if (isOnTop && isInRange) {
                isOnGroundPlatform = true
            }
        })

        // 바닥에 닿았을 때 (touchingDown 또는 바닥 플랫폼 위에 있을 때)
        if (touchingDown || isOnGroundPlatform) {
            // 바닥에 닿았을 때 stand 이미지로 변경 (처음 시작할 때만 stand)
            if (this.player.texture.key !== this.playerStandTextureKey && this.player.texture.key !== this.playerJumpLeftTextureKey && this.player.texture.key !== this.playerJumpRightTextureKey) {
                this.player.setTexture(this.playerStandTextureKey)
            }

            // 이전 프레임에서 바닥에 닿지 않았고, 지금 닿았을 때만 점프 (중복 점프 방지)
            if (!this.wasTouchingGround) {
                // 퀴즈 플랫폼 착지 확인
                if (this.isQuizActive) {
                    this.checkQuizPlatformLanding()
                }

                // 첫 점프 시작 시 카메라 오프셋을 일반값으로 변경
                if (!this.hasStartedFirstJump) {
                    this.hasStartedFirstJump = true
                    this.cameras.main.setFollowOffset(0, this.CAMERA_FOLLOW_OFFSET_Y_NORMAL)
                }

                this.player.setVelocityY(this.PLAYER_JUMP_VELOCITY)

                this.player.setTexture(this.playerJumpRightTextureKey)

                this.sound.play('jump')
            }
            this.wasTouchingGround = true
        } else {
            this.wasTouchingGround = false
        }


        if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(this.PLAYER_MOVE_VELOCITY_LEFT)
            if (this.player.texture.key !== this.playerJumpLeftTextureKey) {
                this.player.setTexture(this.playerJumpLeftTextureKey)
            }
        }
        else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(this.PLAYER_MOVE_VELOCITY_RIGHT)
            if (this.player.texture.key !== this.playerJumpRightTextureKey) {
                this.player.setTexture(this.playerJumpRightTextureKey)
            }
        }
        else {
            this.player.setVelocityX(0)
            // 좌우 키를 누르지 않고 바닥에 닿지 않았으며, 아래로 떨어질 때 falling 이미지로 변경
            if (!touchingDown && !isOnGroundPlatform && this.player.body.velocity.y > 0) {
                if (this.player.texture.key !== this.playerFallTextureKey) {
                    this.player.setTexture(this.playerFallTextureKey)
                }
            }
        }

        this.horizontalWrap(this.player)

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 1500) {
            console.log('Player fell - quizScore:', this.quizScore)
            this.goToGameOverScene()
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
        this.questionNumberText.setText(`[${this.currentQuizIndex + 1}/8]`)
        this.questionNumberText.setVisible(true)
        this.questionText.setText(quiz.question)
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
                    // 플랫폼 이미지를 랜덤으로 선택
                    const platformType = Phaser.Math.Between(0, 1) === 0 ? 'platform-01' : 'platform-02'
                    /** @type {Phaser.Physics.Arcade.Sprite} */
                    const platform = this.platforms.create(x, 0, platformType)
                    platform.setScale(this.PLATFORM_SCALE)
                    platform.setDepth(7)
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
            const letterLabel = p.getData('letterLabel')
            const textLabel = p.getData('textLabel')
            if (letterLabel) letterLabel.destroy()
            if (textLabel) textLabel.destroy()
            // 그룹에서 플랫폼 제거
            this.quizPlatforms.remove(p, true, true)
        })
        this.questionText.setVisible(false)
        this.questionNumberText.setVisible(false)

        // 퀴즈 구역 예약 해제
        this.quizZoneTop = null
        this.quizZoneBottom = null

        if (!success) {
            // 틀렸을 때는 현재 quizScore 그대로 사용 (아직 증가하지 않았으므로)
            console.log('Quiz failed - quizScore:', this.quizScore)
            this.goToGameOverScene()
            return
        }

        this.quizScore++
        console.log('Quiz correct - quizScore increased to:', this.quizScore)
        // 다음 퀴즈로 진행 또는 승리 처리
        this.currentQuizIndex++
        if (this.currentQuizIndex >= this.quizzes.length) {
            // 모든 퀴즈를 맞췄을 때 (quizScore는 이미 증가했으므로 8)
            console.log('All quizzes completed - quizScore:', this.quizScore)
            this.goToGameOverScene()
            return
        }

        // 게임 진행 재개
        this.isQuizActive = false
        this.player.body.allowGravity = true
    }

    goToGameOverScene() {
        const targetScene = this.resolveGameOverScene()
        console.log('goToGameOverScene - quizScore:', this.quizScore, 'targetScene:', targetScene)

        if (this.gameMusic) {
            this.gameMusic.stop()
        }
        // game scene을 중지하고 gameover scene을 시작
        // 이렇게 하면 다음에 game scene이 시작될 때 init()이 확실히 호출됨
        this.scene.stop('game')
        this.scene.start(targetScene)
    }

    resolveGameOverScene() {
        // quizScore는 현재까지 맞춘 퀴즈 개수
        // 퀴즈를 틀리거나 추락했을 때의 현재 점수를 기준으로 gameover scene 결정
        // 0개 맞춤 -> gameover-01, 1개 맞춤 -> gameover-02, ..., 8개 맞춤 -> gameover-09
        const score = this.quizScore
        console.log('resolveGameOverScene - quizScore:', score, 'quizzes.length:', this.quizzes.length)

        // 모든 퀴즈를 맞췄거나 그 이상이면 gameover-09
        if (score >= this.quizzes.length) {
            console.log('All quizzes completed, returning gameover-09')
            return 'gameover-09'
        }

        // score를 0~8 사이로 클램프하여 배열 인덱스로 사용
        // score가 0이면 gameover-01 (인덱스 0), score가 1이면 gameover-02 (인덱스 1), ...
        const clampedIndex = Phaser.Math.Clamp(score, 0, this.GAME_OVER_SCENES.length - 1)
        const targetScene = this.GAME_OVER_SCENES[clampedIndex]
        console.log('resolveGameOverScene - clampedIndex:', clampedIndex, 'targetScene:', targetScene)
        return targetScene
    }

    spawnQuizPlatforms() {
        const cam = this.cameras.main
        const targetY = cam.scrollY + this.QUIZ_PLATFORM_Y_OFFSET

        // 주변 플랫폼과의 거리를 계산해서 적절한 위치 찾기
        let bestY = targetY
        const platforms = this.platforms.getChildren()

        if (platforms.length > 0) {
            // 타겟 위치 근처의 플랫폼들 찾기
            let nearestPlatformBelow = null
            let nearestPlatformAbove = null
            let minDistanceBelow = Infinity
            let minDistanceAbove = Infinity

            for (const platform of platforms) {
                const platformTop = platform.y - ((platform.body && (platform.body.halfHeight || platform.body.height / 2)) || (platform.displayHeight / 2))
                const distance = targetY - platformTop

                if (distance > 0 && distance < minDistanceBelow) {
                    // 타겟 위치 아래에 있는 플랫폼 (더 가까운 것)
                    minDistanceBelow = distance
                    nearestPlatformBelow = platform
                } else if (distance < 0 && Math.abs(distance) < minDistanceAbove) {
                    // 타겟 위치 위에 있는 플랫폼 (더 가까운 것)
                    minDistanceAbove = Math.abs(distance)
                    nearestPlatformAbove = platform
                }
            }

            // 적절한 위치 계산
            if (nearestPlatformBelow) {
                const platformTopY = nearestPlatformBelow.y - ((nearestPlatformBelow.body && (nearestPlatformBelow.body.halfHeight || nearestPlatformBelow.body.height / 2)) || (nearestPlatformBelow.displayHeight / 2))
                // 아래 플랫폼에서 PLATFORM_SPACING_HEIGHT만큼 위에 배치
                bestY = platformTopY - this.PLATFORM_SPACING_HEIGHT
            } else if (nearestPlatformAbove) {
                const platformTopY = nearestPlatformAbove.y - ((nearestPlatformAbove.body && (nearestPlatformAbove.body.halfHeight || nearestPlatformAbove.body.height / 2)) || (nearestPlatformAbove.displayHeight / 2))
                // 위 플랫폼에서 PLATFORM_SPACING_HEIGHT만큼 아래에 배치
                bestY = platformTopY + this.PLATFORM_SPACING_HEIGHT
            }

            // 타겟 Y 위치와 계산된 위치 중 더 적절한 것 선택 (너무 멀리 벗어나지 않도록)
            const yDiff = Math.abs(bestY - targetY)
            if (yDiff > this.PLATFORM_SPACING_HEIGHT * 2) {
                // 계산된 위치가 너무 멀면 타겟 위치 사용
                bestY = targetY
            }
        }

        const y = bestY
        const leftX = this.QUIZ_PLATFORM_LEFT_X
        const rightX = this.QUIZ_PLATFORM_RIGHT_X

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const aPlatform = this.quizPlatforms.create(leftX, y, 'platform-01')
        aPlatform.setScale(this.PLATFORM_SCALE)
        aPlatform.setData('choice', 'A')
        aPlatform.setDepth(8) // 캐릭터보다 뒤에 배치
        aPlatform.body.updateFromGameObject()

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const bPlatform = this.quizPlatforms.create(rightX, y, 'platform-02')
        bPlatform.setScale(this.PLATFORM_SCALE)
        bPlatform.setData('choice', 'B')
        bPlatform.setDepth(8) // 캐릭터보다 뒤에 배치
        bPlatform.body.updateFromGameObject()

        // 퀴즈 플랫폼의 중심과 반높이 저장 (양쪽 플랫폼은 동일 스케일/텍스처 가정)
        this.quizCenterY = y
        this.quizPlatformHalfHeight = (aPlatform.body && (aPlatform.body.halfHeight || aPlatform.body.height / 2)) || (aPlatform.displayHeight / 2)

        const letterStyle = { color: '#000', fontSize: this.UI_LABEL_FONT_SIZE, fontStyle: 'bold', fontFamily: 'NanumSquareNeoOTF-Hv', align: 'center', backgroundColor: '#ffffffbb', padding: { x: 6, y: 4 } }
        const labelStyle = { color: '#000', fontSize: this.UI_LABEL_FONT_SIZE, fontStyle: 'bold', fontFamily: 'NanumSquareNeoOTF-Bd', align: 'center', backgroundColor: '#ffffffbb', padding: { x: 6, y: 4 } }
        // 현재 퀴즈의 선택지 텍스트를 각 플랫폼 위에 표시
        const currentQuiz = this.quizzes[this.currentQuizIndex]

        // A 라벨: 'A'는 Hv 폰트, 선택지 내용은 Bd 폰트
        const aLetterLabel = this.add.text(aPlatform.x, aPlatform.y - 120, 'A', letterStyle).setOrigin(0.5, 0).setDepth(9)
        const aTextLabel = this.add.text(aPlatform.x, aPlatform.y - 10, currentQuiz.a, labelStyle).setOrigin(0.5, 0).setDepth(9).setLineSpacing(15)
        aPlatform.setData('letterLabel', aLetterLabel)
        aPlatform.setData('textLabel', aTextLabel)

        // B 라벨: 'B'는 Hv 폰트, 선택지 내용은 Bd 폰트
        const bLetterLabel = this.add.text(bPlatform.x, bPlatform.y - 120, 'B', letterStyle).setOrigin(0.5, 0).setDepth(9)
        const bTextLabel = this.add.text(bPlatform.x, bPlatform.y - 10, currentQuiz.b, labelStyle).setOrigin(0.5, 0).setDepth(9).setLineSpacing(15)
        bPlatform.setData('letterLabel', bLetterLabel)
        bPlatform.setData('textLabel', bTextLabel)

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

    findBottomMostPlatform() {
        const platforms = this.platforms.getChildren()
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
