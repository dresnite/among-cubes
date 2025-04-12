import type { PlayerSession } from "../player/PlayerSession";
import { Game } from "./Game";
import { PhaseType } from "./phase/PhaseType";

export class GameManager {

    games: Map<string, Game> = new Map();

    constructor() {
        this.games = new Map();
        this.setupHeartbeat();
    }

    getGames(): Map<string, Game> {
        return this.games;
    }

    getMostSuitableGame(): Game|null {
        const openGames = Array.from(this.games.values()).filter(game => game.getPhase().getPhaseType() === PhaseType.WAITING_FOR_PLAYERS);

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

    createGame(): Game {
        const game = new Game();
        this.games.set(game.getUniqueId(), game);
        return game;
    }

    assignPlayerSessionToGame(playerSession: PlayerSession): Game {
        let suitableGame = this.getMostSuitableGame();

        if (!suitableGame) {
            suitableGame = this.createGame();
        }

        suitableGame.handlePlayerSessionJoin(playerSession);

        return suitableGame;
    }

    setupHeartbeat() {
        setInterval(() => {
            for (const game of this.games.values()) {
                game.getPhase().handleHeartbeat();
            }
        }, 1000);
    }

}