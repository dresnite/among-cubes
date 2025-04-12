import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";

export class InProgressPhase extends Phase {

    getPhaseType(): PhaseType {
        return PhaseType.IN_PROGRESS;
    }

    handleHeartbeat(): void {
        // TODO: Implement heartbeat for in progress phase
    }

}