import type { PlayerSession } from "../../../player/PlayerSession";
import { COUNTDOWN_START_GAME, MINIMUM_PLAYERS_TO_START_GAME } from "../../../utils/config";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { InProgressPhase } from "./InProgressPhase";
import { WaitingForPlayersPhase } from "./WaitingForPlayersPhase";

export class CountdownPhase extends Phase {

    private _countdown: number;

    constructor(game: Game) {
        super(game);
        this._countdown = COUNTDOWN_START_GAME;
    }

    public getPhaseType(): PhaseType {
        return PhaseType.COUNTDOWN;
    }

    public handleHeartbeat(): void {
        if (this._countdown > 0) {
            this._countdown--;

            for (const playerSession of this._game.getPlayerSessions()) {
                playerSession.title(this._countdown.toString());
            }
        } else {
            this._game.setPhase(new InProgressPhase(this._game));
        }
    }

    public handleLeave(playerSession: PlayerSession): void {
        if (this._game.getPlayerSessions().length < MINIMUM_PLAYERS_TO_START_GAME) {
            this._game.setPhase(new WaitingForPlayersPhase(this._game));
        }
    }

}