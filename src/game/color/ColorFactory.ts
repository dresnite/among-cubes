import { ColorType } from "./ColorType";
import { Color } from "./Color";

export class ColorFactory {

    public static createColors(): Color[] {
        return [
            new Color(ColorType.Black),
            new Color(ColorType.Blue),
            new Color(ColorType.Green),
            new Color(ColorType.Pink),
            new Color(ColorType.Purple),
            new Color(ColorType.Red),
            new Color(ColorType.White),
            new Color(ColorType.Yellow),
        ]
    }   

}