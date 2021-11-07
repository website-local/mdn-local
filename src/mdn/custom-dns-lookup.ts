import CacheableLookup, {
  EntryObject, Options
} from 'cacheable-lookup';

export function preferIpv6Comparator(a: EntryObject, b: EntryObject): number {
  return b.family - a.family;
}

export class CustomDnsLookup extends CacheableLookup {
  public preferIpv6 = false;

  constructor(options?: Options) {
    super(options);
  }

  async query(hostname: string): Promise<ReadonlyArray<EntryObject>> {
    const cached = await super.query(hostname);
    if (this.preferIpv6) {
      return cached.slice().sort(preferIpv6Comparator);
    }
    return cached;
  }
}
