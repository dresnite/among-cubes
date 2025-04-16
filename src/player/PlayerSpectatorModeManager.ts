import { ColorType } from "../game/color/ColorType"
import { EmergencyMeetingPhase } from "../game/phase/phases/EmergencyMeetingPhase"
import { InProgressPhase } from "../game/phase/phases/InProgressPhase"
import { Main } from "../Main"
import { Message } from "../messages/Message"
import type { PlayerSession } from "./PlayerSession"

export class PlayerSpectatorModeManager {
    
    /**
     * The session of the player who is spectating
     */
    private _session: PlayerSession

    /**
     * The session of the player who is being spectated
     */
    private _spectating: PlayerSession | null

    constructor(session: PlayerSession) {
        this._session = session
        this._spectating = null
    }

    /**
     * Gets the session of the player who is spectating
     * @returns The session of the player who is spectating
     */
    public getSession(): PlayerSession {
        return this._session
    }

    /**
     * Checks if the player is spectating
     * @returns true if the player is spectating, false otherwise
     */
    public isSpectating(): boolean {
        return this._spectating !== null
    }

    /**
     * Gets the session of the player who is being spectated
     * @returns The session of the player who is being spectated
     */
    public getSpectating(): PlayerSession | null {
        return this._spectating
    }

    /**
     * Spectates a player
     * @param session - The session of the player to spectate
     */
    public spectate(session: PlayerSession): void {
        this._spectating = session
        this._session.setupCamera()

        console.log('Spectating ' + session.getPlayer().username)
    }

    /**
     * Stops spectating
     */
    public stopSpectating(): void {
        this._spectating = null
        this._session.setupCamera()
    }

    /**
     * Spectates the next player or the first player if there is no one being spectated
     */
    public spectateRandomPlayer(): void {
        const game = Main.getInstance().getGameManager().getGame()

        const playerSessions = game.getPlayerSessions().sort(() => Math.random() - 0.5)
        const nextPlayerSession = playerSessions.find(session => session.getPlayer().username !== this._session.getPlayer().username && session.getColor() !== this._spectating?.getColor())

        if(!nextPlayerSession) {
            return
        }

        this.spectate(nextPlayerSession)
    }

    public hearbeat(): void {
        if(!this._spectating) {
            return
        }

        // Stop spectating if the game is not running
        const game = Main.getInstance().getGameManager().getGame()
        if (!game.isBeingPlayed()) {
            this.stopSpectating()
            this._session.message(Message.t('SPECTATOR_MODE_GAME_ENDED'))
            return
        }

        if(!this._spectating.isOnline()) {
            this.stopSpectating()
            this._session.message(Message.t('SPECTATOR_MODE_DISCONNECTED'))
            return
        }

        this._session.popup(
            Message.t('SPECTATOR_MODE_TITLE'), 
            Message.t('SPECTATOR_MODE_SUBTITLE')
        )
    }

}