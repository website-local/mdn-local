export declare interface MdnSearchTemplate {
    styleSheetUrls: string[];
    icon: string;
    header: string;
    searchStyle: string;
    injectCss: string;
    searchScript: string;
}

export default function initTemplate(): Promise<MdnSearchTemplate>;
