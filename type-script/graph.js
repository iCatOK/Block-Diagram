"use strict";
const SHAPE_PAD_X = 14;
const SHAPE_PAD_Y = 8;
const DIAMOND_POINT_X = 22;
const DIAMOND_POINT_Y = 16;
const MIN_RECT_WIDTH = 36;
const MIN_RECT_HEIGHT = 24;
function graphTextToString(text, emptyFallback = "") {
    let resolved = textOr(text, emptyFallback);
    return typeof resolved == "string" ? resolved : resolved.join("\n");
}
class PreparedGraphElement {
    constructor(name, aspect, compile, text = null, fallbackText = "") {
        this.name = name;
        this.aspect = aspect;
        this.compile = compile;
        this.text = text;
        this.fallbackText = fallbackText;
    }
    displayText() {
        let fallback = this.fallbackText;
        if (fallback.length == 0) {
            switch (this.name) {
                case "start":
                    fallback = "Начало";
                    break;
                case "end":
                case "stop":
                    fallback = "Конец";
                    break;
            }
        }
        return graphTextToString(this.text, fallback);
    }
    measureSize(compileInfo) {
        let text = this.displayText();
        let tb = TextUtil.calculateBoundingBox(FONT_SIZE, 1.2, text);
        let tw = tb.width;
        let th = Math.max(tb.height, FONT_SIZE * 1.2);
        let extra = Number.isFinite(compileInfo.extraWidth) ? compileInfo.extraWidth : 0;
        switch (this.name) {
            case "start":
            case "end":
            case "stop":
            case "program": {
                let height = Math.max(th + SHAPE_PAD_Y, 28);
                let width = Math.max(tw + height + extra, height);
                return { width, height };
            }
            case "if":
            case "left_if":
            case "right_if": {
                let width = tw + DIAMOND_POINT_X * 2 + extra;
                let height = th + DIAMOND_POINT_Y * 2;
                let fit = tw / width + th / height;
                if (fit > 1) {
                    width *= fit;
                    height *= fit;
                }
                return { width: width + 4, height: height + 4 };
            }
            case "connector": {
                let d = Math.max(tw, th) + SHAPE_PAD_X;
                return { width: d, height: d };
            }
            default: {
                let width = Math.max(tw + SHAPE_PAD_X * 2 + extra, MIN_RECT_WIDTH);
                let height = Math.max(th + SHAPE_PAD_Y * 2, MIN_RECT_HEIGHT);
                return { width, height };
            }
        }
    }
    /** Drawn width including parallelogram slant that sticks out of the text box. */
    layoutWidth(compileInfo) {
        let size = this.measureSize(compileInfo);
        switch (this.name) {
            case "data":
            case "io":
                return size.width * 1.5;
            default:
                return size.width;
        }
    }
}
class GraphElement {
    constructor(name, aspect, handler) {
        this.name = name;
        this.aspect = aspect;
        this.handler = handler;
    }
    static new(name, aspect, handler) {
        return new GraphElement(name, aspect, handler);
    }
    oneName() {
        return typeof this.name == "string" ? this.name : this.name[0];
    }
}
const graphElement = GraphElement.new;
