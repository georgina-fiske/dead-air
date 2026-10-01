// What a press release is allowed to contain. Used by the editor (browser) and the server.
// Everything else (scripts, styles, forms, event handlers, iframes) is removed.
export const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "hr", "img"];
// "class" is allowed only so a paragraph or subheading can be centred. Any other class is removed.
export const ALLOWED_ATTR = ["href", "src", "alt", "class"];
export const CENTRE_CLASS = "ctr";
