import { Entity, RigidBodyType, SceneUI } from "hytopia";
import { Main } from "../Main";
import { SKIP_VOTE_ENTITY_NAME } from "../utils/config";
import { ColorType } from "../game/color/ColorType";

export class VoteEntitiesManager {

    private _voteEntitiesNameToColorMap: Map<string, ColorType>;
    private _voteEntitiesNameToAliveSceneUIMap: Map<string, SceneUI>;
    private _voteEntitiesNameToDeadSceneUIMap: Map<string, SceneUI>;

    private _skipVoteEntity: Entity | null = null;

    public constructor() {
        this._voteEntitiesNameToColorMap = new Map();
        this._voteEntitiesNameToAliveSceneUIMap = new Map();
        this._voteEntitiesNameToDeadSceneUIMap = new Map();
    }

    public setup(): void {
        const main = Main.getInstance();
        const world = main.getWorldOrThrow();
        const gameMap = main.getGameMap();

        this._skipVoteEntity = new Entity({
            modelUri: 'models/environment/x.glb',
            modelScale: 1,
            name: SKIP_VOTE_ENTITY_NAME,
            opacity: 0.99,
            rigidBodyOptions: {
                type: RigidBodyType.FIXED, // This makes the entity not move
                rotation: gameMap.getSkipVoteRotation(),
            },
        });

        const skipVoteCoords = main.getGameMap().getSkipVoteCoords();
        this._skipVoteEntity.spawn(world, {
            x: skipVoteCoords.x,
            y: skipVoteCoords.y + 1,
            z: skipVoteCoords.z,
        });

        const skipVoteUI = new SceneUI({
            templateId: 'skip-entity',
            attachedToEntity: this._skipVoteEntity,
            offset: { x: 0, y: 1, z: 0 },
        });

        skipVoteUI.load(world);


        const podiums = gameMap.getVotingPodiumPositions();
        for (const color of Object.values(ColorType)) {
            const podium = podiums.shift();

            if (!podium) {
                throw new Error('Not enough podiums');
            }

            const voteEntity = new Entity({
                modelUri: `models/players/${color}.gltf`,
                modelScale: 0.8,
                name: color.toString(),
                modelLoopedAnimations: ['jump_loop'],
                rigidBodyOptions: {
                    type: RigidBodyType.FIXED, // This makes the entity not move
                    rotation: gameMap.getVotingPodiumRotation(),
                },
            });

            voteEntity.spawn(world, {
                x: podium.x,
                y: podium.y + 1.5,
                z: podium.z,
            });

            // Create the Scene UI over the NPC
            const aliveSceneUI = new SceneUI({
                templateId: `${color}-entity`,
                attachedToEntity: voteEntity,
                offset: { x: 0, y: 1.75, z: 0 },
            });

            // Create the Scene UI over the NPC
            const deadSceneUI = new SceneUI({
                templateId: `dead-entity`,
                attachedToEntity: voteEntity,
                offset: { x: 0, y: 1.75, z: 0 },
            });

            this._voteEntitiesNameToColorMap.set(voteEntity.name, color);
            this._voteEntitiesNameToAliveSceneUIMap.set(voteEntity.name, aliveSceneUI);
            this._voteEntitiesNameToDeadSceneUIMap.set(voteEntity.name, deadSceneUI);
        }
    }

    public getVoteEntitiesNameToColorMap(): Map<string, ColorType> {
        return this._voteEntitiesNameToColorMap;
    }

    public showAliveSceneUI(color: ColorType): void {
        const aliveSceneUI = this._voteEntitiesNameToAliveSceneUIMap.get(color.toString());
        const deadSceneUI = this._voteEntitiesNameToDeadSceneUIMap.get(color.toString());

        if (deadSceneUI?.isLoaded) {
            deadSceneUI.unload();
        }

        if (aliveSceneUI && !aliveSceneUI.isLoaded) {
            aliveSceneUI.load(Main.getInstance().getWorldOrThrow());
        }
    }

    public showDeadSceneUI(color: ColorType): void {
        const aliveSceneUI = this._voteEntitiesNameToAliveSceneUIMap.get(color.toString());
        const deadSceneUI = this._voteEntitiesNameToDeadSceneUIMap.get(color.toString());

        if (aliveSceneUI?.isLoaded) {
            aliveSceneUI.unload();
        }

        if (deadSceneUI && !deadSceneUI.isLoaded) {
            deadSceneUI.load(Main.getInstance().getWorldOrThrow());
        }
    }

}