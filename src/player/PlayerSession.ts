import type { Player } from "hytopia";
import type { Color } from "../game/color/Color";
import type { Game } from "../game/Game";

export class PlayerSession {

    player: Player
    game: Game|null
    color: Color|null

    constructor(player: Player) {
        this.player = player
        this.game = null
        this.color = null
    }

    getPlayer(): Player {
        return this.player
    }

    getGame(): Game|null {
        return this.game
    }

    setGame(game: Game|null) {
        this.game = game
    }

    getColor(): Color|null {
        return this.color
    }

    setColor(color: Color | null) {
        this.color = color
    }

    reset() {
        this.setGame(null)
        this.setColor(null)
    }

    popup(message: string, milliseconds: number = 1000) {
        this.player.ui.sendData({
            popup: message,
            popupMilliseconds: milliseconds
        })
    }

}