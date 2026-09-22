//depends: block, sidedIfBlock, ifHorizontalBlock

class VerticalIfLayout {
    rootW: number
    rootH: number
    branchStart: number
    sideOffset: number
    downEnd: number
    sideEnd: number
    joinY: number
    exitY: number
    downEmpty: boolean
    sideEmpty: boolean
    downBB: BlockBoundingBox
    sideBB: BlockBoundingBox

    constructor(
        rootW: number, rootH: number, branchStart: number, sideOffset: number,
        downEnd: number, sideEnd: number, joinY: number, exitY: number,
        downEmpty: boolean, sideEmpty: boolean,
        downBB: BlockBoundingBox, sideBB: BlockBoundingBox
    ) {
        this.rootW = rootW
        this.rootH = rootH
        this.branchStart = branchStart
        this.sideOffset = sideOffset
        this.downEnd = downEnd
        this.sideEnd = sideEnd
        this.joinY = joinY
        this.exitY = exitY
        this.downEmpty = downEmpty
        this.sideEmpty = sideEmpty
        this.downBB = downBB
        this.sideBB = sideBB
    }
}

/**
 * Vertical elif: first branch ("Да") stays on the spine under the diamond,
 * second branch ("Нет") goes to the right and returns horizontally onto that spine.
 * The merged spine is the only line that continues into the next block.
 */
class VerticalIfBlock extends AbstractBlock {
    rootElement: PreparedGraphElement
    downBranch: IfBlockBranch
    sideBranch: IfBlockBranch
    marginBetweenBlocks: number = 15

    constructor(rootElement: PreparedGraphElement, downBranch: IfBlockBranch, sideBranch: IfBlockBranch) {
        super()
        this.rootElement = rootElement
        this.downBranch = downBranch
        this.sideBranch = sideBranch
    }

    isEmpty(): boolean {
        return false
    }

    isBlockContainer(): boolean {
        return true
    }

    addElement(element: PreparedGraphElement): BlockOfElements {
        return this.next(new BlockOfElements()).addElement(element)
    }

    addBlock(block: Block): BlockOfBlocks {
        let parentInfo = this.assertHasParent()
        parentInfo.parent.addBlock(block)
        return parentInfo.parent
    }

    private layout(compileInfo: CompileInfo): VerticalIfLayout {
        const margin = this.marginBetweenBlocks
        const topMargin = compileInfo.topMargin
        const downBB = this.downBranch.block.calculateBoundingBox(compileInfo)
        const sideBB = this.sideBranch.block.calculateBoundingBox(compileInfo)
        const downEmpty = this.downBranch.block.isEmpty()
        const sideEmpty = this.sideBranch.block.isEmpty()
        const rootSize = this.rootElement.measureSize(compileInfo)
        const branchStart = rootSize.height + topMargin

        let sideOffset = rootSize.width / 2 + margin
        if (!sideEmpty) {
            const clearDown = (downEmpty ? 0 : downBB.bounds.right) + margin - sideBB.bounds.left
            const clearDiamond = rootSize.width / 2 + margin - sideBB.bounds.left
            sideOffset = Math.max(clearDown, clearDiamond)
        }

        const downEnd = branchStart + (downEmpty ? 0 : downBB.bounds.height())
        const sideEnd = branchStart + (sideEmpty ? 0 : sideBB.bounds.height())
        const joinY = Math.max(downEnd, sideEnd) + topMargin
        const exitY = joinY + topMargin * 2

        return new VerticalIfLayout(
            rootSize.width, rootSize.height, branchStart, sideOffset,
            downEnd, sideEnd, joinY, exitY,
            downEmpty, sideEmpty, downBB, sideBB
        )
    }

    calculateBoundingBox(compileInfo: CompileInfo): BlockBoundingBox {
        const layout = this.layout(compileInfo)
        const bounds = Bounds.makeZero()
        bounds.expand(-layout.rootW / 2, 0)
        bounds.expand(layout.rootW / 2, layout.rootH)
        if (!layout.downEmpty) {
            bounds.expandBound(layout.downBB.bounds.copy().shift(0, layout.branchStart))
        }
        if (!layout.sideEmpty) {
            bounds.expandBound(layout.sideBB.bounds.copy().shift(layout.sideOffset, layout.branchStart))
        } else {
            bounds.expand(layout.sideOffset, layout.joinY)
        }
        bounds.expand(0, layout.exitY)
        return BlockBoundingBoxWithChildren.make(bounds, 0, [layout.downBB, layout.sideBB])
    }

