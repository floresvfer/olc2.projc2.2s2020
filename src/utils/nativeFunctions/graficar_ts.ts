import {Envmnt} from "../Envmnt";
import {Native} from "../functions/Native";
import {Cntnr} from "../Cntnr";
import {TSGraph2} from "../Utils";
import {UNDEFINED} from "../PrimitiveTypoContainer";
import {TSGraphControl} from "../TSGraphControl";
import { Code } from "../C3D/Code";

export class Graficar_ts extends Native {
    public GetC3DCode(env0: Envmnt, name: string, ...code: Code []): Code {
        throw new Error("Method not implemented.");
    }

    constructor() {
        super();
    }

    EXE(env0: Envmnt, args: Array<Cntnr>): Cntnr {
        let ownerCntnr = env0 as Cntnr;
        while (true) {
            if (ownerCntnr.GetOwner() == null) {
                break;
            }
            ownerCntnr = ownerCntnr.GetOwner();
        }
        let content = 'digraph G {bgcolor="#2E3440" gradientangle=0 rankdir=TB fontcolor="#2BBBAD" \n';
        content +=     TSGraph2((ownerCntnr as Envmnt).GetSentences());
        content += '}\n\n';
        console.log(content);
        TSGraphControl.AddGraphString(content);
        return new UNDEFINED();
    }
}
