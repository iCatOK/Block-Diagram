//depends: block

type PossibleIfChildren = 2 | 3

function blockContainsDecision(block: Block): boolean {
    if (block instanceof IfHorizontalBlock) {
        return true
    }
    if (block instanceof SimpleBlockOfBlocks || block instanceof HorizontalBranchBlockOfBlocks) {
        for (let inner of block.innerElements) {
            if (blockContainsDecision(inner)) return true
        }
    }
    return false
}


class IfHorizontalBlock extends BlockOfBlocks {


    static TITLE_POSITION: TitlePosition[][] = (function () {
        let center = TitlePosition.new("hanging", "start", Vector.new(5, 0));
        let left = TitlePosition.new("auto", "end", Vector.new(0, -5));
        let right = TitlePosition.new("auto", "start", Vector.new(0, -5));
        return [
            [],
            [center],
            [left, right],
            [left, center, right],
        ]
    })()
    static POSITIONS: Vector[][] = [
        [],
        [Vector.new(0.5, 1)],
        [Vector.new(0, 0.5), Vector.new(1, 0.5)],
        [Vector.new(0, 0.5), Vector.new(0.5, 1), Vector.new(1, 0.5)],
    ];
    justParallel: boolean = true
    type = IfHorizontalBlock

    constructor(rootElement: PreparedGraphElement) {
        super(rootElement);
    }

    addBlock(block: Block): BlockOfBlocks {
        this.innerElements.push(block)
        return this;
    }

    addElement(element: PreparedGraphElement): BlockOfElements {
        return this.next(new BlockOfElements()).addElement(element);
    }

    apply(applier: (this: IfHorizontalBlock) => void): IfHorizontalBlock {
        applier.apply(this)
        return this
    }

    private usesStackedElseIf(): boolean {
        return this.innerElements.length == 2 && this.innerElements.some(blockContainsDecision)
    }

    private stackedBranchGap(compileInfo: CompileInfo): number {
        return compileInfo.topMargin * 2
    }

    calculateBoundingBox(compileInfo: CompileInfo): BlockBoundingBoxWithChildren {
        if (this.usesStackedElseIf()) {
            return this.calculateStackedBoundingBox(compileInfo)
        }
        let rootElement = this.rootElement!;

        let rootSize = rootElement.measureSize(compileInfo)
        let rootH = rootSize.height
        let rootW = rootSize.width
        let bounds: Bounds;
        let boxes = this.innerElements.map(it => it.calculateBoundingBox(compileInfo));
        let hrootW = rootW / 2
        let size: PossibleIfChildren = this.innerElements.length as PossibleIfChildren
        let left: Bounds, right: Bounds;
        if (size == 3) {
            bounds = boxes[1].bounds.copy()
            left = boxes[0].bounds
            right = boxes[2].bounds

            let leftIn = bounds.left - this.marginBetweenBlocks - left.right;

            let rightIn = bounds.right + this.marginBetweenBlocks + right.left;
            left.right += Math.max(hrootW + leftIn, 0)
            right.left -= Math.max(hrootW - rightIn, 0)
        } else {
            bounds = Bounds.makeZero()
            left = boxes[0].bounds
            right = boxes[1].bounds
            left.right += Math.max(hrootW - left.right, 0)
            right.left -= Math.max(hrootW + right.left, 0)
        }

        let margin = size == 3 ? this.marginBetweenBlocks : this.marginBetweenBlocks / 2;
        bounds.merge(left, Direction.Left, margin)
        bounds.merge(right, Direction.Right, margin)
        bounds.bottom += rootH + compileInfo.topMargin;
        bounds.bottom += compileInfo.topMargin * 4;

        return new BlockBoundingBoxWithChildren(bounds, 0, boxes);

    }

    private calculateStackedBoundingBox(compileInfo: CompileInfo): BlockBoundingBoxWithChildren {
        let rootElement = this.rootElement!;
        let rootSize = rootElement.measureSize(compileInfo)
        let rootH = rootSize.height
        let rootW = rootSize.width
        let boxes = this.innerElements.map(it => it.calculateBoundingBox(compileInfo));
        let thenBounds = boxes[0].bounds
        let elseBounds = boxes[1].bounds
        let topMargin = compileInfo.topMargin
        let wirePad = this.marginBetweenBlocks

        let bounds = Bounds.makeZero()
        bounds.expand(-rootW / 2, 0)
        bounds.expand(rootW / 2, rootH)

        let thenY = rootH + topMargin
        bounds.expandBound(thenBounds.copy().shift(0, thenY))

        let elseY = thenY + thenBounds.height() + this.stackedBranchGap(compileInfo)
        bounds.expandBound(elseBounds.copy().shift(0, elseY))

        let rightWire = Math.max(rootW / 2, thenBounds.right, elseBounds.right) + wirePad
        let leftWire = Math.min(-rootW / 2, thenBounds.left, elseBounds.left) - wirePad
        bounds.expand(rightWire, bounds.bottom)
        bounds.expand(leftWire, 0)
        bounds.bottom += topMargin * 3

        return new BlockBoundingBoxWithChildren(bounds, 0, boxes)
    }