    compile(centerXCursor: Cursor, cursorY: Cursor, compileInfo: CompileInfo): CompileResult {
        const topMargin = compileInfo.topMargin
        const layout = this.layout(compileInfo)
        const y0 = cursorY.value
        const spineX = centerXCursor.value
        const svgResult: string[] = [
            "<g class='block if vertical'>",
            bbToSvg(this.rootElement.name, this.calculateBoundingBox(compileInfo), Vector.new(centerXCursor, cursorY), "orange", compileInfo),
        ]

        svgResult.push.apply(svgResult, this.rootElement.compile(
            spineX - layout.rootW / 2, y0, layout.rootW, layout.rootH
        ))

        const downCursor = new Cursor(spineX)
        const downY = new Cursor(y0 + layout.branchStart)
        let downOut = Vector.new(spineX, y0 + layout.downEnd)
        if (!layout.downEmpty) {
            const compiled = this.downBranch.block.compile(downCursor, downY, compileInfo)
            svgResult.push.apply(svgResult, compiled.svgCode)
            downOut = compiled.output
        }

        const sideX = spineX + layout.sideOffset
        const sideCursor = new Cursor(sideX)
        const sideY = new Cursor(y0 + layout.branchStart)
        let sideOut = Vector.new(sideX, y0 + layout.sideEnd)
        if (!layout.sideEmpty) {
            const compiled = this.sideBranch.block.compile(sideCursor, sideY, compileInfo)
            svgResult.push.apply(svgResult, compiled.svgCode)
            sideOut = compiled.output
        }

        const joinY = Math.max(downOut.y, sideOut.y, y0 + layout.joinY)
        const exitY = Math.max(joinY + topMargin * 2, y0 + layout.exitY)

        const bottomPoint = Vector.new(spineX, y0 + layout.rootH)
        const rightPoint = Vector.new(spineX + layout.rootW / 2, y0 + layout.rootH / 2)
        this.drawExitTitle(svgResult, this.downBranch, 1, layout, spineX, y0)
        this.drawExitTitle(svgResult, this.sideBranch, 2, layout, spineX, y0)

        const entry: string[] = []
        this.pushSegment(entry, bottomPoint.x, bottomPoint.y, spineX, y0 + layout.branchStart)
        this.pushSegment(entry, rightPoint.x, rightPoint.y, sideX, rightPoint.y)
        this.pushSegment(entry, sideX, rightPoint.y, sideX, layout.sideEmpty ? joinY : y0 + layout.branchStart)
        if (entry.length > 0) svgResult.push(makePath(entry))

        const merge: string[] = []
        this.pushOntoSpine(merge, downOut.x, downOut.y, spineX, joinY)
        if (!(layout.sideEmpty && Math.abs(sideOut.y - joinY) < 0.5)) {
            this.pushSegment(merge, sideOut.x, sideOut.y, sideOut.x, joinY)
        }
        this.pushSegment(merge, sideOut.x, joinY, spineX, joinY)
        this.pushSegment(merge, spineX, joinY, spineX, exitY)
        if (merge.length > 0) svgResult.push(makePath(merge))

        svgResult.push("</g>")
        cursorY.value = exitY
        return new CompileResult(Vector.new(spineX, exitY), svgResult)
    }

    private drawExitTitle(svgResult: string[], branch: IfBlockBranch, positionIndex: number, layout: VerticalIfLayout, spineX: number, y0: number) {
        const position = IfHorizontalBlock.POSITIONS[3][positionIndex].copy()
            .mul(layout.rootW, layout.rootH)
            .add(spineX, y0)
            .add(-layout.rootW / 2, 0)
        const titlePosition = IfHorizontalBlock.TITLE_POSITION[3][positionIndex]
        svgResult.push(defaultCenterText(
            position.x + titlePosition.offset.x,
            position.y + titlePosition.offset.y,
            0, 0,
            branch.title,
            titlePosition.baseline,
            titlePosition.anchor
        ))
    }

    private pushSegment(lines: string[], x1: number, y1: number, x2: number, y2: number) {
        if (Math.abs(x1 - x2) < 0.5 && Math.abs(y1 - y2) < 0.5) return
        lines.push(rawSvgLine(x1, y1, x2, y2))
    }

    /** Drop onto the spine, jogging horizontally first when the branch exits off-axis. */
    private pushOntoSpine(lines: string[], x: number, y: number, spineX: number, joinY: number) {
        if (Math.abs(x - spineX) >= 0.5) {
            this.pushSegment(lines, x, y, spineX, y)
            this.pushSegment(lines, spineX, y, spineX, joinY)
        } else {
            this.pushSegment(lines, spineX, y, spineX, joinY)
        }
    }
}

