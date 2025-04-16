import type { Player } from "hytopia";
import { PlayerSession } from "./PlayerSession";

export class PlayerSessionManager {

    private _sessions = new Map<string, PlayerSession>()

    public getSessions(): Map<string, PlayerSession> {
        return this._sessions
    }

    public getSession(player: Player): PlayerSession|null {
        return this._sessions.get(player.username) ?? null
    }

    public getSessionOrThrow(player: Player): PlayerSession {
        const session = this._sessions.get(player.username)

        if(!session) {
            throw new Error(`Couldn't retrieve the session of ${player.username}`)
        }

        return session
    }

    public openSession(player: Player): PlayerSession {
        const session = new PlayerSession(player)
        this._sessions.set(player.username, session)
        return session
    }

    public closeSession(player: Player) {
        const session = this._sessions.get(player.username)

        if(session) {
            session.setIsOnline(false)
            this._sessions.delete(player.username)
        } else {
            throw new Error(`Couldn't close the session of ${player.username}`)
        }
    }

}