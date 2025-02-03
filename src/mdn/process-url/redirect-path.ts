export const mdnRedirectPath = (locale: string) : Record<string, string> => ({
  // https://github.com/myfreeer/mdn-local/issues/34
  // https://github.com/mdn/yari/pull/39
  // https://github.com/website-local/mdn-local/issues/211
  '/media/redesign/img/favicon32.png': '/favicon.ico',
  // https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/Places/Using_the_Places_keywords_AP
  [`/${locale}/docs/CSS/CSS_transitions`]:
    `/${locale}/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions`,
  [`/${locale}/docs/Mozilla/Add-ons/WebExtensions/Using_the_JavaScript_APIs`]:
    `/${locale}/docs/Mozilla/Add-ons/WebExtensions/API`,
  [`/${locale}/docs/Web/Reference/Events/ended`]:
    `/${locale}/docs/Web/API/HTMLMediaElement/ended_event`,
  [`/${locale}/docs/Web/Reference/Events/upgradeneeded_indexedDB`]:
    `/${locale}/docs/Web/API/IDBOpenDBRequest/upgradeneeded_event`,
  [`/${locale}/docs/Alternative_style_sheets`]:
    `/${locale}/docs/Web/CSS/Alternative_style_sheets`,
  [`/${locale}/docs/DOM/event.charCode`]:
    `/${locale}/docs/Web/API/KeyboardEvent/charCode`,
  [`/${locale}/WebGL`]:
    `/${locale}/docs/Web/API/WebGL_API`,
  [`/${locale}/DOM/element.tagName`]:
    `/${locale}/docs/Web/API/Element/tagName`,
  [`/${locale}/IndexedDB/IDBObjectStore`]:
    `/${locale}/docs/Web/API/IDBObjectStore`,
  [`/${locale}/docs/Security/MixedContent/fix_website_with_mixed_content`]:
    `/${locale}/docs/Security/MixedContent/How_to_fix_website_with_mixed_content`,
  [`/${locale}/docs/JavaScript/Reference/Global_Objects/Map`]:
    `/${locale}/docs/Web/JavaScript/Reference/Global_Objects/Map`,
  [`/${locale}/docs/DOM/window.clearTimeout`]:
    `/${locale}/docs/Web/API/WindowTimers/clearTimeout`,
  [`/${locale}/DOM/window.openDialog`]:
    `/${locale}/docs/Web/API/Window/openDialog`,
  // [`/${locale}/docs/XUL_School/The_Essentials_of_an_Extension`]: ``,
  [`/${locale}/Apps/Build/Manipulating_media/buffering_seeking_time_ranges`]:
    `/${locale}/docs/Web/Guide/Audio_and_video_delivery/buffering_seeking_time_ranges`,
  [`/${locale}/DOM/document.readyState`]:
    `/${locale}/docs/Web/API/Document/readyState`,
  [`/${locale}/docs/Web/CSS/:-moz-full-screen`]:
    `/${locale}/docs/Web/CSS/:fullscreen`,
  [`/${locale}/docs/DOM/CustomEvent`]:
    `/${locale}/docs/Web/API/CustomEvent`,
  [`/${locale}/DOM/Element.nextElementSibling`]:
    `/${locale}/docs/Web/API/NonDocumentTypeChildNode/nextElementSibling`,
  [`/${locale}/docs/DOM/element.nodeName`]:
    `/${locale}/docs/Web/API/Node/nodeName`,
  [`/${locale}/docs/CSS/Using_CSS_flexible_boxes`]:
    `/${locale}/docs/Web/CSS/CSS_Flexible_Box_Layout/Using_CSS_flexible_boxes`,
  [`/${locale}/docs/Controlling_spell_checking_in_HTML_forms`]:
    `/${locale}/docs/Web/HTML/Global_attributes/spellcheck`,
  [`/${locale}/docs/CSS/Using_URL_values_for_the_cursor_property`]:
    `/${locale}/docs/Web/CSS/cursor/url`,
  [`/${locale}/docs/DOM/Using_dynamic_styling_information`]:
    `/${locale}/docs/Web/API/CSS_Object_Model/Using_dynamic_styling_information`,
  [`/${locale}/docs/Web/CSS/-webkit-animation-fill-mode`]:
    `/${locale}/docs/Web/CSS/animation-fill-mode`,
  [`/${locale}/docs/Web/CSS/-webkit-column-rule-style`]:
    `/${locale}/docs/Web/CSS/column-rule-style`,
  [`/${locale}/docs/Web/CSS/-webkit-hyphens`]:
    `/${locale}/docs/Web/CSS/hyphens`,
  [`/${locale}/docs/Web/CSS/-moz-transform-style`]:
    `/${locale}/docs/Web/CSS/transform-style`,
  // [`/samples/webgl/sample2`]:
  //   `https://mdn.github.io/webgl-examples/tutorial/sample2/`,
  [`/${locale}/docs/Web/CSS/-moz-transition-delay`]:
    `/${locale}/docs/Web/CSS/transition-delay`,
  [`/${locale}/docs/Web/CSS/-webkit-column-width`]:
    `/${locale}/docs/Web/CSS/column-width`,
  [`/${locale}/docs/Web/CSS/-moz-transition-property`]:
    `/${locale}/docs/Web/CSS/transition-property`,
  [`/${locale}/docs/Web/CSS/-moz-perspective`]:
    `/${locale}/docs/Web/CSS/perspective`,
  [`/${locale}/docs/Web/CSS/-webkit-background-size`]:
    `/${locale}/docs/Web/CSS/background-size`,
  [`/${locale}/docs/Web/CSS/-webkit-column-span`]:
    `/${locale}/docs/Web/CSS/column-span`,
  [`/${locale}/docs/Web/CSS/-webkit-border-bottom-right-radius`]:
    `/${locale}/docs/Web/CSS/border-bottom-right-radius`,
  [`/${locale}/docs/Web/CSS/-webkit-background-clip`]:
    `/${locale}/docs/Web/CSS/background-clip`,
  [`/${locale}/docs/Web/CSS/-webkit-box-sizing`]:
    `/${locale}/docs/Web/CSS/box-sizing`,
  [`/${locale}/docs/Web/CSS/-webkit-animation-timing-function`]:
    `/${locale}/docs/Web/CSS/animation-timing-function`,
  [`/${locale}/docs/Web/CSS/-webkit-border-image`]:
    `/${locale}/docs/Web/CSS/border-image`,
  [`/${locale}/docs/Web/CSS/-webkit-column-gap`]:
    `/${locale}/docs/Web/CSS/column-gap`,
  [`/${locale}/docs/Web/CSS/-moz-transition`]:
    `/${locale}/docs/Web/CSS/transition`,
  [`/${locale}/docs/Web/CSS/-webkit-animation`]:
    `/${locale}/docs/Web/CSS/animation`,
  [`/${locale}/docs/Web/CSS/-webkit-animation-duration`]:
    `/${locale}/docs/Web/CSS/animation-duration`,
  [`/${locale}/docs/Web/CSS/-webkit-column-rule-color`]:
    `/${locale}/docs/Web/CSS/column-rule-color`,
  [`/${locale}/docs/Web/API/Web_Animations_API/Animation_timing_options`]:
    `/${locale}/docs/Web/API/EffectTiming`,
  [`/${locale}/docs/Project:The_Kuma_API`]:
    `/${locale}/docs/MDN/Contribute/Tools/Document_parameters`,
  [`/${locale}/docs/Web/CSS/-moz-transition-duration`]:
    `/${locale}/docs/Web/CSS/transition-duration`,
  [`/${locale}/docs/Gecko_User_Agent_Strings`]:
    `/${locale}/docs/Web/HTTP/Headers/User-Agent/Firefox`,
  // [`/${locale}/Gecko_Plugin_API_Reference/Plug-in_Development_Overview`]:`404`,
  [`/${locale}/docs/Web/CSS/dominant-baseline`]:
    `/${locale}/docs/Web/SVG/Attribute/dominant-baseline`,
  [`/${locale}/docs/Web/CSS/-webkit-perspective`]:
    `/${locale}/docs/Web/CSS/perspective`,
  [`/${locale}/Apps/app_layout/responsive_design_building_blocks`]:
    `/${locale}/docs/Web/Progressive_web_apps/Responsive/responsive_design_building_blocks`,
  [`/${locale}/docs/DOM/CSS`]:
    `/${locale}/docs/Web/CSS/Reference`,
  [`/${locale}/docs/Web/CSS/-webkit-transform-style`]:
    `/${locale}/docs/Web/CSS/transform-style`,
  [`/${locale}/DOM/document.async`]:
    `/${locale}/docs/Web/API/XMLDocument/async`,
  [`/${locale}/docs/Project:Custom_templates`]:
    `/${locale}/docs/MDN/Contribute/Content/Custom_macros`,
  [`/${locale}/docs/Project:MDN/Contributing/Custom_macros`]:
    `/${locale}/docs/MDN/Contribute/Content/Custom_macros`,
  [`/${locale}/Apps/App_developer_tools`]:
    `/${locale}/docs/Tools`,
  [`/${locale}/docs/Web/HTML/Canvas/Tutorial/Basic_animations`]:
    `/${locale}/docs/Web/API/Canvas_API/Tutorial/Basic_animations`,
  [`/${locale}/docs/Core_JavaScript_1.5_Reference/Operators/Special_Operators/instanceof_Operator`]:
    `/${locale}/docs/Web/JavaScript/Reference/Operators/instanceof`,
  [`/${locale}/DOM/EventTarget`]:
    `/${locale}/docs/Web/API/EventTarget`,
  [`/${locale}/docs/Web/CSS/-webkit-animation-direction`]:
    `/${locale}/docs/Web/CSS/animation-direction`,
  [`/${locale}/docs/Mozilla/Add-ons/WebExtensions/Alternative_distribution_options/Sideloading_add-ons`]:
    `/${locale}/docs/Mozilla/Add-ons/WebExtensions/Distribution_options/Sideloading_add-ons`,
  [`/${locale}/DOM/XMLHttpRequest/FormData`]:
    `/${locale}/docs/Web/API/FormData`,
  [`/${locale}/docs/Web/Apps/Developing/Optimizing_startup_performance`]:
    `/${locale}/docs/Web/Performance/Optimizing_startup_performance`,
  [`/${locale}/docs/JavaScript`]:
    `/${locale}/docs/Web/JavaScript`,
  [`/${locale}/docs/Tools/Responsive_Design_Mode`]:
    `/${locale}/docs/Tools/Responsive_Design_View`,
  [`/${locale}/docs/CSS:text-align`]:
    `/${locale}/docs/Web/CSS/text-align`,
  [`/${locale}/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-invalid_property`]:
    `/${locale}/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-invalid_attribute`,
  [`/${locale}/docs/CSS:font-size-adjust`]:
    `/${locale}/docs/Web/CSS/font-size-adjust`,
  [`/${locale}/docs/CSS:border`]:
    `/${locale}/docs/Web/CSS/border`,
  [`/${locale}/docs/Accessible_DHTML`]:
    `/${locale}/docs/Web/Accessibility/ARIA`,
  '/en-US/docs/Web/Events/readystatechange':
    `/${locale}/docs/Web/Events/readystatechange_event`,
  '/en/DOM/window.setTimeout':
    `/${locale}/docs/Web/API/Window/setTimeout`,
  '/en-US/docs/DOM/event.charCode':
    `/${locale}/docs/Web/API/KeyboardEvent/charCode`,
  [`/${locale}/docs/Web/CSS/en-US/docs/Web/API/WebVTT_API`]:
    `/${locale}/docs/Web/API/WebVTT_API`,
  // from https://developer.mozilla.org/zh-CN/docs/Glossary/JavaScript
  [`/${locale}/docs/Glossary/a%20href=%22/en-US/docs/Glossary/Microsoft_Internet_Explorer%22%20title=%22Internet%20Explorer%203.0:%20Internet%20Explorer%20%28or%20IE%29%20is%20a%20free%20graphical%20browser%20maintained%20by%20Microsoft%20for%20legacy%20enterprise%20uses.%20Microsoft%20Edge%20is%20currently%20the%20default%20Windows%20browser.%22%20class=%22glossaryLink%22%3EInternet%20Explorer%203.0%3C/a`]:
    `/${locale}/docs/Glossary/Microsoft_Internet_Explorer`,
  [`/${locale}/docs/Web/API/en-US/docs/Server-sent_events/Using_server-sent_events`]:
    `/${locale}/docs/Server-sent_events/Using_server-sent_events`,
  [`/${locale}/docs/Web/Accessibility/Understanding_WCAG/en-US/docs/Web/Accessibility/Understanding_WCAG`]:
    `/${locale}/docs/Web/Accessibility/Understanding_WCAG`,
  [`/${locale}/docs/Web/CSS/en-US/docs/Web/CSS`]:
    `/${locale}/docs/Web/CSS`,
  '/zh-CN/docs/Glossary/%E7%94%A8%E6%88%B7%E4%BB%A3%E7%90%86':
    `/${locale}/docs/Glossary/User_Agent`,
  [`/${locale}/docs/Web/Reference/Events/slotchange`]:
    `/${locale}/docs/Web/API/HTMLSlotElement/slotchange_event`,
  [`/${locale}/Web_Development/Responsive_Web_design`]:
    `/${locale}/docs/Web_Development/Mobile/Responsive_design`,
  [`/${locale}/docs/Web/CSS/Using_CSS_gradients`]:
    `/${locale}/docs/Web/CSS/CSS_Images/Using_CSS_gradients`,
  [`/${locale}/docs/Web/API/Element/style`]:
    `/${locale}/docs/Web/API/HTMLElement/style`,
  '/zh-CN/docs/Web/Media/Overview':
    `/${locale}/docs/Web/Media`,
  [`/${locale}/docs/Web/Events/readystatechange`]:
    `/${locale}/docs/Web/API/Document/readystatechange_event`,
  [`/${locale}/docs/Web/API/Document/onreadystatechange`]:
    `/${locale}/docs/Web/API/Document/readystatechange_event`,
  [`/${locale}/docs/Web/API/Element/childNodes`]:
    `/${locale}/docs/Web/API/Node/childNodes`,
  [`/${locale}/docs/Web/API/Element/blur`]:
    `/${locale}/docs/Web/API/HTMLElement/blur`,
  [`/${locale}/docs/DOM/span`]:
    `/${locale}/docs/Web/HTML/Element/span`,
  [`/${locale}/docs/Web/API/span`]:
    `/${locale}/docs/Web/API/HTMLSpanElement`,
  [`/${locale}/docs/Web/HTML/Element/%20object`]:
    `/${locale}/docs/Web/HTML/Element/object`,
  [`/${locale}/docs/Web/API/Element/firstChild`]:
    `/${locale}/docs/Web/API/Node/firstChild`,
  [`/${locale}/docs/Web/API/Element/nextSibling`]:
    `/${locale}/docs/Web/API/Node/nextSibling`,
  [`/${locale}/docs/Web/API/Element/lastChild`]:
    `/${locale}/docs/Web/API/Node/lastChild`,
  [`/${locale}/docs/Web/API/Element/parentNode`]:
    `/${locale}/docs/Web/API/Node/parentNode`,
  [`/${locale}/docs/Web/API/Element/removeChild`]:
    `/${locale}/docs/Web/API/Node/removeChild`,
  [`/${locale}/docs/Web/API/Element/previousSibling`]:
    `/${locale}/docs/Web/API/Node/previousSibling`,
  [`/${locale}/docs/Web/API/Element/insertBefore`]:
    `/${locale}/docs/Web/API/Node/insertBefore`,
  [`/${locale}/docs/Web/API/Element/onclick`]:
    `/${locale}/docs/Web/API/HTMLElement/onclick`,
  [`/${locale}/docs/Web/API/TableRow/insertCell`]:
    `/${locale}/docs/Web/API/HTMLTableRowElement/insertCell`,
  [`/${locale}/docs/Web/API/Element/NodeList`]:
    `/${locale}/docs/Web/API/NodeList`,
  [`/${locale}/docs/Web/API/HTML/Element/script`]:
    `/${locale}/docs/Web/API/HTMLScriptElement`,
  [`/${locale}/SVG/Content_type`]:
    `/${locale}/docs/Web/SVG/Content_type`,
  [`/${locale}/SVG/Content_type`]:
    `/${locale}/docs/Web/SVG/Content_type`,
  [`/${locale}/SVG/Namespaces_Crash_Course`]:
    `/${locale}/docs/Web/SVG/Namespaces_Crash_Course`,
  [`/${locale}/SVG/Attribute`]:
    `/${locale}/docs/Web/SVG/Attribute`,
  [`/${locale}/SVG/Compatibility_sources`]:
    `/${locale}/docs/Web/SVG/Compatibility_sources`,
  [`/${locale}/SVG/Tutorial/Filter_effects`]:
    `/${locale}/docs/Web/SVG/Tutorial/Filter_effects`,
  [`/${locale}/SVG/Element/rect`]:
    `/${locale}/docs/Web/SVG/Element/rect`,
  [`/${locale}/SVG/Element/circle`]:
    `/${locale}/docs/Web/SVG/Element/circle`,
  [`/${locale}/SVG/Tutorial/Paths`]:
    `/${locale}/docs/Web/SVG/Tutorial/Paths`,
  [`/${locale}/SVG/Tutorial/Positions`]:
    `/${locale}/docs/Web/SVG/Tutorial/Positions`,
  [`/${locale}/SVG/Element/polygon`]:
    `/${locale}/docs/Web/SVG/Element/polygon`,
  [`/${locale}/SVG/Element/defs`]:
    `/${locale}/docs/Web/SVG/Element/defs`,
  [`/${locale}/SVG/Tutorial/SVG_Fonts`]:
    `/${locale}/docs/Web/SVG/Tutorial/SVG_Fonts`,
  [`/${locale}/SVG/SVG_animation_with_SMIL`]:
    `/${locale}/docs/Web/SVG/SVG_animation_with_SMIL`,
  [`/${locale}/docs/Web/HTML/Element/svg`]:
    `/${locale}/docs/Web/SVG/Element/svg`,
  [`/${locale}/docs/Web/Events/fullscreen`]:
    `/${locale}/docs/Web/API/Document/fullscreenchange_event`,
  [`/${locale}/docs/Web/JavaScript/Reference/new`]:
    `/${locale}/docs/Web/JavaScript/Reference/Operators/new`,
  [`/${locale}/docs/DOM/HTMLVideoElement`]:
    `/${locale}/docs/Web/API/HTMLVideoElement`,
  [`/${locale}/docs/Web/API/Element/NodeList`]:
    `/${locale}/docs/Web/API/NodeList`,
  [`/${locale}/docs/Web/API/Element/dataset`]:
    `/${locale}/docs/Web/API/HTMLElement/dataset`,
  [`/${locale}/docs/Web/API/Element/click`]:
    `/${locale}/docs/Web/API/HTMLElement/click`,
  [`/${locale}/docs/Web/API/Element/focus`]:
    `/${locale}/docs/Web/API/HTMLElement/focus`,
  [`/${locale}/docs/Web/API/Element/onkeypress`]:
    `/${locale}/docs/Web/API/HTMLElement/onkeypress`,
  [`/${locale}/docs/Web/API/Element/onkeydown`]:
    `/${locale}/docs/Web/API/HTMLElement/onkeydown`,
  [`/${locale}/docs/Web/API/Element/dir`]:
    `/${locale}/docs/Web/API/HTMLElement/dir`,
  [`/${locale}/docs/Web/API/Element/onkeyup`]:
    `/${locale}/docs/Web/API/HTMLElement/onkeyup`,
  [`/${locale}/docs/Web/API/Element/oncontextmenu`]:
    `/${locale}/docs/Web/API/HTMLElement/oncontextmenu`,
  [`/${locale}/docs/Web/API/Element/isContentEditable`]:
    `/${locale}/docs/Web/API/HTMLElement/isContentEditable`,
  [`/${locale}/docs/Web/API/Element/contenteditable`]:
    `/${locale}/docs/Web/API/HTMLElement/contentEditable`,
  [`/${locale}/docs/Web/API/Element/contentEditable`]:
    `/${locale}/docs/Web/API/HTMLElement/contentEditable`,
  [`/${locale}/docs/Web/API/Element/transitionend_event`]:
    `/${locale}/docs/Web/API/HTMLElement/transitionend_event`,
  [`/${locale}/docs/Web/API/Element/offsetWidth`]:
    `/${locale}/docs/Web/API/HTMLElement/offsetWidth`,
  [`/${locale}/docs/Web/API/Element/textContent`]:
    `/${locale}/docs/Web/API/Node/textContent`,
  [`/${locale}/docs/Web/API/Document/en/HTML/Element/a`]:
    `/${locale}/docs/Web/HTML/Element/a`,
  [`/${locale}/docs/Web/HTML/Element/%3Cvideo%3E`]:
    `/${locale}/docs/Web/HTML/Element/video`,
  [`/${locale}/docs/Web/API/Element/createTextRange`]:
    `/${locale}/docs/Web/API/Document/createRange`,
  [`/${locale}/docs/Web/HTML/Element/referrer`]:
    `/${locale}/docs/Web/API/Document/referrer`,
  [`/${locale}/docs/Web/SVG/Element/foreignObjects`]:
    `/${locale}/docs/Web/SVG/Element/foreignObject`,
  [`/${locale}/docs/Web/HTML/Element/input/%3Cinput_type=_tel_%3E`]:
    `/${locale}/docs/Web/HTML/Element/input/tel`,
  [`/${locale}/docs/Web/HTML/Element/%3Cimg%3E`]:
    `/${locale}/docs/Web/HTML/Element/img`,
  [`/${locale}/docs/Web/CSS/Web/Events/pointermove`]:
    `/${locale}/docs/Web/API/HTMLElement/pointermove_event`,
  [`/${locale}/docs/Web/Reference/Events/search`]:
    `/${locale}/docs/Web/API/HTMLInputElement/search_event`,
  [`/${locale}/docs/Web/Reference/Events/message`]:
    `/${locale}/docs/Web/API/BroadcastChannel/message_event`,
  [`/${locale}/docs/Web/Reference/Events/message_%28ServiceWorker%29`]:
    `/${locale}/docs/Web/API/ServiceWorkerGlobalScope/message_event`,
  [`/${locale}/docs/Web/Reference/Events/cancel`]:
    `/${locale}/docs/Web/API/HTMLDialogElement/cancel_event`,
  [`/${locale}/docs/Web/Reference/Events/close`]:
    `/${locale}/docs/Web/API/HTMLDialogElement/close_event`,
  [`/${locale}/docs/Web/Reference/Events/FontFaceSetLoadEvent`]:
    `/${locale}/docs/Web/API/FontFaceSetLoadEvent`,
  [`/${locale}/docs/Web/Reference/Events/addtrack`]:
    `/${locale}/docs/Web/API/MediaStream/addtrack_event`,
  [`/${locale}/docs/Web/Reference/Events/muted`]:
    `/${locale}/docs/Web/API/MediaStreamTrack/mute_event`,
  [`/${locale}/docs/Web/Reference/Events/unmuted`]:
    `/${locale}/docs/Web/API/MediaStreamTrack/unmute_event`,
  [`/${locale}/docs/Web/Reference/Events/ended%20%28MediaStreamTrack%29`]:
    `/${locale}/docs/Web/API/MediaStreamTrack/ended_event`,
  [`/${locale}/docs/Web/Reference/Events/removetrack`]:
    `/${locale}/docs/Web/API/MediaStream/removetrack_event`,
  [`/${locale}/docs/Learn/WebGL`]:
    `/${locale}/docs/Web/API/WebGL_API/Tutorial`,
  [`/${locale}/docs/DOM/event/keypress`]:
    `/${locale}/docs/Web/API/Document/keypress_event`,
  [`/${locale}/docs/DOM/Event/UIEvent/KeyboardEvent`]:
    `/${locale}/docs/Web/API/KeyboardEvent`,
  [`/${locale}/docs/DOM/HTMLBaseFontElement`]:
    `/${locale}/docs/Web/API/HTMLBaseFontElement`,
  [`/${locale}/docs/Web/API/DOM_Events`]:
    `/${locale}/docs/Web/API/Document_Object_Model/Events`,
  [`/${locale}/docs/DOM/element.contextmenu`]:
    `/${locale}/docs/Web/HTML/Global_attributes/contextmenu`,
  [`/${locale}/docs/Web/DOM/Window`]:
    `/${locale}/docs/Web/API/Window`,
  [`/${locale}/docs/DOM/element.appendChild`]:
    `/${locale}/docs/Web/API/Node/appendChild`,
  [`/${locale}/docs/DOM/element.isSupported`]:
    `/${locale}/docs/Web/API/Node/isSupported`,
  [`/${locale}/docs/DOM/element.scrollHeight`]:
    `/${locale}/docs/Web/API/Element/scrollHeight`,
  [`/${locale}/docs/DOM/element.isDefaultNamespace`]:
    `/${locale}/docs/Web/API/Node/isDefaultNamespace`,
  [`/${locale}/DOM_Mutation_Observers`]:
    `/${locale}/docs/Web/API/MutationObserver`,
  [`/${locale}/docs/Web/API/DOM_event_reference/input`]:
    `/${locale}/docs/Web/API/InputEvent/InputEvent`,
  [`/${locale}/docs/Web/Reference/Events/abort_%28dom_abort_api%29`]:
    `/${locale}/docs/Web/API/AbortSignal/abort_event`,
  [`/${locale}/DOMString`]:
    `/${locale}/docs/Web/API/DOMString`,
  [`/${locale}/DOMParser`]:
    `/${locale}/docs/Web/API/DOMParser`,
  [`/${locale}/docs/Web/API/Window/DOMPoint`]:
    `/${locale}/docs/Web/API/DOMPoint`,
  [`/${locale}/docs/Web/API/Window/DOMMatrix`]:
    `/${locale}/docs/Web/API/DOMMatrix`,
  [`/${locale}/docs/Web/API/Window/DOMMatrixReadOnly`]:
    `/${locale}/docs/Web/API/DOMMatrixReadOnly`,
  [`/${locale}/docs/Web/API/Window/DOMQuad`]:
    `/${locale}/docs/Web/API/DOMQuad`,
  [`/${locale}/docs/Web/API/Window/DOMRect`]:
    `/${locale}/docs/Web/API/DOMRect`,
  [`/${locale}/docs/Web/API/Window/DOMRectReadOnly`]:
    `/${locale}/docs/Web/API/DOMRectReadOnly`,
  [`/${locale}/docs/Web/JavaScript/Reference/DOMException`]:
    `/${locale}/docs/Web/API/DOMException`,
});

