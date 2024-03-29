import {ARRAY, BOOLEAN, NULL, NUMBER, OBJECT, STRING, UNDEFINED} from "./PrimitiveTypoContainer";
import {Cntnr} from "./Cntnr";
import {Envmnt} from "./Envmnt";
import {Op} from "./Op";
import {Reference} from "./Reference";
import {BreakObj} from "../nodes/BreakObj";
import {ReturnObj} from "../nodes/ReturnObj";
import {ContinueObj} from "../nodes/ContinueObj";
import {TSGraphControl} from "./TSGraphControl";
import {ErrorsControl, Position} from "./ErrorsControl";
import {Code} from "./C3D/Code";
import {Tmp} from "./C3D/Tmp";
import {ArrayRange} from "./C3D/ArrayRange";

export class SemanticException extends Error {
    constructor(message?: string, position: Position = new Position()) {
        super(message);
        ErrorsControl.AddError(position.first_line, position.first_column, '', message, 'SEMANTIC');
    }
}

export class ErrorCompo extends Error {
    constructor(message?: string, position: Position = new Position()) {
        super(message);
        ErrorsControl.AddError(position.first_line, position.first_column, '', message, 'SEMANTIC');
    }
}

export function DefaultValue(typo: string): Cntnr {
    if (IsPrimitiveTypo(typo)) {
        return new UNDEFINED();
    }
    return GetObjectValue(typo);
}

export function DefaultValueNoUndefined(typo: string): Cntnr {
    typo = typo.toUpperCase();
    switch (typo) {
        case "STRING":
            return new STRING();
        case "NUMBER":
            return new NUMBER();
        case "BOOLEAN":
            return new BOOLEAN();
        case "ANY":
            return new ARRAY();
        case "ARRAY":
            return new ARRAY();
        case "NULL":
            return new NULL();
        case "UNDEFINED":
            return new UNDEFINED();
        default:
            return GetObjectValue(typo);
    }
}

export function IsPrimitiveTypo(typo: string): boolean {
    typo = typo.toUpperCase();
    switch (typo) {
        case "STRING":
        case "NUMBER":
        case "BOOLEAN":
        case "ANY":
        case "ARRAY":
        case "NULL":
        case "UNDEFINED":
            return true;
        default:
            return false;
    }
}

export function GetObjectValue(typo: string): Cntnr {
    typo = typo.toUpperCase();
    let structure: ObjectStructure = ObjectsStructures.objects.get(typo);
    if (structure === null || structure === undefined) {
        throw new SemanticException(`No existe una definicion para el tipo ${typo}`);
    }
    return structure.GetDefaultValue();
}

export function FindVar(cont: Cntnr, identifier: string): Cntnr {
    let ownerCntnr = cont;

    while (ownerCntnr != null) {
        if (ownerCntnr.GetProperty(identifier) !== undefined) {
            return ownerCntnr.GetProperty(identifier);
        }
        ownerCntnr = ownerCntnr.GetOwner();
    }

    throw  new SemanticException(`identificador ${identifier} no encontrado`);
}

export function TSGraph(envmnt: Cntnr): string {
    let ownerCntnr = envmnt;
    while (true) {
        if (ownerCntnr.GetOwner() == null) {
            break;
        }
        ownerCntnr = ownerCntnr.GetOwner();
    }
    return ownerCntnr.GetTSGraph('global');
}

export function TSGraph2(sentences: Array<Op>): string {
    let value = '';
    const graphId = TSGraphControl.GetGraphId();
    value += `subgraph cluster_${graphId} { \n`;
    value += 'style=filled;\n' +
        'color="#2BBBAD";\n' +
        'fillcolor="#1E222A";\n';
    value += 'node [color="#2BBBAD" fontcolor="#2BBBAD" shape="rectangle"] \n';
    sentences.forEach(sentence => {
        value += sentence.GetTSGraph();
    });
    value += `label = "${'GLOBAL'}";\n`;
    value += `}\n`
    return value;
}

export function PassPropsAndFuncs(father: Envmnt, son: Envmnt) {
    // father.props.forEach((v, k) => {
    //     son.Declare(k, v);
    // });
}

export function GetReferenceValueCode(code: Code): Code {
    if (!(code.getValue() instanceof Reference))
        return code;
    const codeAns = new Code(code);
    codeAns.setValue((code.getValue() as Reference).getValue());
    codeAns.setPointer(Tmp.newTmp());
    if (!code.isHeap) {
        codeAns.GetFromStack(code.getPointer());
    } else {
        codeAns.GetFromHeap(code.getPointer());
        codeAns.isHeap = code.isHeap;
    }
    //TODO tmpmanager ??
    return codeAns;
}

