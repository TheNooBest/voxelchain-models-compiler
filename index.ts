import * as VoxelChainFormats from "voxelchain-formats";
import * as fs from 'fs/promises';


// F/B - Front, Back; L/R - Left, Right; T/D - Top, Down; C - center
const hugeMap = [
    'FLD', 'FD', 'FRD',
    'FL', 'F', 'FR',
    'FLT', 'FT', 'FRT',

    'LD', 'D', 'RD',
    'L', 'C', 'R',
    'LT', 'T', 'RT',

    'BLD', 'BD', 'BRD',
    'BL', 'B', 'BR',
    'BLT', 'BT', 'BRT',

    'S1', 'S2', 'S3', 'S4',
    'S5', 'S6', 'S7', 'S8',
];

interface IOPin {
    pos: string;
    order: number;
    type: number;
}

enum InputType {
    Power = 1,
}

enum OutputType {
    Power = 1,
}

class InputPin {
    constructor(
        public readonly pos: string,
        public readonly type: InputType,
    ) {
        if (!hugeMap.includes(pos)) {
            throw new Error('Unknown pin position');
        }
        if (type !== InputType.Power && ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].includes(pos)) {
            throw new Error(`State pins must have 'Power' type`);
        }
    }
}

class OutputPin {
    constructor(
        public readonly pos: string,
        public readonly type: OutputType,
        public readonly callback: (inputs: boolean[]) => boolean,
    ) {
        if (!hugeMap.includes(pos)) {
            throw new Error('Unknown pin position');
        }
        if (type !== OutputType.Power && ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].includes(pos)) {
            throw new Error(`State pins must have 'Power' type`);
        }
    }
}


class Compiler {
    private inputs: InputPin[] = [];
    private outputs: OutputPin[] = [];

    constructor() {}

    public setInputs(inputs: InputPin[]): Compiler {
        const usedPins: Set<string> = new Set<string>();

        for (const i of inputs) {
            if (usedPins.has(i.pos)) {
                throw new Error(`Doubled input pin position: ${i.pos}`);
            }
        }

        this.inputs = inputs;
        return this;
    }

    public setOutputs(outputs: OutputPin[]): Compiler {
        const usedPins: Set<string> = new Set<string>();

        for (const i of outputs) {
            if (usedPins.has(i.pos)) {
                throw new Error(`Doubled output pin position: ${i.pos}`);
            }
        }

        this.outputs = outputs;
        return this;
    }

    public compile(print = false): Uint32Array {
        const bdd: Uint32Array = new Uint32Array(2 ** this.inputs.length);

        for (let i = 0; i < bdd.length; i++) {
            const inBits: boolean[] = i.toString(2).padStart(this.inputs.length, '0').split('').map(v => v === '1');
            const outBits: boolean[] = this.outputs.map(v => v.callback(inBits));
            bdd[i] = parseInt([false, ...outBits].map(v => v ? '1' : '0').reverse().join(''), 2);
        }

        if (!print) {
            return bdd;
        }

        const headerInputs: string = this.inputs.map(i => i.pos.padEnd(3, ' ')).join(' | ');
        const headerOutput: string = this.outputs.map(o => o.pos.padEnd(3, ' ')).join(' | ');
        const headerInputsDivider: string = this.inputs.map(i => '---').join('-+-');
        const headerOutputsDivider: string = this.outputs.map(o => '---').join('-+-');

        console.log(`${headerInputs} || ${headerOutput}`);
        console.log(`${headerInputsDivider}-++-${headerOutputsDivider}`);

        for (let i = 0; i < bdd.length; i++) {
            const bitInput: string[] = i.toString(2).padStart(this.inputs.length, '0').split('');
            const bitOutput: string[] = bdd[i].toString(2).padStart(this.outputs.length + 1, '0').split('').reverse().slice(1);
            console.log(`${bitInput.map(b => b.padEnd(3, ' ')).join(' | ')} || ${bitOutput.map(b => b.padEnd(3, ' ')).join(' | ')}`);
        }
        console.log();

        return bdd;
    }
}


const run = async () => {
    // const buffer = await fs.readFile("material_AND_GATE.vxma")   // Hardcoded material file x_x
    // const binary = new Uint8Array(buffer);
    // const decompressed = VoxelChainFormats.decompressGZIP(binary);

    // const vxma = VoxelChainFormats.parseVXMAFile(decompressed);
    // const module = vxma.material.worldModule;
    // const inputs: IOPin[] = [];
    // const outputs: IOPin[] = [];
    // const bddArray: string[] = [];

    // for (const i in module.inputRemap) {
    //     if (module.inputRemap[i] !== 0) {
    //         inputs.push({
    //             pos: hugeMap[Number(i)],
    //             order: module.inputRemap[i],
    //             type: module.input[i],
    //         });
    //     }
    // }

    // for (const o in module.outputRemap) {
    //     if (module.outputRemap[o] !== 0) {
    //         outputs.push({
    //             pos: hugeMap[Number(o)],
    //             order: module.outputRemap[o],
    //             type: module.output[o],
    //         });
    //     }
    // }

    // for (const table of module.bdd) {
    //     for (const bitmap of table) {
    //         bddArray.push(bitmap.toString(2).padStart(outputs.length + 1, '0'));
    //     }
    // }

    // const headerInputs: string = inputs.map(i => i.pos.padEnd(3, ' ')).join(' | ');
    // const headerOutput: string = outputs.map(o => o.pos.padEnd(3, ' ')).join(' | ');
    // const headerInputsDivider: string = inputs.map(i => '---').join('-+-');
    // const headerOutputsDivider: string = outputs.map(o => '---').join('-+-');

    // console.log(`${headerInputs} || ${headerOutput}`);
    // console.log(`${headerInputsDivider}-++-${headerOutputsDivider}`);

    // for (let i = 0; i < bddArray.length; i++) {
    //     const bitInput: string[] = i.toString(2).padStart(inputs.length, '0').split('');
    //     const bitOutput: string[] = bddArray[i].split('').reverse().slice(1);
    //     console.log(`${bitInput.map(b => b.padEnd(3, ' ')).join(' | ')} || ${bitOutput.map(b => b.padEnd(3, ' ')).join(' | ') }`);
    // }

    const compiler: Compiler = new Compiler();

    console.log('AND_GATE')
    compiler.setInputs([
        new InputPin('L', InputType.Power),
        new InputPin('R', InputType.Power),
    ]).setOutputs([
        new OutputPin('T', OutputType.Power, inputs => inputs[0] && inputs[1]),
    ]).compile(true);

    console.log('1-bit adder');
    compiler.setInputs([
        new InputPin('T', InputType.Power),
        new InputPin('D', InputType.Power),
        new InputPin('L', InputType.Power),
    ]).setOutputs([
        new OutputPin('F', OutputType.Power, inputs => inputs[0] !== inputs[1] !== inputs[2]),
        new OutputPin('R', OutputType.Power, inputs => (inputs[0] && inputs[1]) || (inputs[1] && inputs[2]) || (inputs[0] && inputs[2])),
    ]).compile(true);
};
run();
