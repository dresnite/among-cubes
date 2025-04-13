import type { Player } from "hytopia";
import type { Color } from "../game/color/Color";
import type { Game } from "../game/Game";
import { Entity, PlayerCameraMode, PlayerEntity, BaseEntityControllerEvent } from "hytopia";
import { PlayerRole } from "./PlayerRole";
import { Main } from "../main";

export class PlayerSession {

    player: Player
    game: Game | null
    color: Color | null
    role: PlayerRole | null
    knife: Entity | null
    knifeVisible: boolean

    constructor(player: Player) {
        this.player = player
        this.game = null
        this.color = null
        this.role = null
        this.knife = null
        this.knifeVisible = false
    }

    getPlayer(): Player {
        return this.player
    }

    getGame(): Game | null {
        return this.game
    }

    setGame(game: Game | null) {
        this.game = game
    }

    getColor(): Color | null {
        return this.color
    }

    setColor(color: Color | null) {
        this.color = color
    }

    getRole(): PlayerRole | null {
        return this.role
    }

    setRole(role: PlayerRole | null) {
        this.role = role
    }

    reset() {
        this.setGame(null)
        this.setColor(null)
    }

    setupCamera() {
        // Setup a first person camera for the player
        // set first person mode
        this.player.camera.setMode(PlayerCameraMode.FIRST_PERSON);
        // shift camrea up on Y axis so we see from "head" perspective.
        this.player.camera.setOffset({ x: 0, y: 0.4, z: 0 });
        // hide the head node from the model so we don't see it in the camera, this is just hidden for the controlling player.
        this.player.camera.setModelHiddenNodes(['head', 'neck']);
        // Shift the camera forward so we are looking slightly in front of where the player is looking.
        this.player.camera.setForwardOffset(0.3);
    }

    setupEntity() {
        const world = Main.getInstance().getWorldOrThrow();
        const playerEntities = world.entityManager.getPlayerEntitiesByPlayer(this.player);

        const coords = { x: 0, y: 10, z: 0 };
        let playerEntity: PlayerEntity;
        if (playerEntities.length === 0) {
            playerEntity = new PlayerEntity({
                player: this.player,
                name: 'Player',
                modelUri: this.color!.getSkinPath(),
                modelLoopedAnimations: ['idle'],
                modelScale: 0.5,
            });
            playerEntity.spawn(world, coords);

            this.knife = new Entity({
                name: 'sword',
                modelUri: 'models/items/sword.gltf',
                parent: playerEntity,
                parentNodeName: 'hand_right_anchor', // attach it to the hand node of our parent model
            });
            
            // Initially hide the knife
            this.knifeVisible = false;
            this.setupKnifeVisibility();

            this.setupPlayerEvents(playerEntity)
        } else {
            playerEntity = playerEntities[0]!;
        }
    }

    setupPlayerEvents(playerEntity: PlayerEntity) {
        playerEntity.controller?.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, ({ input }) => {
            if (input.f) {
                // Only allow toggling knife visibility for impostors
                if (this.role === PlayerRole.IMPOSTOR) {
                    this.knifeVisible = !this.knifeVisible;
                    this.setupKnifeVisibility();
                }

                input.f = false; // Consume the input
            }
        });
    }

    setupKnifeVisibility() {
        if (!this.knife) {
            return;
        }

        if (this.knifeVisible && !this.knife.isSpawned) {
            this.knife.spawn(
                Main.getInstance().getWorldOrThrow(),
                { x: 0, y: 0.3, z: 0.5 }, // spawn with a position relative to the parent node
                { x: -Math.PI / 3, y: 0, z: 0, w: 1 } // spawn with a rotation
            );
        } else if (!this.knifeVisible && this.knife.isSpawned) {
            this.knife.despawn();
        }
    }

    message(message: string) {
        Main.getInstance().getWorldOrThrow().chatManager.sendPlayerMessage(this.player, message);
    }

    popup(message: string, milliseconds: number = 1000) {
        this.player.ui.sendData({
            popup: message,
            popupMilliseconds: milliseconds
        })
    }

    achievement(title: string, subtitle: string, icon: string, milliseconds: number = 1000) {
        this.player.ui.sendData({
            achievement: {
                title: title,
                subtitle: subtitle,
                icon: icon,
                duration: milliseconds
            }
        })
    }

    title(title: string, milliseconds: number = 1000) {
        this.player.ui.sendData({
            title: title,
            titleDuration: milliseconds
        })
    }

}