export class Lbl {
    private static lblCount: number = 0;

    public static newLbl = (): string  => `L${Lbl.lblCount++}`;

    public static getCount = (): number => Lbl.lblCount;

    public static resetCount = () => Lbl.lblCount = 0;
}