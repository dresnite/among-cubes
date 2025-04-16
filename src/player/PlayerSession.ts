import type { Player } from "hytopia";
import type { Color } from "../game/color/Color";
import type { Game } from "../game/Game";
import { Entity, PlayerCameraMode, PlayerEntity, BaseEntityControllerEvent, Audio } from "hytopia";
import { PlayerRole } from "./PlayerRole";
import { Main } from "../Main";
import { Message } from "../messages/Message";
import { COMPUTER_ENTITY_NAME, EMERGENCY_BUTTON_ENTITY_NAME, KNIFE_USE_COOLDOWN, SECURITY_CAMERA_COST, SKIP_VOTE_ENTITY_NAME } from "../utils/config";
import { EmergencyMeetingPhase } from "../game/phase/phases/EmergencyMeetingPhase";
import { InProgressPhase } from "../game/phase/phases/InProgressPhase";
import { PlayerExperienceManager } from "./PlayerExperienceManager";

/**
 * Manages a player's session in the game, handling their state, interactions, and UI elements.
 * This class is responsible for managing player-specific data and functionality including:
 * - Player role (Impostor/Crew)
 * - Player color and appearance
 * - Weapon handling (knife for Impostors)
 * - Camera and movement controls
 * - UI interactions and feedback
 * - Game-specific actions (voting, emergency meetings, etc.)
 */
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
    private _experienceManager: PlayerExperienceManager
    private _usingSecurityCamera: boolean
    private _isOnline: boolean

    /**
     * Creates a new PlayerSession instance.
     * @param player - The Hytopia Player instance to associate with this session
     */
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
        this._experienceManager = new PlayerExperienceManager(this)
        this._usingSecurityCamera = false
        this._isOnline = true
    }

    /**
     * Gets the Hytopia Player instance associated with this session.
     * @returns The Player instance
     */
    public getPlayer(): Player {
        return this._player
    }

    /**
     * Gets the current game instance this player is participating in.
     * @returns The current Game instance or null if not in a game
     */
    public getGame(): Game | null {
        return this._game
    }

    /**
     * Sets the game instance for this player session.
     * @param game - The Game instance to associate with this session, or null to clear
     */
    public setGame(game: Game | null) {
        this._game = game
    }

    /**
     * Gets the player's current color.
     * @returns The current Color instance or null if not set
     */
    public getColor(): Color | null {
        return this._color
    }

    /**
     * Sets the player's color.
     * @param color - The Color instance to set, or null to clear
     */
    public setColor(color: Color | null) {
        this._color = color
    }

    /**
     * Gets the player's current role (Impostor/Crew).
     * @returns The current PlayerRole or null if not assigned
     */
    public getRole(): PlayerRole | null {
        return this._role
    }

    /**
     * Sets the player's role.
     * @param role - The PlayerRole to assign, or null to clear
     */
    public setRole(role: PlayerRole | null) {
        this._role = role
    }

    /**
     * Gets the player's entity instance in the game world.
     * @returns The PlayerEntity instance or null if not spawned
     */
    public getPlayerEntity(): PlayerEntity | null {
        return this._playerEntity
    }

    /**
     * Gets the player's experience manager.
     * @returns The PlayerExperienceManager instance
     */
    public getExperienceManager(): PlayerExperienceManager {
        return this._experienceManager
    }

    /**
     * Gets the player's current coin count.
     * @returns The number of coins
     */
    public getCoins(): number {
        return this._coins
    }

    /**
     * Adds a coin to the player's balance and plays coin collection animation/sound.
     */
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

    /**
     * Attempts to spend coins from the player's balance.
     * @param coins - The number of coins to spend
     * @returns true if the transaction was successful, false if insufficient funds
     */
    public useCoins(coins: number): boolean {
        if (this._coins >= coins) {
            this._coins -= coins
            return true
        }

        return false
    }

    /**
     * Resets the player's coin balance to zero.
     */
    public resetCoins(): void {
        this._coins = 0
    }

    /**
     * Resets all player session data to default values.
     * This includes game, color, role, knife state, and coins.
     */
    public reset(): void {
        this.setGame(null)
        this.setColor(null)
        this.setRole(PlayerRole.CREW)
        this.setKnifeVisible(false)
        this.setKnifeUseCooldown(0)
        this.setHasPressedEmergencyButton(false)
        this.resetCoins()
    }

    /**
     * Checks if the knife is currently visible.
     * @returns true if the knife is visible, false otherwise
     */
    public getKnifeVisible(): boolean {
        return this._knifeVisible
    }

    /**
     * Sets the visibility state of the knife.
     * @param visible - Whether the knife should be visible
     */
    public setKnifeVisible(visible: boolean) {
        this._knifeVisible = visible
    }

    /**
     * Gets the current knife use cooldown time.
     * @returns The remaining cooldown time
     */
    public getKnifeUseCooldown(): number {
        return this._knifeUseCooldown
    }

    /**
     * Sets the knife use cooldown time.
     * @param cooldown - The cooldown time to set
     */
    public setKnifeUseCooldown(cooldown: number): void {
        this._knifeUseCooldown = cooldown
    }

    /**
     * Checks if the player has pressed the emergency button.
     * @returns true if the emergency button has been pressed, false otherwise
     */
    public hasPressedEmergencyButton(): boolean {
        return this._hasPressedEmergencyButton
    }

    /**
     * Sets whether the player has pressed the emergency button.
     * @param hasPressed - The state to set
     */
    public setHasPressedEmergencyButton(hasPressed: boolean): void {
        this._hasPressedEmergencyButton = hasPressed
    }

    /**
     * Checks if the player is currently using a security camera.
     * @returns true if using security camera, false otherwise
     */
    public isUsingSecurityCamera(): boolean {
        return this._usingSecurityCamera
    }

    /**
     * Sets whether the player is using a security camera.
     * @param usingSecurityCamera - The state to set
     */
    public setUsingSecurityCamera(usingSecurityCamera: boolean): void {
        this._usingSecurityCamera = usingSecurityCamera
    }

    /**
     * Checks if the player is online.
     * @returns true if the player is online, false otherwise
     */
    public isOnline(): boolean {
        return this._isOnline
    }

    public setIsOnline(isOnline: boolean): void {
        this._isOnline = isOnline
    }

    /**
     * Sets up the player's camera based on their current state.
     * Handles both security camera view and first-person view.
     */
    public setupCamera(): void {
        if (this._usingSecurityCamera) {
            this._player.camera.setAttachedToEntity(Main.getInstance().getCameraEntity()!);
            this._player.camera.setForwardOffset(1);
        } else {
            this._player.camera.setAttachedToEntity(this._playerEntity!);
            // Setup a first person camera for the player
            // set first person mode
            this._player.camera.setMode(PlayerCameraMode.FIRST_PERSON);
            // shift camrea up on Y axis so we see from "head" perspective.
            this._player.camera.setOffset({ x: 0, y: 0.4, z: 0 });
            // hide the head node from the model so we don't see it in the camera, this is just hidden for the controlling player.
            this._player.camera.setModelHiddenNodes(['head', 'neck', 'torso']);
            this._player.camera.setForwardOffset(0);
        }
    }

    /**
     * Sets up the player's entity in the game world.
     * This includes spawning the player model, knife, and setting up event handlers.
     */
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
        this.setupCamera();

        //this.teleportToVotingArea();
    }

    /**
     * Sets up event handlers for the player entity.
     * Handles input events for knife usage, voting, emergency meetings, and more.
     * @param playerEntity - The PlayerEntity to set up events for
     */
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
                if (this._usingSecurityCamera) {
                    this._usingSecurityCamera = false;
                    this.setupCamera();
                }

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
                        case COMPUTER_ENTITY_NAME:
                            if (phase instanceof InProgressPhase) {
                                if (this.useCoins(SECURITY_CAMERA_COST)) {
                                    this.setUsingSecurityCamera(true);
                                    this.setupCamera();
                                } else {
                                    this.popup(Message.t('SECURITY_CAMERA_NO_COINS', {
                                        cost: SECURITY_CAMERA_COST.toString()
                                    }));
                                }
                            }
                            break;
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

                                const teleportStation = main.getTeleportStationManager().getStation(entityName);

                                if (teleportStation) {
                                    teleportStation.use(this);
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

    /**
     * Updates the knife visibility state in the game world.
     */
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

    /**
     * Sends a chat message to the player.
     * @param message - The message to send
     */
    public message(message: string): void {
        Main.getInstance().getWorldOrThrow().chatManager.sendPlayerMessage(this._player, message);
    }

    /**
     * Shows a popup message to the player.
     * @param message - The message to show
     * @param subtitle - The subtitle to show
     * @param milliseconds - Duration to show the message (default: 1000ms)
     */
    public popup(message: string, subtitle: string | null = null, milliseconds: number = 1000): void {
        this._player.ui.sendData({
            popup: {
                title: message,
                subtitle: subtitle,
                milliseconds: milliseconds
            }
        })
    }

    /**
     * Shows an achievement notification to the player.
     * @param title - The achievement title
     * @param subtitle - The achievement subtitle
     * @param icon - The icon to display
     * @param milliseconds - Duration to show the achievement (default: 1000ms)
     */
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

    /**
     * Shows a title message to the player.
     * @param title - The title to show
     * @param milliseconds - Duration to show the title (default: 1000ms)
     */
    public title(title: string, milliseconds: number = 1000): void {
        this._player.ui.sendData({
            title: title,
            titleDuration: milliseconds
        })
    }

    /**
     * Updates the status bar UI with coins and optional time information.
     * @param options - Object containing coins, optional time, and duration
     */
    public statusBar({ coins, time, milliseconds }: { coins: number, time?: string, milliseconds: number }): void {
        this._player.ui.sendData({
            statusBar: {
                coins,
                time,
                milliseconds
            }
        })
    }

    /**
     * Shows the role bar UI with role information and optional cooldown.
     * @param title - The role title
     * @param subtitle - The role subtitle
     * @param milliseconds - Duration to show the role bar (default: 1000ms)
     * @param cooldown - Optional cooldown duration
     */
    public roleBar(title: string, subtitle: string, milliseconds: number = 1000, cooldown?: number): void {
        this._player.ui.sendData({
            roleBar: {
                role: title,
                subtitle: subtitle,
                cooldown: cooldown,
                milliseconds
            }
        })
    }

    /**
     * Shows a silence indicator UI to the player.
     * @param milliseconds - Duration to show the indicator (default: 1000ms)
     */
    public silence(milliseconds: number = 1000): void {
        this._player.ui.sendData({
            silence: {
                milliseconds
            }
        })
    }

    /**
     * Updates and displays the role bar based on the player's current role and knife cooldown.
     */
    public sendRoleBar(): void {
        const message = this._role === PlayerRole.IMPOSTOR ? 'IMPOSTOR_ROLE_BAR' : 'CREW_ROLE_BAR'

        if (this._role === PlayerRole.IMPOSTOR) {
            const subtitle = this._knifeUseCooldown <= 0 ? Message.t('KNIFE_READY') : Message.t('KNIFE_COOLDOWN', {
                cooldown: this._knifeUseCooldown.toString()
            })

            if (this._knifeUseCooldown === KNIFE_USE_COOLDOWN - 1) {
                this.roleBar(Message.t(message), subtitle, 1000, this._knifeUseCooldown * 1000)
            } else {
                this.roleBar(Message.t(message), subtitle, 1000)
            }
            
        } else {
            this.roleBar(Message.t(message), '', 1000)
        }
    }

    /**
     * Plays the coin collection animation in the UI.
     */
    public coinAnimation(): void {
        this._player.ui.sendData({
            coinAnimation: true
        });
    }

    /**
     * Opens the silence modal UI.
     */
    public openSilenceModal(): void {
        this._player.ui.sendData({
            openSilenceModal: true
        });
    }

    /**
     * Sends the player's current level information to the UI.
     */
    public sendLevelInfo(): void {
        const level = this._experienceManager.getLevel();

        this._player.ui.sendData({
            levelInfo: {
                level,
                currentXp: this._experienceManager.getExperience() - (level === 1 ? 0 : this._experienceManager.getNecessaryExperienceForLevel(level)),
                nextLevelXp: this._experienceManager.getNecessaryExperienceForNextLevel() - this._experienceManager.getNecessaryExperienceForLevel(level) + ((level === 1) ? this._experienceManager.getNecessaryExperienceForLevel(level) : 0)
            }
        })
    }

    /**
     * Teleports the player to the waiting room area.
     */
    public teleportToWaitingRoom(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getWaitingRoomCloseCoords());
    }

    /**
     * Teleports the player to the voting area.
     */
    public teleportToVotingArea(): void {
        this._playerEntity?.setPosition(Main.getInstance().getGameMap().getVotingAreaCloseCoords());
    }

}