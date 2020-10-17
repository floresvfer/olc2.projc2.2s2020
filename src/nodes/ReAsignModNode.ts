import {Op} from "../utils/Op";
import {Envmnt} from "../utils/Envmnt";
import {Reference} from "../utils/Reference";
import {SemanticException} from "../utils/Utils";
import {Modulo} from "../utils/AlgebraicOperationsFunctions";
import {Cntnr} from "../utils/Cntnr";
import {GraphvizNode} from "../utils/GraphvizNode";
import { Code } from "../utils/C3D/Code";

export class ReAsignModNode extends Op {
    public GOCode(env: Envmnt): Code {
        throw new Error("Method not implemented.");
    }
    private readonly lf: Op;
    private readonly rt: Op;

    constructor(position: any, lf: Op, rt: Op) {
        super(position);
        this.lf = lf;
        this.rt = rt;
    }

    GO(env: Envmnt): object {
        const lf = this.lf.Exe(env);
        const rt = this.rt.Exe(env);

        if (!(lf instanceof Reference)) {
            throw new SemanticException(`No se puede asiganr a ${lf}, las asignaciones solo pueden ser sobre una referencia`, this.position);
        }

        (lf as Reference).PutValueOnReference(
            Modulo((lf as Reference).getValue(), rt as Cntnr, this.position)
        );
        return (lf as Reference).getValue();
    }

    GetGraph(env: Envmnt): GraphvizNode {
        return new GraphvizNode('RE_ASIGN_MOD', [this.lf.GetGraph(env), this.rt.GetGraph(env)]);
    }

    GetTSGraph(): string {
        return "";
    }

}
