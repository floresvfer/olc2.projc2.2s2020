import {Op} from "../utils/Op";
import {Envmnt} from "../utils/Envmnt";
import {UserDefined} from "../utils/functions/UserDefined";
import {Reference} from "../utils/Reference";
import {GraphvizNode} from "../utils/GraphvizNode";
import {TSGraphControl} from "../utils/TSGraphControl";
import { Code } from "../utils/C3D/Code";

export class DeclareFunNode extends Op {
    private readonly name: string;
    private readonly params: Array<Op>;
    private readonly sentences: Array<Op>;
    private readonly type: string;

    constructor(position: any, name: string, params: Array<Op>, sentences: Array<Op>, type = 'ANY') {
        super(position);
        this.name = name;
        this.params = params;
        this.sentences = sentences;
        this.type = type;
    }

    public GOCode(env: Envmnt): Code {
        let codeAns = new Code();
        for (let sentence of this.sentences) {
            if (sentence instanceof DeclareFunNode) {
                try {
                    const result = sentence.ExeCode(env);
                    codeAns.append(result);
                } catch (e) {
                    console.log(e.message)
                }
            }
        }
        const value = new UserDefined(this.sentences, this.params, this.type);
        const reference = new Reference();
        reference.PutValueOnReference(value);
        env.Declare(this.name, reference, true);
        let funC3D = value.GetC3DCode(env, this.name);
        codeAns.append(funC3D);
        codeAns.setValue(funC3D.getValue());
        return codeAns;
    }

    GO(env: Envmnt): object {
        const value = new UserDefined(this.sentences, this.params, this.type);
        const reference = new Reference();
        reference.PutValueOnReference(value);
        if(this.name !== null) {
            env.Declare(this.name, reference);
            return undefined;
        }
        return value;
    }

    GetGraph(env: Envmnt): GraphvizNode {
        return new GraphvizNode('NEW_FUN', [
            new GraphvizNode(this.name),
            new GraphvizNode(this.type),
            new GraphvizNode('PARAMS', this.params.map(param => param.GetGraph(env))),
            new GraphvizNode('NEW_FUN_BODY', this.sentences.map(sentence => sentence.GetGraph(env)))
        ]);
    }

    GetTSGraph(): string {
        let value = '';
        const graphId = TSGraphControl.GetGraphId();
        value += `subgraph cluster_${graphId} { \n`;
        value += 'style=filled;\n' +
            'color="#2BBBAD";\n' +
            'fillcolor="#1E222A";\n';
        value += 'node [color="#2BBBAD" fontcolor="#2BBBAD" shape="rectangle"] \n';
        this.sentences.forEach(sentence => {
            value += sentence.GetTSGraph();
        });
        this.params.forEach(param => {
            value += param.GetTSGraph();
        });
        value += `label = "${this.name}";\n`;
        value += `}\n`;
        return value;
    }
}
