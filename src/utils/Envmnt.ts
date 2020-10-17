import {Cntnr} from "./Cntnr";
import {Op} from "./Op";
import {BreakObj} from "../nodes/BreakObj";
import {ReturnObj} from "../nodes/ReturnObj";
import {ContinueObj} from "../nodes/ContinueObj";
import {DeclareFunNode} from "../nodes/DeclareFunNode";
import {DeclareTypeStructureNode} from "../nodes/DeclareTypeStructureNode";
import {GraphvizNode} from "./GraphvizNode";
import {Graficar_ts} from "./nativeFunctions/graficar_ts";
import {Code} from "./C3D/Code";

export class Envmnt extends Cntnr {
    public readonly Extra = new Map<string, any>();
    private readonly operations: Array<Op>;
    public StartLabel: string;
    public EndLabel: string;
    public ExitLabel: string;

    constructor(owner: Cntnr, operations: Array<Op>, startLabel: string = "", endLabel: string = "", exitLabel = "") {
        super(owner);
        this.operations = operations;
        this.StartLabel = startLabel;
        this.EndLabel = endLabel;
        this.ExitLabel = exitLabel;
        this.typo = "Ambito";
        this.Declare("graficar_ts", new Graficar_ts());
    }

    public GO_ALL(): Cntnr {
        for (let op of this.operations) {
            if (op instanceof DeclareFunNode || op instanceof DeclareTypeStructureNode) {
                try {
                    op.Exe(this);
                } catch (e) {
                    console.log(e.message)
                }
            }
        }
        for (let op of this.operations) {
            if (!(op instanceof DeclareFunNode || op instanceof DeclareTypeStructureNode)) {
                try {
                    let result = op.Exe(this);
                    if (result instanceof BreakObj || result instanceof ReturnObj || result instanceof ContinueObj) {
                        return result as Cntnr;
                    }
                } catch (e) {
                    console.log(e.message)
                }
            }
        }
        return null;
    }

    public GetGraph(): GraphvizNode {
        console.log('aver');
        return new GraphvizNode('ROOT', this.operations.map(operation => operation.GetGraph(this)));
    }

    public GetSentences(): Array<Op> {
        return this.operations;
    }

    public GO_ALL_CODE(env: Envmnt = null): Code{
        const code = new Code();
        for (let op of this.operations) {
            try{
                const result = op.ExeCode(env ? env : this);
                code.append(result);
            }catch (e) {
                console.log(e.message);
            }
        }
        return code;
    }
}