export function LogicWhile(env: Envmnt, condition: Op, sentences: Array<Op>, extra: Op) {
    let ans = condition.Exe(env);
    if (ans instanceof Reference) {
        ans = (ans as Reference).getValue();
    }

    if (!(ans instanceof BOOLEAN)) {
        throw new SemanticException("Condicion utilizada en ciclo while no soportada");
    }

    let tmp = ans as BOOLEAN;
    while (tmp.getValue()) {
        const env0 = new Envmnt(env, sentences);
        PassPropsAndFuncs(env, env0);
        const ret = env0.GO_ALL();

        if (ret instanceof BreakObj) {
            break;
        }
        if (ret instanceof ReturnObj) {
            return ret;
        }
        if (ret instanceof ContinueObj) {
            continue;
        }

        if (extra !== null) {
            extra.Exe(env);
        }

        let ans0 = condition.Exe(env);
        if (ans0 instanceof Reference) {
            ans0 = (ans0 as Reference).getValue();
        }
        tmp = ans0 as BOOLEAN;
    }
    return null;
}

export function LogicDoWhile(env: Envmnt, condition: Op, sentences: Array<Op>, extra: Op) {
    let ans = condition.Exe(env);
    if (ans instanceof Reference) {
        ans = (ans as Reference).getValue();
    }

    if (!(ans instanceof BOOLEAN)) {
        throw new SemanticException("Condicion utilizada en ciclo while no soportada");
    }

    let env0 = new Envmnt(env, sentences);
    PassPropsAndFuncs(env, env0);
    env0.GO_ALL();

    let ans0 = condition.Exe(env);
    if (ans0 instanceof Reference) {
        ans0 = (ans0 as Reference).getValue();
    }
    let tmp = ans0 as BOOLEAN;

    while (tmp.getValue()) {
        const env0 = new Envmnt(env, sentences);
        PassPropsAndFuncs(env, env0);
        const ret = env0.GO_ALL();

        if (ret instanceof BreakObj) {
            break;
        }
        if (ret instanceof ReturnObj) {
            return ret;
        }
        if (ret instanceof ContinueObj) {
            continue;
        }

        if (extra !== null) {
            extra.Exe(env);
        }

        let ans0 = condition.Exe(env);
        if (ans0 instanceof Reference) {
            ans0 = (ans0 as Reference).getValue();
        }
        tmp = ans0 as BOOLEAN;
    }
    return null;
}

export class MyMap {
    private readonly map: Map<any, any>;

    constructor() {
        this.map = new Map<any, any>();
    }

    getMap() {
        return this.map;
    }

    addEntry(key: any, value: any) {
        this.map.set(key, value);
    }
}

export class ObjectStructure {
    private readonly properties: Map<string, string>;

    constructor(properties: Map<string, string>) {
        this.properties = properties;
    }

    GetDefaultValue(): Cntnr {
        const attributes: Map<string, Cntnr> = new Map<string, Cntnr>();
        this.properties.forEach((v, k) => {
            if (IsPrimitiveTypo(v)) {
                attributes.set(k, DefaultValueNoUndefined(v));
            } else {
                attributes.set(k, new UNDEFINED());
            }
        });
        return new OBJECT(attributes);
    }
}

export class ObjectsStructures {
    public static objects: Map<string, ObjectStructure> = new Map<string, ObjectStructure>();
}

export function ArrayMemorySize(ranges: Array<ArrayRange>): number {
    let ans = 1;
    for (let range of ranges) {
        ans *= range.eIndex - range.sIndex + 1;
    }
    return ans;
}

export function ArrayPosition(ranges: Array<ArrayRange>, indexes: Array<number>) {
    let ans = 0;
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        let index = indexes[i];
        index = index - range.sIndex;

        for (let j = i + 1; j < ranges.length; j++) {
            const r = ranges[j];
            index *= (r.eIndex - r.sIndex + 1);
        }

        ans += index;
    }
    return ans;
}

export function ArrayPositionCode(ranges: Array<ArrayRange>, codes: Array<Code>) {
    const ans = new Code();
    ans.setPointer(Tmp.newTmp());
    ans.appendValueToPointer("0");


    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const index = codes[i];
        //index.appendResta(index.getPointer(), range.sIndex + "", "-sIndex");
        //index = index - range.sIndex;

        for (var j = i + 1; j < ranges.length; j++) {
            const r = ranges[j];
            //index *= (r.fIndex - r.sIndex + 1);
            const codeTmp = new Code();
            codeTmp.setPointer(Tmp.newTmp());
            codeTmp.appendResta(r.eIndex + "", r.sIndex + "", "fIndex - sIndex");
            codeTmp.appendSuma(codeTmp.getPointer(), "1", "+1");

            ans.append(codeTmp);
            index.appendMulti(index.getPointer(), codeTmp.getPointer());
        }
        ans.append(index);
        ans.appendSuma(ans.getPointer(), index.getPointer());
        //ans += index;
    }
    return ans;
}
