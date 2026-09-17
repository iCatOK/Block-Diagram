"use strict";
//depends: block
class BlockOfElements extends AbstractBlock {
    constructor() {
        super(...arguments);
        this.type = BlockOfElements;
        this.innerElements = [];
    }
    calculateBoundingBox(compileInfo) {
        let width = 0;
        let height = this.innerElements.length == 0 ? 0 : (this.innerElements.length - 1) * compileInfo.topMargin;
        for (let innerElement of this.innerElements) {
            width = Math.max(width, innerElement.layoutWidth(compileInfo));
            height += innerElement.measureSize(compileInfo).height;
        }
        return BlockBoundingBox.makeCenter(width, height, 0);
    }
    isEmpty() {
        return this.innerElements.length == 0;
    }
    addBlock(block) {
        let parentInfo = this.assertHasParent();
        parentInfo.parent.addBlock(block);
        return parentInfo.parent;
    }
    addElement(element) {
        this.innerElements.push(element);
        return this;
    }
    isBlockContainer() {
        return false;
    }
    compile(x, y, compileInfo) {
        const topMargin = compileInfo.topMargin;
        let svgResult = [
            bbToSvg("elements", this.calculateBoundingBox(compileInfo), Vector.new(x, y), "blue", compileInfo)
        ];
        let prevPosition = null;
        console.log(x, y);
        for (let i = 0; i < this.innerElements.length; i++) {
            let innerElement = this.innerElements[i];
            let size = innerElement.measureSize(compileInfo);
            let height = size.height;
            let width = size.width;
            if (prevPosition !== null) {
                svgResult.push(svgLine(x.value, y.value, x.value, y.value - topMargin));
            }
            // noinspection SillyAssignmentJS
            prevPosition = prevPosition; //Because of PhpStorm inspections
            svgResult.push.apply(svgResult, innerElement.compile(x.value - width / 2, y.value, width, height));
            if (i + 1 < this.innerElements.length) {
                y.move(topMargin + height);
            }
            else {
                y.move(height);
            }
            if (prevPosition === null) {
                prevPosition = Vector.new(0, 0);
            }
            prevPosition.set(x.value, y.value);
        }
        return new CompileResult(prevPosition || Vector.new(x.value, y.value), svgResult);
    }
}