class ElifCase {
    diamond: PreparedGraphElement
    body: Block

    constructor(diamond: PreparedGraphElement, body: Block) {
        this.diamond = diamond
        this.body = body
    }
}

class ElifCasePlacement {
    diamondTop: number = 0
    diamondW: number = 0
    diamondH: number = 0
    bodyTop: number = 0
    bodyCenter: number = 0
    bodyEmpty: boolean = false
    bodyBB!: BlockBoundingBox
}

/**
 * Flat elif chain. Each "Да" body sits in one column to the right.
 * "Нет" falls through down the spine to the next condition.
 * Side bodies meet on a bus and enter the next block only after the whole chain.
 */
class VerticalElifChain extends AbstractBlock {
    cases: ElifCase[]
    elseBody: Block | null
    marginBetweenBlocks: number = 15

    constructor(cases: ElifCase[], elseBody: Block | null) {
        super()
        this.cases = cases
        this.elseBody = elseBody
    }

    isEmpty(): boolean {
        return false
    }

    isBlockContainer(): boolean {
        return true
    }

    addElement(element: PreparedGraphElement): BlockOfElements {
        return this.next(new BlockOfElements()).addElement(element)
    }

    addBlock(block: Block): BlockOfBlocks {
        let parentInfo = this.assertHasParent()
        parentInfo.parent.addBlock(block)
        return parentInfo.parent
    }

    private place(compileInfo: CompileInfo): { cases: ElifCasePlacement[], elseTop: number, elseBB: BlockBoundingBox | null, busX: number, joinY: number, exitY: number } {
        const margin = this.marginBetweenBlocks
        const topMargin = compileInfo.topMargin
        const placements: ElifCasePlacement[] = []
        let bodyCenter = 0
        for (let item of this.cases) {
            const size = item.diamond.measureSize(compileInfo)
            const bb = item.body.calculateBoundingBox(compileInfo)
            const place = new ElifCasePlacement()
            place.diamondW = size.width
            place.diamondH = size.height
            place.bodyBB = bb
            place.bodyEmpty = item.body.isEmpty()
            const clearDiamond = size.width / 2 + margin - (place.bodyEmpty ? 0 : bb.bounds.left)
            bodyCenter = Math.max(bodyCenter, clearDiamond)
            placements.push(place)
        }

        let y = 0
        for (let place of placements) {
            place.diamondTop = y
            place.bodyTop = place.diamondTop + place.diamondH + topMargin
            place.bodyCenter = bodyCenter
            const bodyH = place.bodyEmpty ? 0 : place.bodyBB.bounds.height()
            y = place.bodyTop + bodyH + topMargin
        }

        const elseBB = this.elseBody == null ? null : this.elseBody.calculateBoundingBox(compileInfo)
        const elseEmpty = this.elseBody == null || this.elseBody.isEmpty()
        const elseTop = y
        const elseH = elseEmpty || elseBB == null ? 0 : elseBB.bounds.height()
        const spineBottom = elseTop + elseH

        let busX = bodyCenter
        for (let place of placements) {
            if (place.bodyEmpty) continue
            busX = Math.max(busX, place.bodyCenter + place.bodyBB.bounds.right + margin)
        }
        if (!elseEmpty && elseBB != null) {
            busX = Math.max(busX, elseBB.bounds.right + margin)
        }

        const joinY = spineBottom + topMargin
        const exitY = joinY + topMargin * 2
        return { cases: placements, elseTop, elseBB, busX, joinY, exitY }
    }

    calculateBoundingBox(compileInfo: CompileInfo): BlockBoundingBox {
        const layout = this.place(compileInfo)
        const bounds = Bounds.makeZero()
        for (let place of layout.cases) {
            bounds.expand(-place.diamondW / 2, place.diamondTop)
            bounds.expand(place.diamondW / 2, place.diamondTop + place.diamondH)
            if (!place.bodyEmpty) {
                bounds.expandBound(place.bodyBB.bounds.copy().shift(place.bodyCenter, place.bodyTop))
            }
        }
        if (layout.elseBB != null && (this.elseBody == null || !this.elseBody.isEmpty())) {
            bounds.expandBound(layout.elseBB.bounds.copy().shift(0, layout.elseTop))
        }
        bounds.expand(layout.busX, layout.joinY)
        bounds.expand(0, layout.exitY)
        return BlockBoundingBox.make(bounds, 0)
    }

