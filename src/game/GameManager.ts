import { Main } from "../Main";
import { Message } from "../messages/Message";
import type { PlayerSession } from "../player/PlayerSession";
import { Game } from "./Game";

export class GameManager {

    private _game: Game;

    constructor() {
        this._game = new Game();
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
            if (!playerSession.getGame()) {
                playerSession.popup(Message.t('WAITING_FOR_GAME_TO_END'));
            }
        }
    }

}