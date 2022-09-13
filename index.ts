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


const run = async () => {
    const buffer = await fs.readFile("material_AND_GATE.vxma")   // Hardcoded material file x_x
    const binary = new Uint8Array(buffer);
    const decompressed = VoxelChainFormats.decompressGZIP(binary);

    const vxma = VoxelChainFormats.parseVXMAFile(decompressed);
    const module = vxma.material.worldModule;
    const inputs: IOPin[] = [];
    const outputs: IOPin[] = [];
    const bddArray: string[] = [];

    for (const i in module.inputRemap) {
        if (module.inputRemap[i] !== 0) {
            inputs.push({
                pos: hugeMap[Number(i)],
                order: module.inputRemap[i],
                type: module.input[i],
            });
        }
    }

    for (const o in module.outputRemap) {
        if (module.outputRemap[o] !== 0) {
            outputs.push({
                pos: hugeMap[Number(o)],
                order: module.outputRemap[o],
                type: module.output[o],
            });
        }
    }

    for (const table of module.bdd) {
        for (const bitmap of table) {
            bddArray.push(bitmap.toString(2).padStart(outputs.length + 1, '0'));
        }
    }

    const headerInputs: string = inputs.map(i => i.pos.padEnd(3, ' ')).join(' | ');
    const headerOutput: string = outputs.map(o => o.pos.padEnd(3, ' ')).join(' | ');
    const headerInputsDivider: string = inputs.map(i => '---').join('-+-');
    const headerOutputsDivider: string = outputs.map(o => '---').join('-+-');

    console.log(`${headerInputs} || ${headerOutput}`);
    console.log(`${headerInputsDivider}-++-${headerOutputsDivider}`);

    for (let i = 0; i < bddArray.length; i++) {
        const bitInput: string[] = i.toString(2).padStart(inputs.length, '0').split('');
        const bitOutput: string[] = bddArray[i].split('').reverse().slice(1);
        console.log(`${bitInput.map(b => b.padEnd(3, ' ')).join(' | ')} || ${bitOutput.map(b => b.padEnd(3, ' ')).join(' | ') }`);
    }
};
run();
