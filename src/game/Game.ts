import { PlayerRole } from "../player/PlayerRole";
import type { PlayerSession } from "../player/PlayerSession";
import { createUniqueId } from "../utils/math";
import type { Color } from "./color/Color";
import { ColorFactory } from "./color/ColorFactory";
import type { Phase } from "./phase/Phase";
import { EndingPhase } from "./phase/phases/EndingPhase";
import { WaitingForPlayersPhase } from "./phase/phases/WaitingForPlayersPhase";

export class Game {

    private _uniqueId: string;
    private _playerSessions: PlayerSession[] = [];
    private _availableColors: Color[] = [];
    private _phase: Phase;

    constructor() {
        this._uniqueId = createUniqueId();
        this._phase = new WaitingForPlayersPhase(this);

        this.restart();
    }

    public getUniqueId(): string {
        return this._uniqueId;
    }

    public getPlayerSessions(): PlayerSession[] {
        return this._playerSessions;
    }

    public getAvailableColors(): Color[] {
        return this._availableColors;
    }

    public getPhase(): Phase {
        return this._phase;
    }

    public setPhase(phase: Phase): void {
        this._phase = phase;
        this._phase.onStart();
    }

    public restart(): void {
        for (const playerSession of this._playerSessions) {
            this.removePlayer(playerSession);
        }

        this._playerSessions = [];
        this._availableColors = ColorFactory.createColors();

        this.setPhase(new WaitingForPlayersPhase(this));
    }

    public addPlayer(playerSession: PlayerSession): void {
        if (playerSession.getGame() !== null) {
            throw new Error('Player session is already in a game');
        }

        this._playerSessions.push(playerSession);

        if (this._availableColors.length === 0) {
            throw new Error('No available colors');
        }

        playerSession.setGame(this);
        playerSession.setColor(this._availableColors.shift()!);

        this._phase.onJoin(playerSession);
    }

    public removePlayer(playerSession: PlayerSession): void {
        if (playerSession.getGame() !== this) {
            throw new Error('Player session is not in this game');
        }

        this._playerSessions = this._playerSessions.filter(session => session !== playerSession);

        const color = playerSession.getColor();

        if (!color) {
            throw new Error('Player session has no color');
        }

        this._availableColors.push(color);
        playerSession.reset();

        this._phase.onLeave(playerSession);
    }

    public checkIfGameShouldEnd(): void {
        const victimsAlive = this.getPlayerSessions().filter(session => session.getRole() === PlayerRole.CREW);
        const impostorAlive = this.getPlayerSessions().filter(session => session.getRole() === PlayerRole.IMPOSTOR);

        if (victimsAlive.length === 0) {
            this.setPhase(new EndingPhase(this, false));
            return
        }

        if (impostorAlive.length === 0) {
            this.setPhase(new EndingPhase(this, true));
            return
        }
    }

}