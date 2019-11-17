import URI from 'urijs'
import * as got from "got";
import {Cheerio, CheerioStatic} from "cheerio";


interface Options {
    beginUrl: string | string[];
    localRoot: string;
    depth?: number;
    concurrency?: number;
    req?: got.GotBodyOptions;
    encoding?: Encoding;
    urlFilter?: UrlFilterFunc;
    cacheUri?: boolean;
    detectLinkType?: DetectTypeFunc,
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