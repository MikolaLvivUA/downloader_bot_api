export enum LinksRegExEnum {
    INSTAGRAM_LINK_REGEX = '^(?:https?:\\/\\/)?(?:www\\.|m\\.)?(?:instagram\\.com|instagr\\.am)\\/(?:p|reels?|tv)\\/[A-Za-z0-9_-]+\\/?(?:\\?[^\\s#]*)?(?:#[^\\s]*)?$',
    TIKTOK_LINK_REGEX = '^(?:https?:\\/\\/)?(?:www\\.|m\\.|vm\\.|vt\\.)?tiktok\\.com\\/' +
        '(?:@[^\\/\\s]+\\/video\\/\\d+|\\w+\\/\\d+(?:\\.html)?|[A-Za-z0-9_-]+\\/?)' +
        '(?:\\?[^\\s#]*)?(?:#[^\\s]*)?$'
}