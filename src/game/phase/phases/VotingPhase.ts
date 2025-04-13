import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";

export class VotingPhase extends Phase {

    getPhaseType(): PhaseType {
        return PhaseType.VOTING;
    }

    handleStart(): void {
        for (const playerSession of this.game.getPlayerSessions()) {
            playerSession.teleportToVotingArea();
        }
    }
}
