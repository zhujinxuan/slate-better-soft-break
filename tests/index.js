import fs from 'fs';
import path from 'path';
import assert from 'assert';

import createSoftBreakPlugin from '../lib/';

const ignoreWhen = (event, value) => {
    const { startOffset, startText, startBlock } = value;
    return (
        startBlock.text.length === startOffset &&
        startText === startBlock.getLastText()
    );
};
const plugin = createSoftBreakPlugin({
    softBreakIn: ['code', 'cell'],
    shfitIn: ['cell'],
    ignoreWhen
});

describe('slate-better-soft-break', () => {
    const tests = fs.readdirSync(__dirname);

    tests.forEach(test => {
        if (test[0] === '.' || path.extname(test).length > 0) return;

        it(test, () => {
            const dir = path.resolve(__dirname, test);

            // eslint-disable-next-line
            const {input, output, runChange} = require(path.resolve(dir, 'change.js'))


            const newChange = runChange(plugin, input.change());

            const opts = { preserveSelection: true, preserveData: true };
            const newDocJSon = newChange.value.toJSON(opts);
            assert.deepEqual(newDocJSon, output.toJSON(opts));
        });
    });
});
