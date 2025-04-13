import type { BlockType, World } from "hytopia";
import {
  Audio,
  Collider,
  ColliderShape,
  Entity,
  EntityEvent,
  PlayerEntity,
  PlayerEvent,
} from 'hytopia';

import worldMap from '../assets/maps/themaze.json';
import { PlayerSessionManager } from "./player/PlayerSessionManager";
import { GameManager } from "./game/GameManager";
import { Broadcaster } from "./utils/Broadcaster";
import { BROADCASTER_FREQUENCY } from "./utils/config";
import type { GameMap } from "./map/GameMap";
import { TheMaze } from "./map/maps/TheMaze";

export class Main {

  static instance: Main | null = null;

  private _world: World | null = null;
  private _gameManager: GameManager;
  private _playerSessionManager: PlayerSessionManager;
  private _broadcaster: Broadcaster;
  private _gameMap: GameMap;


  static initialize(world: World) {
    const loader = Main.getInstance();

    loader.loadGameWorld(world);
    loader.playBackgroundMusic(world);
    loader.setupHeartbeat();
  }

  static getInstance(): Main {
    if (!Main.instance) {
      Main.instance = new Main();
    }

    return Main.instance;
  }

  getWorld(): World | null {
    return this._world;
  }

  getWorldOrThrow(): World {
    if (!this._world) {
      throw new Error('World not loaded');
    }

    return this._world;
  }

  getGameManager(): GameManager {
    return this._gameManager;
  }

  getPlayerSessionManager(): PlayerSessionManager {
    return this._playerSessionManager;
  }

  getGameMap(): GameMap {
    return this._gameMap;
  }

  constructor() {
    this._gameManager = new GameManager();
    this._playerSessionManager = new PlayerSessionManager();
    this._broadcaster = new Broadcaster(BROADCASTER_FREQUENCY);
    this._gameMap = new TheMaze();
  }

  private loadGameWorld(world: World): void {
    this._world = world;

    world.loadMap(worldMap);
    this.setupWorldEvents();
  }

  private playBackgroundMusic(world: World): void {
    new Audio({
      uri: 'audio/music/among-cubes-theme.mp3',
      loop: true,
      volume: 0.1,
    }).play(world);
  }

  private setupHeartbeat(): void {
    setInterval(() => {
      for (const game of this._gameManager.getGames().values()) {
        game.getPhase().handleHeartbeat();
      }

      this._broadcaster.handleHeartbeat();
    }, 1000);
  }

  private setupWorldEvents(): void {
    this._world?.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
      const session = this._playerSessionManager.openSession(player)

      this._gameManager.assignPlayerSessionToGame(session);

      session.setupEntity();
      session.setupCamera();

      // Load our game UI for this player
      player.ui.load('ui/index.html');

      const coinEntity = new Entity({
        modelUri: 'models/environment/coin2.glb',
        opacity: 0.99,
        modelScale: 0.8,
        rigidBodyOptions: {
          enabledRotations: { x: false, y: false, z: false }, // Only allow rotations around Y axis (Yaw)
          colliders: [ // If we provide colliders, the default collider will not be created.
            Collider.optionsFromModelUri('models/environment/coin.glb', 0.8),
            { // Create a sensor to detect players 
              shape: ColliderShape.CYLINDER,
              radius: 1,
              halfHeight: 2,
              isSensor: true, // This makes the collider not collide with other entities/objects, just sense their intersection
              tag: 'aggro-sensor',
              onCollision: (other: BlockType | Entity, started: boolean) => {
                if (started && other instanceof PlayerEntity) {
                  this._world?.chatManager.sendPlayerMessage(other.player, 'You found a coin!!', 'FFE4E1');
                  //coinEntity.despawn();
                }
              },
            },
          ]
        },
      });
      coinEntity.spawn(this._world!, { x: 10, y: 10, z: 0 });

      coinEntity.on(EntityEvent.ENTITY_COLLISION, ({ otherEntity }) => {
        if (otherEntity instanceof PlayerEntity) {
          this._world?.chatManager.sendPlayerMessage(otherEntity.player, 'You found a coin!', 'FFE4E1');
          coinEntity.despawn();
        }
      });
    });

    this._world?.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
      this._world?.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());

      const session = this._playerSessionManager.getSessionOrThrow(player)
      session.game?.handlePlayerSessionLeave(session)
      this._playerSessionManager.closeSession(player)
    })
  }

}