    compile(centerXCursor: Cursor, cursorY: Cursor, compileInfo: CompileInfo): CompileResult {
        const topMargin = compileInfo.topMargin
        const layout = this.place(compileInfo)
        const y0 = cursorY.value
        const spineX = centerXCursor.value
        const svgResult: string[] = [
            "<g class='block if vertical chain'>",
            bbToSvg("elif", this.calculateBoundingBox(compileInfo), Vector.new(centerXCursor, cursorY), "orange", compileInfo),
        ]

        const bodyOuts: Vector[] = []
        for (let i = 0; i < this.cases.length; i++) {
            const item = this.cases[i]
            const place = layout.cases[i]
            const diamondX = spineX - place.diamondW / 2
            const diamondY = y0 + place.diamondTop
            svgResult.push.apply(svgResult, item.diamond.compile(diamondX, diamondY, place.diamondW, place.diamondH))
            this.drawDiamondTitles(svgResult, spineX, diamondY, place.diamondW, place.diamondH)

            const bodyX = spineX + place.bodyCenter
            const bodyY = y0 + place.bodyTop
            let bodyOut = Vector.new(bodyX, bodyY)
            if (!place.bodyEmpty) {
                const compiled = item.body.compile(new Cursor(bodyX), new Cursor(bodyY), compileInfo)
                svgResult.push.apply(svgResult, compiled.svgCode)
                bodyOut = compiled.output
            }
            bodyOuts.push(bodyOut)

            const rightX = spineX + place.diamondW / 2
            const rightY = diamondY + place.diamondH / 2
            const bottomY = diamondY + place.diamondH
            const entry: string[] = []
            this.pushSegment(entry, rightX, rightY, bodyX, rightY)
            this.pushSegment(entry, bodyX, rightY, bodyX, bodyY)
            const nextTop = i + 1 < layout.cases.length
                ? y0 + layout.cases[i + 1].diamondTop
                : y0 + layout.elseTop
            this.pushSegment(entry, spineX, bottomY, spineX, nextTop)
            svgResult.push(makePath(entry))
        }

        let spineEnd = y0 + layout.elseTop
        if (this.elseBody != null && !this.elseBody.isEmpty()) {
            const compiled = this.elseBody.compile(new Cursor(spineX), new Cursor(y0 + layout.elseTop), compileInfo)
            svgResult.push.apply(svgResult, compiled.svgCode)
            spineEnd = compiled.output.y
        }

        const joinY = Math.max(y0 + layout.joinY, spineEnd + topMargin, ...bodyOuts.map(it => it.y + topMargin))
        const exitY = Math.max(y0 + layout.exitY, joinY + topMargin * 2)
        const busX = spineX + layout.busX
        const merge: string[] = []
        let busTop = joinY
        let hasSide = false
        for (let i = 0; i < bodyOuts.length; i++) {
            if (layout.cases[i].bodyEmpty) continue
            const out = bodyOuts[i]
            this.pushSegment(merge, out.x, out.y, busX, out.y)
            busTop = Math.min(busTop, out.y)
            hasSide = true
        }
        if (hasSide) {
            this.pushSegment(merge, busX, busTop, busX, joinY)
            this.pushSegment(merge, busX, joinY, spineX, joinY)
        }
        this.pushSegment(merge, spineX, spineEnd, spineX, joinY)
        this.pushSegment(merge, spineX, joinY, spineX, exitY)
        if (merge.length > 0) svgResult.push(makePath(merge))

        svgResult.push("</g>")
        cursorY.value = exitY
        return new CompileResult(Vector.new(spineX, exitY), svgResult)
    }

    private drawDiamondTitles(svgResult: string[], spineX: number, diamondY: number, diamondW: number, diamondH: number) {
        const titles = ["", "Нет", "Да"]
        for (let index = 1; index <= 2; index++) {
            const position = IfHorizontalBlock.POSITIONS[3][index].copy()
                .mul(diamondW, diamondH)
                .add(spineX, diamondY)
                .add(-diamondW / 2, 0)
            const titlePosition = IfHorizontalBlock.TITLE_POSITION[3][index]
            svgResult.push(defaultCenterText(
                position.x + titlePosition.offset.x,
                position.y + titlePosition.offset.y,
                0, 0,
                titles[index],
                titlePosition.baseline,
                titlePosition.anchor
            ))
        }
    }

    private pushSegment(lines: string[], x1: number, y1: number, x2: number, y2: number) {
        if (Math.abs(x1 - x2) < 0.5 && Math.abs(y1 - y2) < 0.5) return
        lines.push(rawSvgLine(x1, y1, x2, y2))
    }
}