    compile(centerXCursor: Cursor, cursorY: Cursor, compileInfo: CompileInfo) {

        const topMargin = compileInfo.topMargin;

        let rootElement = this.rootElement!;

        const rootSize = rootElement.measureSize(compileInfo)
        const rootH = rootSize.height
        const rootW = rootSize.width
        let myBB = this.calculateBoundingBox(compileInfo);

        if (this.usesStackedElseIf()) {
            return this.compileStacked(centerXCursor, cursorY, compileInfo, myBB, rootElement, rootW, rootH, topMargin)
        }

        let svgResult: string[] = [
            "<g class='block if horizontal'>",
            bbToSvg(rootElement.name, myBB, Vector.new(centerXCursor, cursorY), "red", compileInfo),
        ]


        let branchTitles = this.branchTitles;
        let amountOfInner: PossibleIfChildren = this.innerElements.length as PossibleIfChildren
        let positions = IfHorizontalBlock.POSITIONS[amountOfInner];
        let branchInfos: HorizontalBranchInfo[] = this.innerElements.map((element, i) => {

            let position = positions[i];
            let info = new HorizontalBranchInfo();
            info.element = element;
            info.bb = myBB.children[i]
            info.bounds = info.bb.bounds
            info.rootPosition = position.copy()
                .mul(rootW, rootH)
                .add(centerXCursor.value, cursorY.value)
                .add(-rootW / 2, 0)
            if (branchTitles != null) {
                info.title = new BranchTitle(branchTitles[i],IfHorizontalBlock.TITLE_POSITION[amountOfInner][i])
            }
            info.isEmpty = element.isEmpty()
            return info
        })
        switch (amountOfInner) {
            case 2: {
                let left = branchInfos[0];
                let right = branchInfos[1];
                left.offset = new Vector(-left.bounds.right - this.marginBetweenBlocks / 2, 0)
                right.offset = new Vector(-right.bounds.left + this.marginBetweenBlocks / 2, 0)
                break;
            }
            case 3: {
                let left = branchInfos[0];
                let center = branchInfos[1];
                let right = branchInfos[2];

                let leftIn = center.bounds.left - this.marginBetweenBlocks - left.bounds.right;
                let rightIn = center.bounds.right + this.marginBetweenBlocks - right.bounds.left;

                left.offset = new Vector(leftIn, 0)
                right.offset = new Vector(rightIn, 0)
                center.offset = Vector.ZERO
            }
                break;
        }
        svgResult.push.apply(svgResult, rootElement.compile(centerXCursor.value - rootW / 2, cursorY.value, rootW, rootH))
        cursorY.move(rootH)
        cursorY.move(topMargin)

        let startY = cursorY.value

        HorizontalBranchBlockOfBlocks.displayBranches(this, cursorY, branchInfos, centerXCursor, compileInfo, svgResult, topMargin);
        {

            //Drawing lines from root to inner
            for (let i = 0; i < branchInfos.length; i++) {
                let info = branchInfos[i];
                if (info.isEmpty && branchInfos.length == 3 && i == 1) continue
                let from = info.rootPosition!;
                let to = info.output;
                let tox = to.x;
                if (!info.isEmpty) {
                    svgResult.push(makePath([
                        rawSvgLine(tox, from.y, from.x, from.y),
                        rawSvgLine(tox, from.y, tox, startY)
                    ]))
                } else {
                    svgResult.push(makePath([
                        rawSvgLine(tox, from.y, from.x, from.y),
                        rawSvgLine(tox, from.y, tox, to.y)
                    ]))
                }
                if (info.title !== undefined) {
                    let title = info.title;
                    let titlePosition = title.position;
                    svgResult.push(defaultCenterText(
                        from.x + titlePosition.offset.x, from.y + titlePosition.offset.y
                        , 0, 0,
                        title.text,
                        titlePosition.baseline, titlePosition.anchor))
                }
            }
        }
        svgResult.push("</g>")
        return new CompileResult(Vector.new(centerXCursor, cursorY), svgResult)
    }

