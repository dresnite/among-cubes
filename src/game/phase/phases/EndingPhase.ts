import { Main } from "../../../main";
import { Message } from "../../../messages/Message";
import { PlayerRole } from "../../../player/PlayerRole";
import { ENDING_GAME_DURATION } from "../../../utils/config";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { WaitingForPlayersPhase } from "./WaitingForPlayersPhase";

export class EndingPhase extends Phase {

    timeToEnd: number;
    isCrewWin: boolean;

    constructor(game: Game, isCrewWin: boolean) {
        super(game);
        this.timeToEnd = ENDING_GAME_DURATION;
        this.isCrewWin = isCrewWin;
    }

    getPhaseType(): PhaseType {
        return PhaseType.ENDING;
    }

    handleStart(): void {
        for (const playerSession of this.game.getPlayerSessions()) {
            playerSession.teleportToWaitingRoom();
        }
    }

    handleHeartbeat(): void {
        this.timeToEnd--;

        if (this.timeToEnd <= 0) {
            for (const playerSession of this.game.getPlayerSessions()) {
                this.game.handlePlayerSessionLeave(playerSession);
                Main.getInstance().getGameManager().assignPlayerSessionToGame(playerSession);
            }

            this.game.setPhase(new WaitingForPlayersPhase(this.game));
            return
        }

        for (const playerSession of this.game.getPlayerSessions()) {
            playerSession.popup(
                Message.t('NEXT_GAME_STARTING_COUNTDOWN', {
                    countdown: this.timeToEnd.toString()
                })
            );

            const isWinner = playerSession.getRole() === PlayerRole.CREW && this.isCrewWin || playerSession.getRole() === PlayerRole.IMPOSTOR && !this.isCrewWin;

            playerSession.achievement(
                Message.t(this.isCrewWin ? 'CREW_WON' : 'IMPOSTOR_WON'),
                Message.t(isWinner ? 'CONGRATULATIONS_ON_WIN' : 'TRY_HARDER_NEXT_TIME'),
                'cup.png',
                1000
            )
        }
    }
    
}