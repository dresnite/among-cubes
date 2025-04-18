import { Main } from "../main";
import { Message } from "../messages/Message";
import type { PlayerSession } from "../player/PlayerSession";
import { Game } from "./Game";
import { EmergencyMeetingPhase } from "./phase/phases/EmergencyMeetingPhase";

export class GameManager {

    private _game: Game;

    constructor() {
        this._game = new Game();
    }

    public getGame(): Game {
        return this._game;
    }

    public assignPlayerSessionToGame(playerSession: PlayerSession): void {
        if (!this._game.canBeJoined()) {
            return;
        }

        this._game.addPlayer(playerSession);
    }

    public onHeartbeat(): void {
        this._game.getPhase().onHeartbeat();

        for (const playerSession of Main.getInstance().getPlayerSessionManager().getSessions().values()) {
            if (!this._game.isBeingPlayed() || !(playerSession.getGame()?.getPhase() instanceof EmergencyMeetingPhase)) {
                playerSession.silence();
            }

            if (!playerSession.getGame()) {
                playerSession.popup(
                    Message.t('WAITING_FOR_GAME_TO_END'),
                    this._game.isBeingPlayed() ? Message.t('WAITING_FOR_GAME_TO_END_SUBTITLE') : null
                );
            }

            playerSession.getSpectatorModeManager().hearbeat()
        }
    }

}