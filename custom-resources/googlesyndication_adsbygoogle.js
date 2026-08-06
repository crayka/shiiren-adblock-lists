// Some anti-adblock scripts (e.g. CHP Adblock) grep this response body for
// known ad-blocker stub signatures before showing their wall -- keep this
// file's wording and CSS values free of any such recognizable fingerprint.
(function () {
    'use strict';
    const init = () => {
        window.adsbygoogle = {
            loaded: true,
            push: function () {
            }
        };
        const phs = document.querySelectorAll('.adsbygoogle');
        const css = 'width:0 !important;height:0 !important;overflow:hidden !important;';
        for (let i = 0; i < phs.length; i++) {
            const id = `aswift_${i}`;
            if (document.querySelector(`iframe#${id}`) !== null) { continue; }
            const fr = document.createElement('iframe');
            fr.id = id;
            fr.style = css;
            const cfr = document.createElement('iframe');
            cfr.id = `google_ads_frame${i}`;
            fr.appendChild(cfr);
            phs[i].appendChild(fr);
        }
    };
    if (
        document.querySelectorAll('.adsbygoogle').length === 0 &&
        document.readyState === 'loading'
    ) {
        window.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
