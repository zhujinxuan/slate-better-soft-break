// @flow
import { type Change, type Node } from 'slate';
import inlineValidation from './inlineValidation';
import type Options from './options';

function createValidateNode(opts: Options) {
    return (node: Node): void | (Change => *) => {
        if (node.object === 'inline') return inlineValidation(node);
        if (node.object !== 'block') return undefined;
        if (!node.isLeafBlock()) return undefined;
        if (opts.softBreakIn.indexOf(node.type) !== -1) return undefined;
        if (node.text.indexOf('\n') === -1) return undefined;
        return change => {
            node
                .getTexts()
                .reverse()
                .forEach(t => {
                    let lastIndex = t.text.lastIndexOf('\n');
                    while (lastIndex !== -1) {
                        change.removeTextByKey(t.key, lastIndex, 1, {
                            normalize: false
                        });
                        splitNode(change, node.key, t.key, lastIndex);
                        lastIndex =
                            lastIndex !== 0
                                ? t.text.lastIndexOf('\n', lastIndex - 1)
                                : -1;
                    }
                });
        };
    };
}

function isStartByKey(node: Node, key: string) {
    if (node.key === key) return true;
    if (node.object === 'text') return false;
    const firstValid = node.nodes.find(
        n => n.key === key || n.object !== 'text' || n.text !== ''
    );
    if (!firstValid) return false;
    return isStartByKey(firstValid, key);
}

function splitNode(
    change: Change,
    key: string,
    textKey: string,
    index: number
): Change {
    if (index !== 0)
        return change.splitDescendantsByKey(key, textKey, index, {
            normalize: false
        });
    const { document } = change.value;
    const node = document.getDescendant(key);
    const reverseAncestors = node
        .getAncestors(textKey)
        .reverse()
        .skipWhile(n => isStartByKey(n, textKey));
    if (reverseAncestors.size === 0) {
        return change.splitNodeByKey(key, 0, { normalize: false });
    }
    let target = null;
    reverseAncestors.forEach(n => {
        const splitIndex =
            (target === null ? 1 : 0) +
            n.nodes.indexOf(n.getFurthestAncestor(textKey));
        change.splitNodeByKey(n.key, splitIndex, { normalize: false, target });
        target = splitIndex;
    });
    return change;
}
export default createValidateNode;
