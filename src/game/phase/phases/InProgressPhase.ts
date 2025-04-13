import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { PlayerRole } from "../../../player/PlayerRole";
import { Message } from "../../../messages/Message";
import { Main } from "../../../main";

export class InProgressPhase extends Phase {

    getPhaseType(): PhaseType {
        return PhaseType.IN_PROGRESS;
    }

    handlePhaseStart(): void {
        const playerSessions = this.game.getPlayerSessions();
        const randomIndex = Math.floor(Math.random() * playerSessions.length);

        // Calculate circle parameters so the players can spawn around the circle
        const radius = 5; // 5 units radius for the circle
        const centerPoint = Main.getInstance().getGameMap().getMapSpawnCoords();
        const angleStep = (2 * Math.PI) / playerSessions.length;

        playerSessions.forEach((playerSession, index) => {
            // Calculate position on the circle for the player
            const angle = angleStep * index;
            const position = {
                x: centerPoint.x + radius * Math.cos(angle),
                y: centerPoint.y,
                z: centerPoint.z + radius * Math.sin(angle)
            };

            // Set player position
            playerSession.getPlayerEntity()?.setPosition(position);

            // Set player role and show appropriate message
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

            // Make players face the center
            //playerSession.getPlayer().camera.lookAtPosition(centerPoint);
        });
    }

    handleHeartbeat(): void {
        // TODO: Implement heartbeat for in progress phase
    }

}