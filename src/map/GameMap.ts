import type { Vector3Like } from "hytopia";

export abstract class GameMap {

    abstract getMapName(): string;

    abstract getWaitingRoomCoords(): Vector3Like;

    getWaitingRoomCloseCoords(): Vector3Like {
        const spawnCoords = this.getWaitingRoomCoords();

        // spawn in a random position around the spawn coords
        const coords = { 
            x: spawnCoords.x + (Math.random() * 10 - 5), 
            y: spawnCoords.y, 
            z: spawnCoords.z + (Math.random() * 10 - 5) 
        };

        return coords;
    }

    abstract getMapSpawnCoords(): Vector3Like;

}