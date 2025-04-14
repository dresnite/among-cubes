import type { PlayerSession } from "../../player/PlayerSession";
import { Cadaver } from "./Cadaver";

export class CadaverManager {

    // The first string is the unique id of the cadaver
    private _cadavers: Map<string, Cadaver>;

    constructor() {
        this._cadavers = new Map();
    }

    public getCadaver(uniqueId: string): Cadaver | null {
        return this._cadavers.get(uniqueId) ?? null;
    }

    public spawnCadaver(playerSession: PlayerSession): void {
        const cadaver = new Cadaver(playerSession); 
        cadaver.spawn();
        
        this._cadavers.set(cadaver.getUniqueId(), cadaver);
    }

    public clearCadavers(): void {
        this._cadavers.forEach((cadaver) => {
            cadaver.despawn();
        });

        this._cadavers.clear();
    }

}