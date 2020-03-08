import URI from 'urijs'
import * as got from "got";
import * as cheerio from "cheerio";

type CheerioStatic = ReturnType<typeof cheerio.load>;
type Cheerio = ReturnType<CheerioStatic>;

interface Options {
    beginUrl: string | string[];
    localRoot: string;
    depth?: number;
    concurrency?: number;
    req?: got.Options;
    encoding?: Encoding;
    urlFilter?: UrlFilterFunc;
    cacheUri?: boolean;
    detectLinkType?: DetectTypeFunc,
    preProcessResource?: PreProcessResourceFunc;
    preProcessHtml?: HtmlProcessFunc;
    postProcessHtml?: HtmlProcessFunc;
    linkRedirectFunc?: LinkRedirectFunc;
    redirectFilterFunc?: RequestRedirectFunc;
    skipProcessFunc?: SkipProcessFunc;
    requestRedirectFunc?: RequestRedirectFunc;
    dropResourceFunc?: DropResourceFunc;
    onSuccess?: Function;
    onError?: Function;
    detectIncompleteHtml?: '</html>' | '</body>' | string;
    adjustConcurrencyPeriod: number;

    adjustConcurrencyFunc?(downloader: any): void;
}

interface Encoding {
    buffer: null;
    html: string;
    css: string;
}

interface UrlFilterFunc {
    (url: string): string;
}

interface DetectTypeFunc {
    (link: string, elem: Cheerio, res: HtmlResource): 'html' | 'css' | Promise<string>;
}

interface HtmlProcessFunc {
    ($: CheerioStatic, res: HtmlResource): CheerioStatic;
}

interface RequestRedirectFunc {
    (url: string, res: Link): string | void;
}

interface LinkRedirectFunc {
    (url: string, element: Cheerio | null, parent: HtmlResource): string;
}

interface SkipProcessFunc {
    (url: string, element: Cheerio | null, parent?: HtmlResource): boolean;
}

interface PreProcessResourceFunc {
    (url: string, element: Cheerio | null, res?: Resource, parent?: Resource): void;
}

interface DropResourceFunc {
    (res: Resource): boolean;
}

interface Body {
}

declare class Link {
    constructor(url: string, localRoot: string, refUrl: string, options: Options);

    createTimestamp: number;
    downloadStartTimestamp?: number;
    finishTimestamp?: number;
    waitTime?: number;
    downloadTime?: number;
    options: Options;
    encoding: string | null;
    refUri: URI;
    refUrl: string;
    uri: URI;
    savePath: string;
    localRoot: string;
    private _downloadLink: string;
    public depth: number;
    url: string;
    body: null | Body;

    equals(link: Link): boolean;

    toString(): string;

    fetch(): Promise<Body>;

    save(): Promise<any>;
}

declare class Resource extends Link {
    constructor(url: string, localRoot: string, refUrl: string, options: Options);

    readonly replaceStr: string;
    private _url: string;
    public replacePath: URI;
    serverPath: string;
}

declare class HtmlResource extends Resource {
    constructor(url: string, localRoot: string, refUrl: string, options: Options);

    private __appendSuffix(suffix: string): void;

    doc?: CheerioStatic;
    readonly html?: string;
}

declare class CssResource extends Resource {
    urls?: string[];
}

declare class SiteMapResource extends Resource {

}

declare interface MdnReactData {
    locale?: string;
    pluralExpression?: string | number;
    url?: string;
    stringCatalog?: {
        [k: string]: string | string[]
    };
    documentData?: {
        absoluteURL?: string;
        bodyHTML?: string;
        enSlug?: string;
        hrefLang?: string;
        id?: number | string;
        language?: string;
        lastModified?: string;
        locale?: string;
        parents?: {
            url: string;
            title: string;
        }[];
        quickLinksHTML?: string;
        raw?: string;
        slug?: string;
        summary?: string;
        title?: string;
        tocHTML?: string;
        translateURL?: null | any;
        translationStatus?: null | any;
        translations: {
            hrefLang?: string;
            language?: string;
            locale?: string;
            localizedLanguage?: string;
            title?: string;
            url?: string;
        }[];
        wikiURL?: string;
    }
}

declare interface MdnAssets {
    css?: {
        [k: string]: string[];
    };
    js?: {
        [k: string]: string[];
    };
}