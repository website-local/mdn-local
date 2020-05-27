import {Client, ClientOptions} from "@elastic/elasticsearch";
import {SearchBody} from "elastic-ts";

export type ElasticSearchBody = SearchBody;
export type ElasticSearchClient = Client;

export default interface SearchConfig {
    port: number;
    rootDir: string;
    logPath: string;
    templatePage?: string;
    injectCssFile?: string;
    locale: string;
    esIndex: string;
    elasticsearch: ClientOptions;
    maxSearchStringLength: number;
    pageSize: number;
    workersForBuildingIndex?: number;
    text: {
        beforeTitle: string;
        afterTitle: string;
        results: string;
        search: string;
        previousPage: string;
        nextPage: string;
        openSearch: string;
        closeSearch: string;
        meta: string[];
    };

    esIndexSetting?: object;
    esIndexMapping?: object;
}
