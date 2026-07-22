"use strict";
(function () {
    let KEY = "bd-theme";
    let root = document.documentElement;
    let stored = null;
    try {
        stored = localStorage.getItem(KEY);
    }
    catch (e) { /* ignore */ }
    if (stored === "dark" || stored === "light") {
        root.setAttribute("data-theme", stored);
    }
    function systemPrefersDark() {
        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    function currentIsDark() {
        let attr = root.getAttribute("data-theme");
        if (attr === "dark")
            return true;
        if (attr === "light")
            return false;
        return systemPrefersDark();
    }
    function bind() {
        let btn = document.querySelector(".theme-toggle");
        if (!btn)
            return;
        btn.addEventListener("click", function () {
            let next = currentIsDark() ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try {
                localStorage.setItem(KEY, next);
            }
            catch (e) { /* ignore */ }
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind);
    }
    else {
        bind();
    }
})();
