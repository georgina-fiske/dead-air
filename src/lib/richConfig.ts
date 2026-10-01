// What a press release is allowed to contain. Used by the editor (browser) and the server.
// Everything else (scripts, styles, forms, event handlers, iframes) is removed.
export const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "hr", "img"];
export const ALLOWED_ATTR = ["href", "src", "alt"];
