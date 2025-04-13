import type { Vector3Like } from "hytopia";
import { GameMap } from "../GameMap";

export class TheMaze extends GameMap {

    getMapName(): string {
        return "The Maze";
    }

    getWaitingRoomCoords(): Vector3Like {
        return { x: 42, y: 3, z: 34 };
    }

    getMapSpawnCoords(): Vector3Like {
        return { x: 0, y: 3, z: 0 };
    }

    getVotingAreaCoords(): Vector3Like {
        return { x: 47, y: 3, z: -14 };
    }

    getVotingPodiumPositions(): Vector3Like[] {
        return [
            { x: 42, y: 1, z: -4 },
            { x: 39, y: 1, z: -6 },
            { x: 36, y: 1, z: -8 },
            { x: 36, y: 1, z: -12 },
            { x: 36, y: 1, z: -16 },
            { x: 36, y: 1, z: -20 },
            { x: 39, y: 1, z: -22 },
            { x: 42, y: 1, z: -24 },
        ];
    }
}