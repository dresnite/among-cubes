import { Message } from "../../../messages/Message";
import { ColorType } from "../../color/ColorType";
import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";

export class WaitingForPlayersPhase extends Phase {

    getPhaseType(): PhaseType {
        return PhaseType.WAITING_FOR_PLAYERS;
    }

    handleHeartbeat(): void {
        for (const playerSession of this.game.getPlayerSessions()) {
            playerSession.popup(Message.t('WAITING_FOR_PLAYERS', {
                playerCount: this.game.getPlayerSessions().length.toString(),
                maxPlayers: Object.keys(ColorType).length.toString()
            }), 10000);
        }
    }

}