import { Message } from "../../messages/Message";
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

    abstract handleHeartbeat(): void;

    handlePhaseStart(): void {
        // Do nothing by default
    }

    handleJoin(playerSession: PlayerSession): void {
        // Do nothing by default
    }

    handleLeave(playerSession: PlayerSession): void {
        // Do nothing by default
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
                'achievement_join_game',
                4000
            );
        }
    }   

}