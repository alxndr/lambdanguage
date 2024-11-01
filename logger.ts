// TODO would be nice to create/expose this log fn using a class decorator, but might not be possible...
export const makeLogger = (prefix:string) => (...msgs:any[]) => console.log(prefix, ...msgs)
