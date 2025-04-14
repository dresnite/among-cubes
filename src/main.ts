import type { BlockType, World } from "hytopia";
import {
  Audio,
  Collider,
  ColliderShape,
  Entity,
  PlayerEntity,
  PlayerEvent,
  RigidBodyType,
  SceneUI,
} from 'hytopia';

import worldMap from '../assets/maps/themaze.json';
import { PlayerSessionManager } from "./player/PlayerSessionManager";
import { GameManager } from "./game/GameManager";
import { Broadcaster } from "./utils/Broadcaster";
import type { GameMap } from "./map/GameMap";
import { TheMaze } from "./map/maps/TheMaze";

export class Main {

  private static _instance: Main | null = null;

  private _world: World | null = null;
  private _gameManager: GameManager;
  private _playerSessionManager: PlayerSessionManager;
  private _broadcaster: Broadcaster;
  private _gameMap: GameMap;

  constructor() {
    this._gameManager = new GameManager();
    this._playerSessionManager = new PlayerSessionManager();
    this._broadcaster = new Broadcaster();
    this._gameMap = new TheMaze();
  }


  public static initialize(world: World) {
    const loader = Main.getInstance();

    loader._loadGameWorld(world);
    loader._playBackgroundMusic(world);
    loader._setupHeartbeat();
  }

  public static getInstance(): Main {
    if (!Main._instance) {
      Main._instance = new Main();
    }

    return Main._instance;
  }

  public getWorld(): World | null {
    return this._world;
  }

  public getWorldOrThrow(): World {
    if (!this._world) {
      throw new Error('World not loaded');
    }

    return this._world;
  }

  public getGameManager(): GameManager {
    return this._gameManager;
  }

  public getPlayerSessionManager(): PlayerSessionManager {
    return this._playerSessionManager;
  }

  public getGameMap(): GameMap {
    return this._gameMap;
  }

  private _loadGameWorld(world: World): void {
    this._world = world;
    world.loadMap(worldMap);

    this._setupWorldEvents();
    this._setupWorldEntities();
  }

  private _playBackgroundMusic(world: World): void {
    new Audio({
      uri: 'audio/music/among-cubes-theme.mp3',
      loop: true,
      volume: 0.1,
    }).play(world);
  }

  private _setupHeartbeat(): void {
    setInterval(() => {
      for (const game of this._gameManager.getGames().values()) {
        game.getPhase().onHeartbeat();
      }

      this._broadcaster.handleHeartbeat();
    }, 1000);
  }

  private _setupWorldEvents(): void {
    this._world?.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
      const session = this._playerSessionManager.openSession(player)

      this._gameManager.assignPlayerSessionToGame(session);

      session.setupEntity();
      session.setupCamera();

      // Load our game UI for this player
      player.ui.load('ui/index.html');
    });

    this._world?.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
      this._world?.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());

      const session = this._playerSessionManager.getSessionOrThrow(player)
      session.getGame()?.removePlayer(session)
      this._playerSessionManager.closeSession(player)
    })
  }

  private _setupWorldEntities(): void {
    const emergencyButtonEntity = new Entity({
      modelUri: 'models/environment/emergency-button.glb',
      modelScale: 2,
      name: 'emergency-button',
      opacity: 0.99,
      rigidBodyOptions: {
        type: RigidBodyType.FIXED, // This makes the entity not move
        colliders: [
          Collider.optionsFromModelUri('models/npcs/mindflayer.gltf', 2), // Uses the model's bounding box to create the hitbox collider
          { // Create a sensor that teleports the player into the game
            shape: ColliderShape.BLOCK,
            halfExtents: { x: 1.5, y: 1.05, z: 1.5 }, // size it slightly smaller than the platform the join NPC is standing on
            isSensor: true,
            tag: 'emergency-button-sensor',
            onCollision: (other: BlockType | Entity, started: boolean) => {
              if (started && other instanceof PlayerEntity) {
                this._world?.chatManager.sendPlayerMessage(other.player, 'Emergency button pressed!', 'FFE4E1');
              }
            },
          },
        ],
      },
    });

    emergencyButtonEntity.spawn(this._world!, { x: 1, y: 1.3, z: 1 });

    // Create the Scene UI over the NPC
    const npcMessageUI = new SceneUI({
      templateId: 'emergency-button-entity',
      attachedToEntity: emergencyButtonEntity,
      offset: { x: 0, y: 1.75, z: 0 },
    });

    npcMessageUI.load(this._world!);
  }

}