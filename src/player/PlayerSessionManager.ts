import type { Player } from "hytopia";
import { PlayerSession } from "./PlayerSession";

export class PlayerSessionManager {

    sessions = new Map<string, PlayerSession>()

    getSession(player: Player): PlayerSession|null {
        return this.sessions.get(player.username) ?? null
    }

    getSessionOrThrow(player: Player): PlayerSession {
        const session = this.sessions.get(player.username)

        if(!session) {
            throw new Error(`Couldn't retrieve the session of ${player.username}`)
        }

        return session
    }

    openSession(player: Player): PlayerSession {
        const session = new PlayerSession(player)
        this.sessions.set(player.username, session)
        return session
    }

    closeSession(player: Player) {
        this.sessions.delete(player.username)
    }

}