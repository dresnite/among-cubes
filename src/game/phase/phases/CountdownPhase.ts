import type { PlayerSession } from "../../../player/PlayerSession";
import { MINIMUM_PLAYERS_TO_START_GAME } from "../../../utils/config";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { InProgressPhase } from "./InProgressPhase";
import { WaitingForPlayersPhase } from "./WaitingForPlayersPhase";

export class CountdownPhase extends Phase {

    countdown: number;

    constructor(game: Game) {
        super(game);
        this.countdown = 10;
    }

    getPhaseType(): PhaseType {
        return PhaseType.COUNTDOWN;
    }

    handleHeartbeat(): void {
        if (this.countdown > 0) {
            this.countdown--;

            for (const playerSession of this.game.getPlayerSessions()) {
                playerSession.title(this.countdown.toString());
            }
        } else {
            this.game.setPhase(new InProgressPhase(this.game));
        }
    }

    handleLeave(playerSession: PlayerSession): void {
        if (this.game.getPlayerSessions().length < MINIMUM_PLAYERS_TO_START_GAME) {
            this.game.setPhase(new WaitingForPlayersPhase(this.game));
        }
    }

}