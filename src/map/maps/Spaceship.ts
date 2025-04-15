import type { QuaternionLike, Vector3Like } from "hytopia";
import { GameMap } from "../GameMap";

export class Spaceship extends GameMap {

    public getMapName(): string {
        return "Spaceship";
    }

    public getWaitingRoomCoords(): Vector3Like {
        return { x: 42, y: 3, z: 34 };
    }

    public getMapSpawnCoords(): Vector3Like {
        return { x: 0, y: 3, z: 0 };
    }

    public getVotingAreaCoords(): Vector3Like {
        return { x: 47, y: 3, z: -14 };
    }

    public getVotingPodiumPositions(): Vector3Like[] {
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

    public getVotingPodiumRotation(): QuaternionLike {
        return { x: 0, y: -0.7, z: 0, w: 0.7 };
    }

    public getEmergencyButtonCoords(): Vector3Like {
        return { x: 1, y: 1.5, z: 1 };
    }

    public getSkipVoteCoords(): Vector3Like {
        return { x: 48, y: 1, z: -24 };
    }

    public getSkipVoteRotation(): QuaternionLike {
        return { x: 0, y: 0.7, z: 0, w: 0.7 };
    }

    public getCadaverSpawnY(): number {
        return 1.7;
    }

    public getCoinCoords(): Vector3Like[] {
        return [
            { x: 1, y: 1, z: 18 },
            { x: -6, y: 1, z: 19 },
            { x: -26, y: 1, z: 19 },
            { x: -19, y: 1, z: 6 },
            { x: -34, y: 1, z: 1 },
            { x: -35, y: 1, z: 19 },
            { x: -46, y: 1, z: -43 },
            { x: -27, y: 1, z: -33 },
            { x: -18, y: 1, z: -18 },
            { x: -29, y: 1, z: -39 },
            { x: -8, y: 1, z: -45 },
            { x: -7, y: 1, z: -36 },
            { x: -36, y: 1, z: -19 },
            { x: -46, y: 1, z: -27 },
            { x: -7, y: 1, z: -19 },
            { x: 6, y: 1, z: -35 },
            { x: 6, y: 1, z: 32 },
        ];
    }

    public getCameraCoords(): Vector3Like {
        return { x: -46.5, y: 6, z: 0.5 };
    }

}