import { Main } from "../../../main";
import { Message } from "../../../messages/Message";
import type { PlayerSession } from "../../../player/PlayerSession";
import { MINIMUM_PLAYERS_TO_START_GAME } from "../../../utils/config";
import type { Game } from "../../Game";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { CountdownPhase } from "./CountdownPhase";
import { InProgressPhase } from "./InProgressPhase";
import { WaitingForPlayersPhase } from "./WaitingForPlayersPhase";

export class MinimumPlayersReachedPhase extends Phase {

    countdown: number;

    constructor(game: Game) {
        super(game);
        this.countdown = this.getCountdownInitialValue();
    }

    getCountdownInitialValue(): number {
        return 20;
    }

    getPhaseType(): PhaseType {
        return PhaseType.MINIMUM_PLAYERS_REACHED;
    }

    handleHeartbeat(): void {
        this.countdown--;

        if (this.countdown > 0) {
            for (const playerSession of this.game.getPlayerSessions()) {
                playerSession.popup(Message.t('MINIMUM_PLAYERS_REACHED_COUNTDOWN', {
                    countdown: this.countdown.toString()
                }));
            }
        } else {
            this.game.setPhase(new CountdownPhase(this.game));
        }
    }

    handleJoin(playerSession: PlayerSession): void {
        this.sendPlayerJoinAchievement(playerSession);

        if (this.game.getAvailableColors().length === 0) {
            this.game.setPhase(new CountdownPhase(this.game));
        }
    }

    handleLeave(playerSession: PlayerSession): void {
        if (this.game.getPlayerSessions().length < MINIMUM_PLAYERS_TO_START_GAME) {
            Main.getInstance().getWorld()?.chatManager.sendBroadcastMessage(Message.t('COULD_NOT_START_WITH_MINIMUM_PLAYERS'))
            this.game.setPhase(new WaitingForPlayersPhase(this.game));
        }
    }
}   