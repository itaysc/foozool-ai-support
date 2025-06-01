// import mongoose from 'mongoose';
// import { getAsync, setAsync, lPushAsync, lTrimAsync } from '../redis';

// const defaultCacheTime = 60 * 10; // 10 minutes

// declare module 'mongoose' {
//   interface Query<ResultType, DocType, THelpers = {}, RawDocType = DocType> {
//     cache(cacheOptions: { organizationId: string, maxItems: number, cacheTime?: number }): this;
//     _cache?: boolean;
//     _cacheTime?: number;
//     _organizationId?: string;
//     _maxItems?: number;
//   }
// }


// mongoose.Query.prototype.cache = function ({ maxItems=5, organizationId, cacheTime = defaultCacheTime }: { maxItems: number, organizationId?: string, cacheTime?: number }) {
//   const queryObj = this.getQuery();
//   if (!organizationId) {
//     this._organizationId = queryObj.organizationId; // Extract organizationId from query
//   } else {
//     this._organizationId = organizationId;
//   }
//   if (!this._organizationId) {
//     throw new Error('organizationId must be specified in the query or provided explicitly');
//   }
//   this._cache = true;
//   this._cacheTime = cacheTime;
//   this._maxItems = maxItems;
//   return this;
// };

// const exec = mongoose.Query.prototype.exec;

// mongoose.Query.prototype.exec = async function () {
//   if (!this._cache) {
//     return exec.apply(this, arguments as any);
//   }

//   const key = JSON.stringify({
//     query: this.getQuery(),
//     collection: this.mongooseCollection.name,
//     organizationId: this._organizationId
//   });

//   // Check the cache
//   const cacheValue = await getAsync(key);
//   if (cacheValue) {
//     const doc = JSON.parse(cacheValue);
//     return Array.isArray(doc)
//       ? doc.map((d: any) => new this.model(d))
//       : new this.model(doc);
//   }

//   // Not found in cache, proceed with the query
//   const result = await exec.apply(this, arguments as any);

//   // Store the result in the cache
//   await setAsync(key, JSON.stringify(result), 'EX', this._cacheTime);

//   // Update organization cache list
//   const orgCacheKey = `org:${this._organizationId}`;
//   await lPushAsync(orgCacheKey, key);
//   await lTrimAsync(orgCacheKey, 0, this._maxItems - 1); // Keep only the latest maxItems

//   return result;
// };