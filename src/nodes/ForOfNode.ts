import {Op} from "../utils/Op";
import {Envmnt} from "../utils/Envmnt";
import {Reference} from "../utils/Reference";
import {ARRAY} from "../utils/PrimitiveTypoContainer";
import {FindVar, GetReferenceValueCode, SemanticException} from "../utils/Utils";
import {GraphvizNode} from "../utils/GraphvizNode";
import {TSGraphControl} from "../utils/TSGraphControl";
import { Code } from "../utils/C3D/Code";
import {Tmp} from "../utils/C3D/Tmp";
import {Lbl} from "../utils/C3D/Lbl";

export class ForOfNode extends Op {
    public GOCode(env: Envmnt): Code {
        const codeAns = new Code();
        codeAns.appendSplitComment("START FOR OF");
        let arrayCode = this.array.ExeCode(env);
        arrayCode = GetReferenceValueCode(arrayCode);
        const val = arrayCode.getValue();


        if (!(val instanceof ARRAY)) {
            throw new SemanticException("Se esperaba una referncia a un arreglo en ciclo For Of", this.position)
        }

        const t = val.getValueList()[0];
        let valType = t ? (t as Reference).getValue().typo : undefined;
        valType = valType ? valType : val.getContentType();

        let startLbl = Lbl.newLbl();
        let endLbl = Lbl.newLbl();

        const env0 = new Envmnt(env, this.sentences, startLbl, endLbl);
        if (this.newControlVar) {
            // env0.AddProperty(this.controlVar, new Reference(valType, false, true));
            env0.AddProperty(this.controlVar, t ? t : new Reference(valType, false, true));
        }

        codeAns.appendSplitComment("array type: " + valType);

        codeAns.append(arrayCode);


        let controlTmp = new Code();
        controlTmp.setPointer(Tmp.newTmp());
        controlTmp.appendValueToPointer(0, "puntero de ciclo");

        let asigCode = new Code();
        asigCode.setPointer(Tmp.newTmp());
        asigCode.appendValueToPointer(arrayCode.getPointer());

        codeAns.append(asigCode);
        codeAns.append(controlTmp);

        const controlVarCode = new Code();
        controlVarCode.appendSplitComment(`start obtiene variable: ${this.controlVar}`);
        controlVarCode.setValue(FindVar(env0, this.controlVar));
        controlVarCode.setPointer(Tmp.newTmp());
        controlVarCode.appendStackPointerPlusValue(env0.GetPropertyIndex(this.controlVar), "obtiene " + this.controlVar);
        controlVarCode.appendSplitComment(`end obtiene variable: ${this.controlVar}`);

        codeAns.append(controlVarCode);


        codeAns.appendLabel(startLbl);
        codeAns.appendJGE(controlTmp.getPointer(), val.getValueList().length+"", endLbl,"condicion tamañ de arreglo");


        let codeTmp = new Code();
        codeTmp.setPointer(Tmp.newTmp());
        codeTmp.GetFromHeap(asigCode.getPointer(), "array val");

        codeAns.append(codeTmp);
        codeAns.appendAsignToStackPosition(controlVarCode.getPointer(), codeTmp.getPointer(), "asigna a variable de control")

        codeAns.append(env0.GO_ALL_CODE());

        codeAns.appendLine(`${controlTmp.getPointer()} = ${controlTmp.getPointer()} + 1;`, "aumenta variable de control");
        codeAns.appendLine(`${asigCode.getPointer()} = ${asigCode.getPointer()} + 1;`, "aumenta puntero a array");
        codeAns.appendJMP(startLbl, "retorna a inicio");
        codeAns.appendLabel(endLbl);

        codeAns.appendSplitComment("END FOR OF");
        return codeAns;
    }
    private readonly controlVar: string;
    private readonly newControlVar: boolean;
    private readonly array: Op;
    private readonly sentences: Array<Op>;

    constructor(position: any, controlVar: string, newControlVar: boolean, array: Op, sentences: Array<Op>) {
        super(position);
        this.controlVar = controlVar;
        this.newControlVar = newControlVar;
        this.array = array;
        this.sentences = sentences;
    }

    GO(env: Envmnt): object {
        let array = this.array.Exe(env);
        if (array instanceof Reference) {
            array = (array as Reference).getValue();
        }
        if (!(array instanceof ARRAY)) {
            throw new SemanticException("Se esperaba una referncia a un arreglo en ciclo For Of", this.position)
        }

        const env0 = new Envmnt(env, this.sentences);
        if (this.newControlVar) {
            env0.AddProperty(this.controlVar, new Reference());
        }

        for (let element of (array as ARRAY).getValueList()) {
            let val = element;
            if (val instanceof Reference) {
                val = (val as Reference).getValue();
            }
            (FindVar(env0, this.controlVar) as Reference).setValue(val);
            env0.GO_ALL();
        }
        return undefined;
    }

    GetGraph(env: Envmnt): GraphvizNode {
        return new GraphvizNode('FOR_OF', [new GraphvizNode(this.controlVar), new GraphvizNode('FOR_OF_BODY', this.sentences.map(sentence => sentence.GetGraph(env)))]);
    }

    GetTSGraph(): string {
        let value = '';
        const graphId = TSGraphControl.GetGraphId();
        value += `subgraph cluster_${graphId} { \n`;
        value += 'style=filled;\n' +
            'color="#2BBBAD";\n' +
            'fillcolor="#1E222A";\n';
        value += 'node [color="#2BBBAD" fontcolor="#2BBBAD" shape="rectangle"] \n';
        value += `n${TSGraphControl.GetNodeId()} [label="${this.controlVar}"]\n`;
        value += this.array.GetTSGraph();
        this.sentences.forEach(sentence => {
            value += sentence.GetTSGraph();
        });
        value += `label = "${"FOR_OF_SENTENCE"}";\n`;
        value += `}\n`;
        return value;
    }
}
