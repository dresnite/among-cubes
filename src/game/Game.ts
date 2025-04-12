import { Main } from "../main";
import { Message } from "../messages/Message";
import type { PlayerSession } from "../player/PlayerSession";
import { createUniqueId } from "../utils/math";
import type { Color } from "./color/Color";
import { ColorFactory } from "./color/ColorFactory";
import { ColorType } from "./color/ColorType";
import { GameStatus } from "./GameStatus";

export class Game {

    uniqueId: string;
    playerSessions: PlayerSession[] = [];
    availableColors: Color[] = [];
    status: GameStatus = GameStatus.WAITING_FOR_PLAYERS;

    constructor() {
        this.uniqueId = createUniqueId();
        this.handleGameRestart();
    }

    getUniqueId(): string {
        return this.uniqueId;
    }

    getPlayerSessions(): PlayerSession[] {
        return this.playerSessions;
    }

    getStatus(): GameStatus {
        return this.status;
    }

    handleGameRestart(): void {
        for (const playerSession of this.playerSessions) {
            this.handlePlayerSessionLeave(playerSession);
        }

        this.playerSessions = [];
        this.availableColors = ColorFactory.createColors();
        this.status = GameStatus.WAITING_FOR_PLAYERS;
    }

    handleGameStart(): void {
        this.status = GameStatus.IN_PROGRESS;
    }

    handlePlayerSessionJoin(playerSession: PlayerSession): void {
        if (playerSession.getGame() !== null) {
            throw new Error('Player session is already in a game');
        }

        this.playerSessions.push(playerSession);

        if (this.availableColors.length === 0) {
            throw new Error('No available colors');
        }

        playerSession.setGame(this);
        playerSession.setColor(this.availableColors.shift()!);

        const main = Main.getInstance();
        main.getWorldOrThrow().chatManager.sendPlayerMessage(playerSession.getPlayer(), `Welcome to the game, you are the color ${playerSession.getColor()!.getType()}, your game id is ${this.getUniqueId()}. There are ${Array.from(main.getGameManager().getGames().values()).length} games in progress.`);

        if (this.availableColors.length === 0) {
            this.handleGameStart();
        }
    }

    handlePlayerSessionLeave(playerSession: PlayerSession): void {
        if (playerSession.getGame() !== this) {
            throw new Error('Player session is not in this game');
        }

        this.playerSessions = this.playerSessions.filter(session => session !== playerSession);

        const color = playerSession.getColor();

        if (!color) {
            throw new Error('Player session has no color');
        }

        this.availableColors.push(color);
        playerSession.reset();
    }

    heartbeat(): void {
        for (const playerSession of this.playerSessions) {
            if (this.status === GameStatus.WAITING_FOR_PLAYERS) {
                playerSession.popup(Message.t('WAITING_FOR_PLAYERS', {
                    playerCount: this.playerSessions.length.toString(),
                    maxPlayers: Object.keys(ColorType).length.toString()
                }), 10000);
            }
        }
    }
}