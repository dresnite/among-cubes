import type { PlayerSession } from "../player/PlayerSession";
import { Game } from "./Game";
import { PhaseType } from "./phase/PhaseType";

export class GameManager {

    private _games: Map<string, Game> = new Map();

    constructor() {
        this._games = new Map();
    }

    public getGames(): Map<string, Game> {
        return this._games;
    }

    private _getMostSuitableGame(): Game|null {
        const openGames = Array.from(this._games.values()).filter(game => game.getPhase().getPhaseType() === PhaseType.WAITING_FOR_PLAYERS);

        if (openGames.length === 0) {
            return null;
        }

        let mostSuitableGame: Game|null = null;

        for (const game of openGames) {
            if (mostSuitableGame === null || game.getPlayerSessions().length > mostSuitableGame.getPlayerSessions().length) {
                mostSuitableGame = game;
            }
        }

        return mostSuitableGame;
    }

    private _createGame(): Game {
        const game = new Game();
        this._games.set(game.getUniqueId(), game);
        return game;
    }

    public assignPlayerSessionToGame(playerSession: PlayerSession): Game {
        let suitableGame = this._getMostSuitableGame();

        if (!suitableGame) {
            suitableGame = this._createGame();
        }

        suitableGame.handlePlayerSessionJoin(playerSession);

        return suitableGame;
    }

}