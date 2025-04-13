import type { Vector3Like } from "hytopia";
import type { ColorType } from "../game/color/ColorType";

export abstract class GameMap {

    abstract getMapName(): string;

    abstract getWaitingRoomCoords(): Vector3Like;

    getWaitingRoomCloseCoords(): Vector3Like {
        return this.getRandomCoordsAround(this.getWaitingRoomCoords());
    }

    abstract getMapSpawnCoords(): Vector3Like;

    abstract getVotingAreaCoords(): Vector3Like;

    getVotingAreaCloseCoords(): Vector3Like {
        return this.getRandomCoordsAround(this.getVotingAreaCoords());
    }

    abstract getVotingPodiumPositions(): Vector3Like[];

    private getRandomCoordsAround(coords: Vector3Like): Vector3Like {
        return {
            x: coords.x + (Math.random() * 10 - 5),
            y: coords.y,
            z: coords.z + (Math.random() * 10 - 5)
        };
    }

}