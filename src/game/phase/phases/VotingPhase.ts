import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";

export class VotingPhase extends Phase {

    public getPhaseType(): PhaseType {
        return PhaseType.VOTING;
    }

    public onStart(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.teleportToVotingArea();
        }
    }
}
