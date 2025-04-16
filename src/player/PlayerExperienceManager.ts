import { MAX_LEVEL } from "../utils/config";
import type { PlayerPersistedData } from "./PlayerPersistedData";
import type { PlayerSession } from "./PlayerSession";

export class PlayerExperienceManager {

    private _session: PlayerSession

    private _experience: number;
    private _level: number | null = null;
    private _maxLevel: number | null;

    private _loaded: boolean = false;

    constructor(session: PlayerSession) {
        this._session = session
        this._experience = 0;
        this._maxLevel = MAX_LEVEL;
        this.calculateLevel();
    }

    public getExperience(): number {
        return this._experience;
    }

    public setExperience(experience: number): void {
        this._experience = experience;

        if (this.hasMaxLevel() && this._experience >= this.getNecessaryExperienceForLevel(this._maxLevel!)) {
            this._experience = this.getNecessaryExperienceForLevel(this._maxLevel!);
        }

        this.calculateLevel();
    }

    public getNecessaryExperienceForNextLevel(): number {
        return this.getNecessaryExperienceForLevel(this._level! + 1);
    }

    public getNecessaryExperienceForLevel(level: number): number {
        return Math.pow(level * 10, 2);
    }

    public getLevel(): number {
        return this._level!;
    }

    public getMaxLevel(): number | null {
        return this._maxLevel;
    }

    public hasMaxLevel(): boolean {
        return this._maxLevel !== null;
    }

    public addExperience(experience: number): void {
        this.setExperience(this._experience + experience);
        this._session.sendLevelInfo();
    }

    public calculateLevel(): void {
        const newLevel = Math.max(1, Math.floor(0.1 * Math.sqrt(this._experience)));

        if (this.hasMaxLevel() && newLevel > this._maxLevel!) {
            this._level = this._maxLevel;
            return;
        }

        this._level = newLevel;
    }

    public isLoaded(): boolean {
        return this._loaded;
    }

    public load(): void {
        this._session.getPlayer().getPersistedData().then((data) => {
            const persistedData = data as unknown as PlayerPersistedData | undefined;
            this.setExperience(persistedData?.experience || 0);
            this._loaded = true;
            this._session.sendLevelInfo();
        });
    }

    public save(): void {
        if (!this._loaded) {
            return;
        }

        this._session.getPlayer().setPersistedData({
            experience: this._experience,
        });
    }

}

