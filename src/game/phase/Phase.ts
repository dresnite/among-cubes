import { Main } from "../../main";
import { Message } from "../../messages/Message";
import { PlayerRole } from "../../player/PlayerRole";
import type { PlayerSession } from "../../player/PlayerSession";
import { MINIMUM_PLAYERS_TO_START_GAME } from "../../utils/config";
import type { Game } from "../Game";
import type { PhaseType } from "./PhaseType";

export abstract class Phase {

    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    abstract getPhaseType(): PhaseType;

    handleHeartbeat(): void {
        // do nothing by default
    }

    handleStart(): void {
        // do nothing by default
    }

    handleJoin(playerSession: PlayerSession): void {
        // do nothing by default
    }

    handleLeave(playerSession: PlayerSession): void {
        // do nothing by default
    }

    handleDeath(victim: PlayerSession, killer: PlayerSession): void {
        // do nothing by default
    }

    sendPlayerJoinAchievement(playerSession: PlayerSession): void {
        for (const gamePlayerSession of this.game.getPlayerSessions()) {
            if (gamePlayerSession.getPlayer().username === playerSession.getPlayer().username) {
                continue;
            }

            gamePlayerSession.achievement(
                Message.t('JOINED_GAME', {
                    player: playerSession.getPlayer().username
                }), 
                Message.t('JOINED_GAME_SUBTITLE', {
                    playersLeftCount: (MINIMUM_PLAYERS_TO_START_GAME - this.game.getPlayerSessions().length).toString()
                }),
                'player.png',
                4000
            );
        }
    }

    makeSurePlayersHaveNoKnife(): void {
        for (const playerSession of this.game.getPlayerSessions()) {
            playerSession.setRole(PlayerRole.CREW);
            playerSession.setupKnifeVisibility();
        }
    }

}