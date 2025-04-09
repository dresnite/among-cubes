import type { Player } from "hytopia";

export class PlayerSession {

    player: Player

    constructor(player: Player) {
        this.player = player
    }

    getPlayer() {
        return this.player
    }

}