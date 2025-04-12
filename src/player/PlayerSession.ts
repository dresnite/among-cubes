import type { Player } from "hytopia";
import type { Color } from "../game/color/Color";
import type { Game } from "../game/Game";
import { PlayerCameraMode } from "hytopia";

export class PlayerSession {

    player: Player
    game: Game | null
    color: Color | null

    constructor(player: Player) {
        this.player = player
        this.game = null
        this.color = null
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