import { Phase } from "../Phase";
import { PhaseType } from "../PhaseType";
import { PlayerRole } from "../../../player/PlayerRole";
import { Message } from "../../../messages/Message";
import { Main } from "../../../Main";
import type { PlayerSession } from "../../../player/PlayerSession";
import { KNIFE_USE_COOLDOWN } from "../../../utils/config";
import { EmergencyMeetingPhase } from "./EmergencyMeetingPhase";
import type { Game } from "../../Game";
import { Entity, RigidBodyType } from "hytopia";
import { createUniqueId } from "../../../utils/math";
import { CadaverManager } from "../../cadaver/CadaverManager";

export class InProgressPhase extends Phase {

    private _firstTimeUsedThisGame: boolean;
    private _cadaverManager: CadaverManager;

    constructor(game: Game, firstTimeUsedThisGame: boolean = true) {
        super(game);

        this._firstTimeUsedThisGame = firstTimeUsedThisGame;
        this._cadaverManager = new CadaverManager();
    }

    public getPhaseType(): PhaseType {
        return PhaseType.IN_PROGRESS;
    }

    public getCadaverManager(): CadaverManager {
        return this._cadaverManager;
    }

    public onStart(): void {
        const playerSessions = this._game.getPlayerSessions();
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


            if (!this._firstTimeUsedThisGame) {
                return;
            }

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

        this._game.checkIfGameShouldEnd();
    }

    public onHeartbeat(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.setKnifeUseCooldown(playerSession.getKnifeUseCooldown() - 1);
            playerSession.statusBar({
                coins: playerSession.getCoins(),
                milliseconds: 1000
            });

            playerSession.updateRoleBar();
        }
    }

    public onEmergencyButtonPressed(playerSession: PlayerSession): void {
        if (playerSession.hasPressedEmergencyButton()) {
            playerSession.popup(Message.t('EMERGENCY_MEETING_ALREADY_CALLED'), 3000);
        } else {
            playerSession.setHasPressedEmergencyButton(true);
            this._game.setPhase(new EmergencyMeetingPhase(this._game));
        }
    }

    public onDeath(victim: PlayerSession, killer: PlayerSession): void {
        this._cadaverManager.spawnCadaver(victim);

        killer.achievement(
            Message.t('KILLED_PLAYER', { victim: victim.getPlayer().username }),
            Message.t('KILLED_PLAYER_SUBTITLE'),
            'swords.png',
            5000
        );

        victim.title(
            Message.t('YOU_WERE_KILLED', { killer: killer.getPlayer().username }),
            5000
        );

        victim.message(Message.t('YOU_WERE_KILLED_MESSAGE', { killer: killer.getPlayer().username }));
        victim.teleportToWaitingRoom();

        this._game.removePlayer(victim);

        killer.setKnifeUseCooldown(KNIFE_USE_COOLDOWN);

        // Add victim to next game
        Main.getInstance().getGameManager().assignPlayerSessionToGame(victim);
    }

    public onLeave(playerSession: PlayerSession): void {
        this._game.checkIfGameShouldEnd();
    }

    public onChangePhase(): void {
        this._cadaverManager.clearCadavers();
    }

}