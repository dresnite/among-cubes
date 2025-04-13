import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { PlayerRole } from "../../../player/PlayerRole";
import { Message } from "../../../messages/Message";

export class InProgressPhase extends Phase {

    getPhaseType(): PhaseType {
        return PhaseType.IN_PROGRESS;
    }

    handlePhaseStart(): void {
        const playerSessions = this.game.getPlayerSessions();
        const randomIndex = Math.floor(Math.random() * playerSessions.length);

        playerSessions.forEach((playerSession, index) => {
            if (index === randomIndex) {
                playerSession.setRole(PlayerRole.IMPOSTOR);
                playerSession.achievement(
                    Message.t('YOU_ARE_IMPOSTOR'), 
                    Message.t('YOU_ARE_IMPOSTOR_SUBTITLE'), 
                    'impostor.png',
                    5000
                );
                playerSession.message(Message.t('YOU_ARE_IMPOSTOR_CHAT'));
            } else {
                playerSession.setRole(PlayerRole.CREW); 
                playerSession.achievement(
                    Message.t('YOU_ARE_CREW'), 
                    Message.t('YOU_ARE_CREW_SUBTITLE'), 
                    'crew.png',
                    5000
                );
                playerSession.message(Message.t('YOU_ARE_CREW_CHAT'));
            }
        });
    }

    handleHeartbeat(): void {
        // TODO: Implement heartbeat for in progress phase
    }

}