export const mdnLocaleRedirectPath = (locale: string): Record<string, string> => {
  if (locale !== 'zh-CN') {
    return {};
  }
  return {
    // readystatechange event
    ['/en-US/docs/Web/Events/readystatechange']:
      '/zh-CN/docs/Web/API/Document/readystatechange_event',
    ['/zh-CN/docs/Web/Events/readystatechange']:
      '/zh-CN/docs/Web/API/Document/readystatechange_event',
    ['/en-US/docs/Web/Reference/Events/readystatechange']:
      '/zh-CN/docs/Web/API/Document/readystatechange_event',
    ['/zh-CN/docs/Web/Reference/Events/readystatechange']:
      '/zh-CN/docs/Web/API/Document/readystatechange_event',
    ['/zh-CN/docs/Web/Events/readystatechange_event']:
      '/zh-CN/docs/Web/API/Document/readystatechange_event'
  };
};

export const hardCodedRedirectUrl: Record<string, string> = {
  // https://github.com/mdn/yari/pull/39
  'http://w3c.org/2008/site/images/favicon.ico':
    'https://developer.mozilla.org/favicon.ico',
  'https://w3c.org/2008/site/images/favicon.ico':
    'https://developer.mozilla.org/favicon.ico',
  'https://mozorg.cdn.mozilla.net/media/img/favicon.ico':
    'https://developer.mozilla.org/favicon.ico',
  'http://mozorg.cdn.mozilla.net/media/img/favicon.ico':
    'https://developer.mozilla.org/favicon.ico',
  'http://www.mozilla.org/favicon.ico':
    'https://developer.mozilla.org/favicon.ico',
  'https://www.mozilla.org/favicon.ico':
    'https://developer.mozilla.org/favicon.ico',
  'https://developer.cdn.mozilla.net/media/redesign/img/favicon32.png':
    'https://developer.mozilla.org/favicon.ico',
  'http://developer.cdn.mozilla.net/media/redesign/img/favicon32.png':
    'https://developer.mozilla.org/favicon.ico',
  // fake url, prevent external downloads
  'http://weloveiconfonts.com/api/?family=entypo':
    'https://developer.mozilla.org/static/css/inject.css',
  // fake url, prevent external downloads
  'https://weloveiconfonts.com/api/?family=entypo':
    'https://developer.mozilla.org/static/css/inject.css',
  // This video is only used once, but result in ~40M
  // https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Solve_HTML_problems/Cheatsheet
  'https://archive.org/download/ElephantsDream/ed_hd.ogv':
    'https://mdn.github.io/dom-examples/picture-in-picture/assets/bigbuckbunny.mp4',
};
