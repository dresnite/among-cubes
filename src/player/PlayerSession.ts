import type { Player } from "hytopia";
import type { Color } from "../game/color/Color";
import type { Game } from "../game/Game";
import { Entity, PlayerCameraMode, PlayerEntity, BaseEntityControllerEvent } from "hytopia";
import { PlayerRole } from "./PlayerRole";
import { Main } from "../Main";
import { Message } from "../messages/Message";

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
    }

    getPlayer(): Player {
        return this._player
    }

    getGame(): Game | null {
        return this._game
    }

    setGame(game: Game | null) {
        this._game = game
    }

    getColor(): Color | null {
        return this._color
    }

    setColor(color: Color | null) {
        this._color = color
    }

    getRole(): PlayerRole | null {
        return this._role
    }

    setRole(role: PlayerRole | null) {
        this._role = role
    }

    getPlayerEntity(): PlayerEntity | null {
        return this._playerEntity
    }

    getCoins(): number {
        return this._coins
    }

    addCoin(): void {
        this._coins++
    }

    resetCoins(): void {
        this._coins = 0
    }

    reset() {
        this.setGame(null)
        this.setColor(null)
        this.setRole(PlayerRole.CREW)
        this.setKnifeVisible(false)
        this.setKnifeUseCooldown(0)
        this.resetCoins()
    }

    getKnifeVisible(): boolean {
        return this._knifeVisible
    }

    setKnifeVisible(visible: boolean) {
        this._knifeVisible = visible
    }

    getKnifeUseCooldown(): number {
        return this._knifeUseCooldown
    }

    setKnifeUseCooldown(cooldown: number) {
        this._knifeUseCooldown = cooldown
    }

    setupCamera() {
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

    setupEntity() {
        const world = Main.getInstance().getWorldOrThrow();
        const playerEntities = world.entityManager.getPlayerEntitiesByPlayer(this._player);

        if (playerEntities.length === 0) {
            this._playerEntity = new PlayerEntity({
                player: this._player,
                name: 'Player',
                modelUri: this._color!.getSkinPath(),
                modelLoopedAnimations: ['idle'],
                modelScale: 0.5,
            });
            this._playerEntity.spawn(
                world, 
                Main.getInstance().getGameMap().getWaitingRoomCloseCoords()
            );

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
        } else {
            this._playerEntity = playerEntities[0]!;
        }
    }

    setupPlayerEvents(playerEntity: PlayerEntity) {
        playerEntity.controller?.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, ({ input }) => {
            if (input.f) {
                // Only allow toggling knife visibility for impostors
                if (this._role === PlayerRole.IMPOSTOR) {
                    this._knifeVisible = !this._knifeVisible;
                    this.setupKnifeVisibility();
                }

                input.f = false; // Consume the input
            }

            // Handle left mouse click for impostor kills
            if (input.ml && this._role === PlayerRole.IMPOSTOR && this._knifeVisible && this._knifeUseCooldown <= 0) {
                // Cast a ray to detect clicked players
                const ray = Main.getInstance().getWorldOrThrow().simulation.raycast(
                    playerEntity.position,
                    this._player.camera.facingDirection,
                    3, // 3-meter range for kills
                    { filterExcludeRigidBody: playerEntity.rawRigidBody }
                );

                if (ray?.hitEntity instanceof PlayerEntity) {
                    const hitPlayer = ray.hitEntity.player;
                    const hitSession = Main.getInstance().getPlayerSessionManager().getSession(hitPlayer);
                    
                    if (this._game && hitSession?._role === PlayerRole.CREW && hitSession.getGame()?.getUniqueId() === this._game.getUniqueId()) {
                        this._game.getPhase().handleDeath(hitSession, this);
                    }
                }

                //do not consume the input, so the player click animation plays
                //input.ml = false;
            }
        });
    }

    setupKnifeVisibility() {
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

    message(message: string) {
        Main.getInstance().getWorldOrThrow().chatManager.sendPlayerMessage(this._player, message);
    }

    popup(message: string, milliseconds: number = 1000) {
        this._player.ui.sendData({
            popup: message,
            popupMilliseconds: milliseconds
        })
    }

    achievement(title: string, subtitle: string, icon: string, milliseconds: number = 1000) {
        this._player.ui.sendData({
            achievement: {
                title: title,
                subtitle: subtitle,
                icon: icon,
                duration: milliseconds
            }
        })
    }

    title(title: string, milliseconds: number = 1000) {
        this._player.ui.sendData({
            title: title,
            titleDuration: milliseconds
        })
    }

    statusBar({ coins, time, milliseconds }: { coins: number, time?: string, milliseconds: number }) {
        this._player.ui.sendData({
            statusBar: {
                coins,
                time,
                milliseconds
            }
        })
    }

    roleBar(roleText: string, milliseconds: number = 1000) {
        this._player.ui.sendData({
            roleBar: {
                role: roleText,
                milliseconds
            }
        })
    }

    sendRole(): void {
        const message = this._role === PlayerRole.IMPOSTOR ? 'IMPOSTOR_ROLE_BAR' : 'CREW_ROLE_BAR'
        this.roleBar(
            Message.t(message, {
                cooldown: (this._knifeUseCooldown > 0) ? ` (${this._knifeUseCooldown.toString()})` : ' (Knife ready)'
            })
        )
    }

    teleportToWaitingRoom(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getWaitingRoomCloseCoords());
    }

    teleportToSpawnCoords(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getMapSpawnCoords());
    }

    teleportToVotingArea(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getVotingAreaCloseCoords());
    }

}