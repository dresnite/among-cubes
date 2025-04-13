import type { Vector3Like } from "hytopia";
import { GameMap } from "../GameMap";

export class TheMaze extends GameMap {

    getMapName(): string {
        return "The Maze";
    }
    
    getWaitingRoomCoords(): Vector3Like {
        return { x: 42, y: 5, z: 34 };
    }

    getMapSpawnCoords(): Vector3Like {
        return { x: 0, y: 3, z: 0 };
    }
    
}