"use strict";
setTimeout(function () {
    let svgRootElement = document.querySelector(".main_svg");
    let textAreaElement = document.querySelector("textarea.input_area");
    /**@type HTMLLabelElement*/
    let labelElement = document.querySelector("label.error_label");
    /**@type HTMLButtonElement*/
    let generateButton = document.querySelector("button.generate_button");
    let downloadButton = document.querySelector("button.download_button");
    let autoformatButton = document.querySelector("button.auto_format");
    let nameInput = document.querySelector("#save-name");
    autoformatButton.onclick = function () {
        let text = textAreaElement.value;
        Tools.autoformatInArea(textAreaElement);
    };
    document.querySelector("body").addEventListener("keydown", ev => {
        if (ev.key == "l" && ev.ctrlKey && ev.altKey) {
            ev.preventDefault();
            // @ts-ignore
            autoformatButton.onclick();
        }
        else if (ev.key == "Enter" && ev.ctrlKey) {
            ev.preventDefault();
            // @ts-ignore
            generateButton.onclick();
        }
    });
    function inputElement(selectors) {
        let element = document.querySelector(selectors);
        return element;
    }
    generateButton.onclick = function () {
        let result = Parser.parse(textAreaElement.value);
        if (result.error != null) {
            labelElement.innerHTML = result.error;
        }
        else {
            labelElement.innerHTML = "";
            let data = result.data;
            // svgRootElement.innerHTML = data.strings.map(it => defaultCenterText(0, 0, 0, 0, it))
            //     .join("\n")
            let extraWidth = inputElement("input#extra-width").valueAsNumber;
            if (!Number.isFinite(extraWidth))
                extraWidth = 0;
            let topMargin = 15;
            let compileInfo = new CompileInfo(0, topMargin, extraWidth);
            compileInfo.drawBB = inputElement("input#draw-bb").checked;
            // @ts-ignore
            defaultCenterText.drawBB = compileInfo.drawBB;
            if (compileInfo.drawBB)
                BlockBoundingBox.extraSize = BlockBoundingBox.defaultExtraSize.copy();
            else
                BlockBoundingBox.extraSize.set(0, 0);
            let blockBoundingBox = data.block.calculateBoundingBox(compileInfo);
            let boundingBox = blockBoundingBox.bounds;
            console.log(blockBoundingBox);
            let cursorX = new Cursor(0);
            let cursorY = new Cursor(5);
            svgRootElement.innerHTML = SVG_STYLE_PREFIX + data.block.compile(cursorX, cursorY, compileInfo).svgCode.join("\n");
            let safeSpace = topMargin;
            let currentBox = new DOMRect(boundingBox.x(), boundingBox.y(), boundingBox.width(), boundingBox.height() + safeSpace);
            svgRootElement.width.baseVal.value = currentBox.width;
            svgRootElement.height.baseVal.value = currentBox.height;
            if (inputElement("#add-back").checked) {
                svgRootElement.innerHTML = `<rect x="${currentBox.x}" y="${currentBox.y}" width="${currentBox.width}" height="${currentBox.height}" fill="white"></rect>\n` + svgRootElement.innerHTML;
            }
            svgRootElement.setAttribute("viewBox", `${currentBox.x} ${currentBox.y} ${currentBox.width} ${currentBox.height}`);
            svgRootElement.setAttribute("width", `${currentBox.width}px`);
            svgRootElement.setAttribute("height", `${currentBox.height}px`);
            // svgRootElement.width.baseVal.value = currentBox.width-currentBox.x + 10
            // svgRootElement.height.baseVal.value = currentBox.height-currentBox.y + 10
            svgRootElement.width.baseVal.value = currentBox.width + 10;
            svgRootElement.height.baseVal.value = currentBox.height + 10;
        }
    };
    downloadButton.onclick = function () {
        // @ts-ignore
        generateButton.onclick();
        let filename = "brace_preview.svg";
        if (nameInput.value.trim().length != 0) {
            filename = nameInput.value.trim() + ".svg";
        }
        Utils.download(filename, svgRootElement.outerHTML);
    };
});
