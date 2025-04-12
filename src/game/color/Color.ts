import { ColorType } from "./ColorType";

export class Color {

    type: ColorType;

    constructor(type: ColorType) {
        this.type = type;
    }

    getType(): ColorType {
        return this.type;
    }

    getSkinPath(): string {
        return `models/players/${this.type}.gltf`;
    }

}