import type { Player } from "hytopia";
import type { Color } from "../game/color/Color";
import type { Game } from "../game/Game";
import { Entity, PlayerCameraMode, PlayerEntity, BaseEntityControllerEvent, Audio } from "hytopia";
import { PlayerRole } from "./PlayerRole";
import { Main } from "../Main";
import { Message } from "../messages/Message";
import { COIN_ENTITY_NAME, EMERGENCY_BUTTON_ENTITY_NAME, SKIP_VOTE_ENTITY_NAME } from "../utils/config";
import { EmergencyMeetingPhase } from "../game/phase/phases/EmergencyMeetingPhase";
import { InProgressPhase } from "../game/phase/phases/InProgressPhase";

export class PlayerSession {

    private _player: Player
    private _game: Game | null
    private _color: Color | null
    private _role: PlayerRole | null
    private _knife: Entity | null
    private _knifeVisible: boolean
    private _knifeUseCooldown: number
    private _playerEntity: PlayerEntity | null
    private _coins: number
    private _hasPressedEmergencyButton: boolean

    constructor(player: Player) {
        this._player = player
        this._game = null
        this._color = null
        this._role = null
        this._knife = null
        this._knifeVisible = false
        this._knifeUseCooldown = 0
        this._playerEntity = null
        this._coins = 0
        this._hasPressedEmergencyButton = false
    }

    public getPlayer(): Player {
        return this._player
    }

    public getGame(): Game | null {
        return this._game
    }

    public setGame(game: Game | null) {
        this._game = game
    }

    public getColor(): Color | null {
        return this._color
    }

    public setColor(color: Color | null) {
        this._color = color
    }

    public getRole(): PlayerRole | null {
        return this._role
    }

    public setRole(role: PlayerRole | null) {
        this._role = role
    }

    public getPlayerEntity(): PlayerEntity | null {
        return this._playerEntity
    }

    public getCoins(): number {
        return this._coins
    }

    public addCoin(): void {
        this._coins++
        this.coinAnimation()
        
        const coinAudio = new Audio({
            uri: 'audio/sfx/misc/coin.mp3',
            volume: 0.1,
            position: this._playerEntity?.position,
        });
        coinAudio.play(Main.getInstance().getWorldOrThrow());
    }

    public resetCoins(): void {
        this._coins = 0
    }

    public reset(): void {
        this.setGame(null)
        this.setColor(null)
        this.setRole(PlayerRole.CREW)
        this.setKnifeVisible(false)
        this.setKnifeUseCooldown(0)
        this.setHasPressedEmergencyButton(false)
        this.resetCoins()
    }

    public getKnifeVisible(): boolean {
        return this._knifeVisible
    }

    public setKnifeVisible(visible: boolean) {
        this._knifeVisible = visible
    }

    public getKnifeUseCooldown(): number {
        return this._knifeUseCooldown
    }

    public setKnifeUseCooldown(cooldown: number): void {
        this._knifeUseCooldown = cooldown
    }

    public hasPressedEmergencyButton(): boolean {
        return this._hasPressedEmergencyButton
    }

    public setHasPressedEmergencyButton(hasPressed: boolean): void {
        this._hasPressedEmergencyButton = hasPressed
    }

    public setupCamera(): void {
        // Setup a first person camera for the player
        // set first person mode
        this._player.camera.setMode(PlayerCameraMode.FIRST_PERSON);
        // shift camrea up on Y axis so we see from "head" perspective.
        this._player.camera.setOffset({ x: 0, y: 0.4, z: 0 });
        // hide the head node from the model so we don't see it in the camera, this is just hidden for the controlling player.
        this._player.camera.setModelHiddenNodes(['head', 'neck', 'torso']);
        // Shift the camera forward so we are looking slightly in front of where the player is looking.
        this._player.camera.setForwardOffset(0);
    }

    public setupEntity(): void {
        const world = Main.getInstance().getWorldOrThrow();

        const spawnPosition = (this._playerEntity) ? this._playerEntity.position : Main.getInstance().getGameMap().getWaitingRoomCloseCoords();

        if (this._playerEntity) {
            this._playerEntity.despawn();
            this._playerEntity = null;
        }

        if (this._knife && this._knife.isSpawned) {
            this._knife.despawn();
            this._knife = null;
        }

        this._playerEntity = new PlayerEntity({
            player: this._player,
            name: 'Player',
            modelUri: this._color?.getSkinPath() ?? 'models/players/player.gltf',
            modelLoopedAnimations: ['idle'],
            modelScale: 0.5,
        });
        this._playerEntity.spawn(world, spawnPosition);

        this._knife = new Entity({
            name: 'sword',
            modelUri: 'models/items/sword.gltf',
            parent: this._playerEntity,
            parentNodeName: 'hand_right_anchor', // attach it to the hand node of our parent model
        });
        
        // Initially hide the knife
        this._knifeVisible = false;
        this.setupKnifeVisibility();
        this.setupPlayerEvents(this._playerEntity)

        this._player.camera.setAttachedToEntity(this._playerEntity);

        //this.teleportToVotingArea();
    }

