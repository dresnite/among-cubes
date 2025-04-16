import { PlayerRole } from "../player/PlayerRole";
import type { PlayerSession } from "../player/PlayerSession";
import { createUniqueId } from "../utils/math";
import type { Color } from "./color/Color";
import { ColorFactory } from "./color/ColorFactory";
import type { Phase } from "./phase/Phase";
import { EmergencyMeetingPhase } from "./phase/phases/EmergencyMeetingPhase";
import { EndingPhase } from "./phase/phases/EndingPhase";
import { InProgressPhase } from "./phase/phases/InProgressPhase";
import { WaitingForPlayersPhase } from "./phase/phases/WaitingForPlayersPhase";
import { PhaseType } from "./phase/PhaseType";

/**
 * Represents a game session that manages players, colors, and game phases.
 * This class is responsible for handling the core game logic, including player management,
 * color assignment, and phase transitions.
 */
export class Game {
    /** Unique identifier for the game session */
    private _uniqueId: string;
    /** List of player sessions currently in the game */
    private _playerSessions: PlayerSession[] = [];
    /** List of colors that are available for new players */
    private _availableColors: Color[] = [];
    /** Current phase of the game */
    private _phase: Phase;

    /**
     * Creates a new game instance.
     * Initializes the game with a unique ID and sets it to the waiting for players phase.
     */
    constructor() {
        this._uniqueId = createUniqueId();
        this._phase = new WaitingForPlayersPhase(this);

        this.restart();
    }

    /**
     * Gets the unique identifier of the game session.
     * @returns The game's unique ID
     */
    public getUniqueId(): string {
        return this._uniqueId;
    }

    /**
     * Gets all player sessions currently in the game.
     * @returns Array of player sessions
     */
    public getPlayerSessions(): PlayerSession[] {
        return this._playerSessions;
    }

    /**
     * Gets the list of colors that are still available for new players.
     * @returns Array of available colors
     */
    public getAvailableColors(): Color[] {
        return this._availableColors;
    }

    /**
     * Gets the current phase of the game.
     * @returns The current game phase
     */
    public getPhase(): Phase {
        return this._phase;
    }

    /**
     * Changes the current game phase.
     * Handles the transition by calling appropriate lifecycle methods on both phases.
     * @param phase - The new phase to transition to
     */
    public setPhase(phase: Phase): void {
        this._phase.onChangePhase();
        this._phase = phase;
        this._phase.onStart();
    }

    /**
     * Checks if new players can join the game.
     * Players can join only during the waiting phases and if colors are available.
     * @returns True if the game can be joined, false otherwise
     */
    public canBeJoined(): boolean {
        return (this._phase.getPhaseType() === PhaseType.WAITING_FOR_PLAYERS || this._phase.getPhaseType() === PhaseType.MINIMUM_PLAYERS_REACHED) && this._availableColors.length > 0;
    }

    /**
     * Checks if the game is being played.
     * @returns True if the game is being played, false otherwise
     */
    public isBeingPlayed(): boolean {
        return this._phase instanceof InProgressPhase || this._phase instanceof EmergencyMeetingPhase
    }

    /**
     * Restarts the game to its initial state.
     * Removes all players, resets colors, and returns to the waiting phase.
     */
    public restart(): void {
        for (const playerSession of this._playerSessions) {
            this.removePlayer(playerSession);
        }

        this._playerSessions = [];
        this._availableColors = ColorFactory.createColors();

        this.setPhase(new WaitingForPlayersPhase(this));
    }

    /**
     * Adds a new player to the game.
     * Assigns a color to the player and updates the game state accordingly.
     * @param playerSession - The player session to add
     * @throws Error if the player is already in a game or if no colors are available
     */
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

    /**
     * Removes a player from the game.
     * Returns their color to the available colors pool and resets their session.
     * @param playerSession - The player session to remove
     * @throws Error if the player is not in this game or has no color assigned
     */
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

    /**
     * Checks if the game should transition to the ending phase.
     * Evaluates victory conditions based on surviving crew members and impostors.
     */
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