import type { QuaternionLike, Vector3Like } from "hytopia";

export abstract class GameMap {

    public abstract getMapName(): string;

    public abstract getWaitingRoomCoords(): Vector3Like;

    public getWaitingRoomCloseCoords(): Vector3Like {
        return this._getRandomCoordsAround(this.getWaitingRoomCoords());
    }

    public abstract getMapSpawnCoords(): Vector3Like;

    public abstract getVotingAreaCoords(): Vector3Like;

    public getVotingAreaCloseCoords(): Vector3Like {
        return this._getRandomCoordsAround(this.getVotingAreaCoords());
    }

    public abstract getVotingPodiumPositions(): Vector3Like[];

    public abstract getVotingPodiumRotation(): QuaternionLike;

    private _getRandomCoordsAround(coords: Vector3Like): Vector3Like {
        return {
            x: coords.x + (Math.random() * 10 - 5),
            y: coords.y,
            z: coords.z + (Math.random() * 10 - 5)
        };
    }

    public abstract getEmergencyButtonCoords(): Vector3Like;

    public abstract getSkipVoteCoords(): Vector3Like;

    public abstract getSkipVoteRotation(): QuaternionLike;

    public abstract getCadaverSpawnY(): number;

    public abstract getCoinCoords(): Vector3Like[];

    public abstract getCameraCoords(): Vector3Like;

    public abstract getComputerCoords(): Vector3Like;

}