    public setupPlayerEvents(playerEntity: PlayerEntity): void {
        playerEntity.controller?.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, ({ input }) => {
            if (input.f) {
                // Only allow toggling knife visibility for impostors
                if (this._role === PlayerRole.IMPOSTOR) {
                    this._knifeVisible = !this._knifeVisible;
                    this.setupKnifeVisibility();
                }

                input.f = false; // Consume the input
            }

            // Handle left mouse click for impostor kills and touching NPCs (the emergency button, the voting statues...)
            if (input.ml) {
                const main = Main.getInstance();
                // Cast a ray to detect clicked players
                const ray = main.getWorldOrThrow().simulation.raycast(
                    playerEntity.position,
                    this._player.camera.facingDirection,
                    3, // 3-meter range for kills
                    { filterExcludeRigidBody: playerEntity.rawRigidBody }
                );

                if (this._role === PlayerRole.IMPOSTOR && this._knifeVisible && this._knifeUseCooldown <= 0 && ray?.hitEntity instanceof PlayerEntity) {
                    const hitPlayer = ray.hitEntity.player;
                    const hitSession = main.getPlayerSessionManager().getSession(hitPlayer);
                    
                    if (this._game && hitSession?._role === PlayerRole.CREW && hitSession.getGame()?.getUniqueId() === this._game.getUniqueId()) {
                        this._game.getPhase().onDeath(hitSession, this);
                    }
                } else {
                    const phase = this._game?.getPhase();
                    const entityName = ray?.hitEntity?.name || '';
                    
                    switch (entityName) {
                        case EMERGENCY_BUTTON_ENTITY_NAME:
                            this._game?.getPhase().onEmergencyButtonPressed(this);
                            break;
                        case SKIP_VOTE_ENTITY_NAME:
                            if (phase instanceof EmergencyMeetingPhase) {
                                phase.getPoll().vote(this, 'skip');
                                const voteAudio = new Audio({
                                    uri: 'audio/sfx/misc/spacial-click.mp3',
                                    volume: 0.1,
                                    position: this._playerEntity?.position,
                                });
                                voteAudio.play(Main.getInstance().getWorldOrThrow());
                            }
                            break;
                        default:
                            const voteEntityNameToColorMap = main.getVoteEntitiesManager().getVoteEntitiesNameToColorMap();

                            if (voteEntityNameToColorMap.has(entityName) && phase instanceof EmergencyMeetingPhase) {
                                const color = voteEntityNameToColorMap.get(entityName)!;

                                const isColorAlive = this._game?.getPlayerSessions().some(playerSession => playerSession.getColor()?.getType() === color);

                                if (isColorAlive) {
                                    phase.getPoll().vote(this, color.toString());
                                    const voteAudio = new Audio({
                                        uri: 'audio/sfx/misc/spacial-click.mp3',
                                        volume: 0.1,
                                        position: this._playerEntity?.position,
                                    });
                                    voteAudio.play(Main.getInstance().getWorldOrThrow());
                                }

                                return
                            }

                            if (phase instanceof InProgressPhase) {
                                const cadaverManager = phase.getCadaverManager();
                                const cadaver = cadaverManager.getCadaver(entityName);

                                console.log('cadaver touched by ', this._player.username, ' with entity name ', entityName);


                                if (cadaver) {
                                    cadaver.onTouch(this);
                                } else {
                                    console.log('actually no cadaver found for ', entityName);
                                }
                            }

                            break;
                    }
                }

                //do not consume the input, so the player click animation plays
                //input.ml = false;
            }
        });
    }

    public setupKnifeVisibility(): void {
        if (!this._knife) {
            return;
        }

        if (this._knifeVisible && !this._knife.isSpawned) {
            this._knife.spawn(
                Main.getInstance().getWorldOrThrow(),
                { x: 0, y: 0.3, z: 0.5 }, // spawn with a position relative to the parent node
                { x: -Math.PI / 3, y: 0, z: 0, w: 1 } // spawn with a rotation
            );
        } else if (!this._knifeVisible && this._knife.isSpawned) {
            this._knife.despawn();
        }
    }

    public message(message: string): void {
        Main.getInstance().getWorldOrThrow().chatManager.sendPlayerMessage(this._player, message);
    }

    public popup(message: string, milliseconds: number = 1000): void {
        this._player.ui.sendData({
            popup: message,
            popupMilliseconds: milliseconds
        })
    }

    public achievement(title: string, subtitle: string, icon: string, milliseconds: number = 1000): void {
        this._player.ui.sendData({
            achievement: {
                title: title,
                subtitle: subtitle,
                icon: icon,
                duration: milliseconds
            }
        })
    }

    public title(title: string, milliseconds: number = 1000): void {
        this._player.ui.sendData({
            title: title,
            titleDuration: milliseconds
        })
    }

    public statusBar({ coins, time, milliseconds }: { coins: number, time?: string, milliseconds: number }): void {
        this._player.ui.sendData({
            statusBar: {
                coins,
                time,
                milliseconds
            }
        })
    }

    public roleBar(roleText: string, milliseconds: number = 1000): void {
        this._player.ui.sendData({
            roleBar: {
                role: roleText,
                milliseconds
            }
        })
    }

    public silence(milliseconds: number = 1000): void {
        this._player.ui.sendData({
            silence: {
                milliseconds
            }
        })
    }

    public sendRoleBar(): void {
        const message = this._role === PlayerRole.IMPOSTOR ? 'IMPOSTOR_ROLE_BAR' : 'CREW_ROLE_BAR'
        this.roleBar(
            Message.t(message, {
                cooldown: (this._knifeUseCooldown > 0) ? ` (${this._knifeUseCooldown.toString()})` : ' (Knife ready)'
            })
        )
    }

    public coinAnimation(): void {
        this._player.ui.sendData({
            coinAnimation: true
        });
    }

    public teleportToWaitingRoom(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getWaitingRoomCloseCoords());
    }

    public teleportToSpawnCoords(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getMapSpawnCoords());
    }

    public teleportToVotingArea(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getVotingAreaCloseCoords());
    }

}