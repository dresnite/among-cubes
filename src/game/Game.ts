import type { PlayerSession } from "../player/PlayerSession";
import { createUniqueId } from "../utils/math";
import type { Color } from "./color/Color";
import { ColorFactory } from "./color/ColorFactory";
import type { Phase } from "./phase/Phase";
import { WaitingForPlayersPhase } from "./phase/phases/WaitingForPlayersPhase";

export class Game {

    uniqueId: string;
    playerSessions: PlayerSession[] = [];
    availableColors: Color[] = [];
    phase: Phase;

    constructor() {
        this.uniqueId = createUniqueId();
        this.phase = new WaitingForPlayersPhase(this);

        this.handleGameRestart();
    }

    getUniqueId(): string {
        return this.uniqueId;
    }

    getPlayerSessions(): PlayerSession[] {
        return this.playerSessions;
    }

    getAvailableColors(): Color[] {
        return this.availableColors;
    }

    getPhase(): Phase {
        return this.phase;
    }

    setPhase(phase: Phase): void {
        this.phase = phase;
        this.phase.handlePhaseStart();
    }

    handleGameRestart(): void {
        for (const playerSession of this.playerSessions) {
            this.handlePlayerSessionLeave(playerSession);
        }

        this.playerSessions = [];
        this.availableColors = ColorFactory.createColors();
        
        this.setPhase(new WaitingForPlayersPhase(this));
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

        this.phase.handleJoin(playerSession);
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

        this.phase.handleLeave(playerSession);
    }
}