    private compileStacked(
        centerXCursor: Cursor,
        cursorY: Cursor,
        compileInfo: CompileInfo,
        myBB: BlockBoundingBoxWithChildren,
        rootElement: PreparedGraphElement,
        rootW: number,
        rootH: number,
        topMargin: number
    ): CompileResult {
        const centerX = centerXCursor.value
        const diamondY = cursorY.value
        let svgResult: string[] = [
            "<g class='block if stacked'>",
            bbToSvg(rootElement.name, myBB, Vector.new(centerXCursor, cursorY), "red", compileInfo),
        ]

        svgResult.push.apply(svgResult, rootElement.compile(centerX - rootW / 2, diamondY, rootW, rootH))

        let thenBlock = this.innerElements[0]
        let elseBlock = this.innerElements[1]
        let thenBB = myBB.children[0]
        let elseBB = myBB.children[1]
        let branchTitles = this.branchTitles

        let daPosition = IfHorizontalBlock.TITLE_POSITION[3][1]
        let netPosition = IfHorizontalBlock.TITLE_POSITION[3][2]
        if (branchTitles != null) {
            svgResult.push(defaultCenterText(
                centerX + daPosition.offset.x, diamondY + rootH + daPosition.offset.y,
                0, 0,
                branchTitles[0],
                daPosition.baseline, daPosition.anchor))
            svgResult.push(defaultCenterText(
                centerX + rootW / 2 + netPosition.offset.x, diamondY + rootH / 2 + netPosition.offset.y,
                0, 0,
                branchTitles[1],
                netPosition.baseline, netPosition.anchor))
        }

        cursorY.move(rootH)
        cursorY.move(topMargin)
        let thenStartY = cursorY.value

        let wasLast = compileInfo.isLast
        compileInfo.isLast = false
        let thenResult = thenBlock.compile(centerXCursor, cursorY.clone(), compileInfo)
        svgResult.push.apply(svgResult, thenResult.svgCode)

        let elseStartY = thenStartY + thenBB.bounds.height() + this.stackedBranchGap(compileInfo)
        cursorY.value = elseStartY
        compileInfo.isLast = wasLast
        let elseResult = elseBlock.compile(centerXCursor, cursorY.clone(), compileInfo)
        svgResult.push.apply(svgResult, elseResult.svgCode)
        compileInfo.isLast = wasLast

        let rightWire = Math.max(
            centerX + rootW / 2,
            centerX + thenBB.bounds.right,
            centerX + elseBB.bounds.right
        ) + this.marginBetweenBlocks
        let leftWire = Math.min(
            centerX - rootW / 2,
            centerX + thenBB.bounds.left,
            centerX + elseBB.bounds.left
        ) - this.marginBetweenBlocks

        svgResult.push(makePath([
            rawSvgLine(centerX, diamondY + rootH, centerX, thenStartY)
        ]))
        svgResult.push(makePath([
            rawSvgLine(centerX + rootW / 2, diamondY + rootH / 2, rightWire, diamondY + rootH / 2),
            rawSvgLine(rightWire, diamondY + rootH / 2, rightWire, elseStartY),
            rawSvgLine(rightWire, elseStartY, centerX, elseStartY)
        ]))

        let hasAfter = !wasLast
        if (!hasAfter) {
            let myParent = this.parentInfo
            while (myParent !== undefined) {
                if (myParent.siblingIndex(1) !== undefined) {
                    hasAfter = true
                }
                myParent = myParent.parent.parentInfo
            }
        }

        if (hasAfter) {
            let joinY = elseResult.output.y + topMargin * 2
            cursorY.value = elseResult.output.y + topMargin * 3
            svgResult.push(makePath([
                rawSvgLine(thenResult.output.x, thenResult.output.y, leftWire, thenResult.output.y),
                rawSvgLine(leftWire, thenResult.output.y, leftWire, joinY),
                rawSvgLine(leftWire, joinY, centerX, joinY),
                rawSvgLine(elseResult.output.x, elseResult.output.y, elseResult.output.x, joinY),
                rawSvgLine(centerX, joinY, centerX, cursorY.value)
            ]))
        } else {
            cursorY.value = elseResult.output.y
        }

        svgResult.push("</g>")
        return new CompileResult(Vector.new(centerXCursor, cursorY), svgResult)
    }

}

