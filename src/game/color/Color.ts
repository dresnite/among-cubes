import { ColorType } from "./ColorType";

export class Color {

    private _type: ColorType;

    constructor(type: ColorType) {
        this._type = type;
    }

    public getType(): ColorType {
        return this._type;
    }

    public getSkinPath(): string {
        return `models/players/${this._type}.gltf`;
    }

}