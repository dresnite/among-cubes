import { Message } from "../../messages/Message";
import { PlayerRole } from "../../player/PlayerRole";
import type { PlayerSession } from "../../player/PlayerSession";
import { MINIMUM_PLAYERS_TO_START_GAME } from "../../utils/config";
import type { Game } from "../Game";
import type { PhaseType } from "./PhaseType";

export abstract class Phase {

    protected _game: Game;

    constructor(game: Game) {
        this._game = game;
    }

    public abstract getPhaseType(): PhaseType;

    public handleHeartbeat(): void {
        // do nothing by default
    }

    public handleStart(): void {
        // do nothing by default
    }

    public handleJoin(playerSession: PlayerSession): void {
        // do nothing by default
    }

    public handleLeave(playerSession: PlayerSession): void {
        // do nothing by default
    }

    public handleDeath(victim: PlayerSession, killer: PlayerSession): void {
        // do nothing by default
    }

    protected sendPlayerJoinAchievement(playerSession: PlayerSession): void {
        for (const gamePlayerSession of this._game.getPlayerSessions()) {
            if (gamePlayerSession.getPlayer().username === playerSession.getPlayer().username) {
                continue;
            }

            gamePlayerSession.achievement(
                Message.t('JOINED_GAME', {
                    player: playerSession.getPlayer().username
                }), 
                Message.t('JOINED_GAME_SUBTITLE', {
                    playersLeftCount: (MINIMUM_PLAYERS_TO_START_GAME - this._game.getPlayerSessions().length).toString()
                }),
                'player.png',
                4000
            );
        }
    }

    protected makeSurePlayersHaveNoKnife(): void {
        for (const playerSession of this._game.getPlayerSessions()) {
            playerSession.setRole(PlayerRole.CREW);
            playerSession.setupKnifeVisibility();
        }
    }

}