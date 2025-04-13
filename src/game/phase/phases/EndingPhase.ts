import { Main } from "../../../Main";
import { Message } from "../../../messages/Message";
import { PlayerRole } from "../../../player/PlayerRole";
import { ENDING_GAME_DURATION } from "../../../utils/config";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { WaitingForPlayersPhase } from "./WaitingForPlayersPhase";

export class EndingPhase extends Phase {

    private _timeToEnd: number;
    private _isCrewWin: boolean;

    constructor(game: Game, isCrewWin: boolean) {
        super(game);
        this._timeToEnd = ENDING_GAME_DURATION;
        this._isCrewWin = isCrewWin;
    }

    public getPhaseType(): PhaseType {
        return PhaseType.ENDING;
    }

    public onStart(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.teleportToWaitingRoom();
        }
    }

    public onHeartbeat(): void {
        this._timeToEnd--;

        if (this._timeToEnd <= 0) {
            for (const playerSession of this._game.getPlayerSessions()) {
                this._game.removePlayer(playerSession);
                Main.getInstance().getGameManager().assignPlayerSessionToGame(playerSession);
            }

            this._game.setPhase(new WaitingForPlayersPhase(this._game));
            return
        }

        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.popup(
                Message.t('NEXT_GAME_STARTING_COUNTDOWN', {
                    countdown: this._timeToEnd.toString()
                })
            );

            const isWinner = playerSession.getRole() === PlayerRole.CREW && this._isCrewWin || playerSession.getRole() === PlayerRole.IMPOSTOR && !this._isCrewWin;

            playerSession.achievement(
                Message.t(this._isCrewWin ? 'CREW_WON' : 'IMPOSTOR_WON'),
                Message.t(isWinner ? 'CONGRATULATIONS_ON_WIN' : 'TRY_HARDER_NEXT_TIME'),
                'cup.png',
                1000
            )
        }
    }
    
}