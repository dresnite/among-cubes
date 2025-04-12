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

export class Main {

  static instance: Main | null = null;

  world: World | null = null;
  gameManager: GameManager;
  playerSessionManager: PlayerSessionManager;

  static initialize(world: World) {
    const loader = Main.getInstance();

    loader.loadGameWorld(world);
    loader.playBackgroundMusic(world);
  }

  static getInstance(): Main {
    if (!Main.instance) {
      Main.instance = new Main();
    }

    return Main.instance;
  }

  getWorld(): World | null {
    return this.world;
  }

  getWorldOrThrow(): World {
    if (!this.world) {
      throw new Error('World not loaded');
    }

    return this.world;
  }

  getGameManager(): GameManager {
    return this.gameManager;
  }

  getPlayerSessionManager(): PlayerSessionManager {
    return this.playerSessionManager;
  }

  constructor() {
    this.playBackgroundMusic = this.playBackgroundMusic.bind(this);
    this.gameManager = new GameManager();
    this.playerSessionManager = new PlayerSessionManager();
  }

  loadGameWorld(world: World): void {
    this.world = world;

    world.loadMap(worldMap);

    world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
      const session = this.playerSessionManager.openSession(player)
      this.gameManager.assignPlayerSessionToGame(session);

      const playerEntity = new PlayerEntity({
        player,
        name: 'Player',
        modelUri: session.color!.getSkinPath(),
        modelLoopedAnimations: ['idle'],
        modelScale: 0.5,
      });

      playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

      // Load our game UI for this player
      player.ui.load('ui/index.html');
      session.setupCamera();

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
                  world.chatManager.sendPlayerMessage(other.player, 'You found a coin!!', 'FFE4E1');
                  //coinEntity.despawn();
                }
              },
            },
          ]
        },
      });
      coinEntity.spawn(world, { x: 10, y: 10, z: 0 });

      coinEntity.on(EntityEvent.ENTITY_COLLISION, ({ otherEntity }) => {
        if (otherEntity instanceof PlayerEntity) {
          world.chatManager.sendPlayerMessage(otherEntity.player, 'You found a coin!', 'FFE4E1');
          coinEntity.despawn();
        }
      });
    });

    world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
      world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());

      const session = this.playerSessionManager.getSessionOrThrow(player)
      session.game?.handlePlayerSessionLeave(session)
      this.playerSessionManager.closeSession(player)
    })
  }

  playBackgroundMusic(world: World): void {
    new Audio({
      uri: 'audio/music/among-cubes-theme.mp3',
      loop: true,
      volume: 0.1,
    }).play(world);
  }

}